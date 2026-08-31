"""Field extraction — spaCy NER + regex + ``phonenumbers``.

Ported from the legacy service with the same two-tier strategy (try the NLP
entity, fall back to a heuristic scan). The only structural change: the spaCy
``Language`` is injected instead of read from a module global.
"""

from __future__ import annotations

import phonenumbers
import structlog
from phonenumbers import NumberParseException, PhoneNumberFormat
from spacy.language import Language
from spacy.tokens import Doc

from card_reader.constants.parsing import (
    COMPANY_SHORT_SUFFIX_RE,
    COMPANY_SUFFIX_RE,
    EMAIL_RE,
    JOB_TITLE_TOKENS,
    LEADING_BULLET_RE,
    LEADING_ENUM_RE,
    MIN_PHONE_DIGITS,
    NAME_TOKEN_RE,
    NOISE_CHARS,
    PHONE_ALT_RE,
    PHONE_MATCH_REGIONS,
    PHONE_PLUS_RE,
    PHONE_RE,
    SPACY_GPE_LABEL,
    SPACY_ORG_LABEL,
    SPACY_PERSON_LABEL,
    STREET_RE,
    URL_RE,
)
from card_reader.schemas.contact import ContactCard
from card_reader.services.ocr import OcrLine

logger = structlog.get_logger(__name__)


class ContactParser:
    def __init__(self, nlp: Language, *, default_region: str) -> None:
        self._nlp = nlp
        self._region = default_region

    # ── Public API ───────────────────────────────────────────────────────────

    def parse(self, lines: list[OcrLine]) -> ContactCard:
        texts = [cleaned for line in lines if (cleaned := _clean_text(line.text))]
        full_text = "\n".join(texts)
        doc = self._nlp(full_text)

        emails = self._emails(full_text, doc)
        phones = self._phones(full_text)
        websites = self._websites(full_text)
        job_title = self._job_title(texts, doc)
        address = self._address(texts, doc)
        name = self._name(texts, doc, websites, job_title, address)
        company = self._company(texts, doc, name, job_title, address)

        return ContactCard(
            name=name,
            job_title=job_title,
            company=company,
            emails=emails,
            phones=phones,
            websites=websites,
            address=address,
            raw_text=texts,
        )

    # ── Emails ───────────────────────────────────────────────────────────────

    def _emails(self, full_text: str, doc: Doc) -> list[str]:
        emails = list(dict.fromkeys(EMAIL_RE.findall(full_text)))
        if emails:
            return emails
        found: set[str] = set()
        for token in doc:
            text = token.text
            if "@" in text and "." in text and EMAIL_RE.match(text):
                found.add(text)
        return list(found)

    # ── Phones ───────────────────────────────────────────────────────────────

    def _phones(self, full_text: str) -> list[str]:
        raw = PHONE_RE.findall(full_text) or PHONE_ALT_RE.findall(full_text)
        phones: list[str] = []
        for candidate in raw:
            if len(_only_digits(candidate)) < MIN_PHONE_DIGITS:
                continue
            formatted = self._format_phone(candidate)
            if formatted:
                phones.append(formatted)
        phones = list(dict.fromkeys(phones))
        if phones:
            return phones
        return self._phones_advanced(full_text)

    def _format_phone(self, raw_phone: str) -> str | None:
        try:
            parsed = phonenumbers.parse(raw_phone.strip(), self._region)
        except NumberParseException:
            parsed = None
        if parsed is not None and phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, PhoneNumberFormat.E164)

        digits = _only_digits(raw_phone)
        if len(digits) < MIN_PHONE_DIGITS:
            return None
        if len(digits) == 10:
            digits = "1" + digits
        if len(digits) >= 11:
            return "+" + digits
        return None

    def _phones_advanced(self, full_text: str) -> list[str]:
        phones: set[str] = set()
        for region in PHONE_MATCH_REGIONS:
            for phone_match in phonenumbers.PhoneNumberMatcher(full_text, region):
                phones.add(phonenumbers.format_number(phone_match.number, PhoneNumberFormat.E164))
        for plus_match in PHONE_PLUS_RE.finditer(full_text):
            digits = _only_digits(plus_match.group(0))
            if len(digits) >= MIN_PHONE_DIGITS:
                phones.add("+" + digits)
        return list(phones)

    # ── Websites ─────────────────────────────────────────────────────────────

    def _websites(self, full_text: str) -> list[str]:
        return list(
            dict.fromkeys(
                url
                for url in URL_RE.findall(full_text)
                if "@" not in url and len(url) > 5 and "." in url
            )
        )

    # ── Job title ────────────────────────────────────────────────────────────

    def _job_title(self, texts: list[str], doc: Doc) -> str | None:
        for ent in doc.ents:
            if ent.label_ in (SPACY_PERSON_LABEL, SPACY_ORG_LABEL):
                continue
            if any(tok.text.lower() in JOB_TITLE_TOKENS for tok in ent):
                return str(ent.text)
        return _first_line_with_title_token(texts)

    # ── Address ──────────────────────────────────────────────────────────────

    def _address(self, texts: list[str], doc: Doc) -> str | None:
        locations = [ent.text for ent in doc.ents if ent.label_ == SPACY_GPE_LABEL]
        street_parts = [line for line in texts if STREET_RE.search(line)]
        parts = [*street_parts, *locations]
        if parts:
            return ", ".join(dict.fromkeys(parts))
        return None

    # ── Name ─────────────────────────────────────────────────────────────────

    def _name(
        self,
        texts: list[str],
        doc: Doc,
        websites: list[str],
        job_title: str | None,
        address: str | None,
    ) -> str | None:
        skip = _skip_set(job_title=job_title, address=address)
        for ent in doc.ents:
            if ent.label_ != SPACY_PERSON_LABEL:
                continue
            candidate = _normalise_ws(ent.text)
            if not candidate or candidate in skip:
                continue
            if any(candidate in url or url in candidate for url in websites):
                continue
            if set(candidate.lower().split()) & JOB_TITLE_TOKENS:
                continue
            if _looks_like_name(candidate):
                return candidate
        return _heuristic_name(texts, skip, websites)

    # ── Company ──────────────────────────────────────────────────────────────

    def _company(
        self,
        texts: list[str],
        doc: Doc,
        name: str | None,
        job_title: str | None,
        address: str | None,
    ) -> str | None:
        skip = _skip_set(name=name, job_title=job_title, address=address)
        for ent in doc.ents:
            if ent.label_ != SPACY_ORG_LABEL:
                continue
            candidate = _normalise_ws(ent.text)
            if not candidate or candidate in skip:
                continue
            if COMPANY_SUFFIX_RE.search(candidate) or COMPANY_SHORT_SUFFIX_RE.search(candidate):
                return candidate
        return _heuristic_company(texts, skip)


# ── Module-level helpers (no state) ──────────────────────────────────────────


def _normalise_ws(text: str) -> str:
    """Collapse internal runs of whitespace (a spaCy entity can span an OCR
    line break) so a returned name/company is a single clean line."""
    return " ".join(str(text).split())


def _clean_text(text: str) -> str:
    for char in NOISE_CHARS:
        text = text.replace(char, "")
    text = LEADING_BULLET_RE.sub("", text)
    text = LEADING_ENUM_RE.sub("", text)
    return text.strip()


def _only_digits(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit())


def _looks_like_name(candidate: str) -> bool:
    words = candidate.split()
    return 1 <= len(words) <= 4 and all(NAME_TOKEN_RE.match(word) for word in words)


def _skip_set(
    *,
    name: str | None = None,
    job_title: str | None = None,
    address: str | None = None,
) -> set[str]:
    skip = {value for value in (name, job_title, address) if value}
    if address:
        skip.update(part.strip() for part in address.split(","))
    return skip


def _first_line_with_title_token(texts: list[str]) -> str | None:
    for line in texts:
        if set(line.lower().split()) & JOB_TITLE_TOKENS:
            return line
    return None


def _heuristic_name(texts: list[str], skip: set[str], websites: list[str]) -> str | None:
    for line in texts:
        candidate = line.strip()
        if not candidate or candidate in skip:
            continue
        if EMAIL_RE.search(candidate) or PHONE_RE.search(candidate):
            continue
        if any(candidate in url or url in candidate for url in websites):
            continue
        if set(candidate.lower().split()) & JOB_TITLE_TOKENS:
            continue
        if COMPANY_SUFFIX_RE.search(candidate):
            continue
        if _looks_like_name(candidate):
            return candidate
    return None


def _heuristic_company(texts: list[str], skip: set[str]) -> str | None:
    for line in texts:
        candidate = line.strip()
        if not candidate or candidate in skip:
            continue
        if EMAIL_RE.search(candidate) or PHONE_RE.search(candidate):
            continue
        if COMPANY_SUFFIX_RE.search(candidate):
            return candidate
        words = candidate.split()
        capitalised = sum(1 for word in words if word and word[0].isupper())
        if (
            2 <= len(words) <= 6
            and capitalised >= len(words) - 1
            and not (set(candidate.lower().split()) & JOB_TITLE_TOKENS)
        ):
            return candidate
    return None
