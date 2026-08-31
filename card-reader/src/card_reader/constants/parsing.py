"""Compiled patterns and keyword sets for field extraction.

Ported verbatim from the legacy service so parsing behaviour is unchanged;
only their home moved (out of ``parser.py`` into this constants module).
"""

from __future__ import annotations

import re
from re import Pattern

EMAIL_RE: Pattern[str] = re.compile(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}")

PHONE_RE: Pattern[str] = re.compile(
    r"(?:(?:\+|00)\d{1,3}[\s.\-]?)?"
    r"(?:\(?\d{1,4}\)?[\s.\-]?)?"
    r"\d{3,4}[\s.\-]?\d{3,4}"
    r"(?:[\s.\-]?\d{2,4})?"
)

PHONE_ALT_RE: Pattern[str] = re.compile(r"\+?\d{1,3}[\s.\-]?\d{3,4}[\s.\-]?\d{3,4}[\s.\-]?\d{0,4}")

# Any run of digits/separators after a leading "+" — last-resort phone catch.
PHONE_PLUS_RE: Pattern[str] = re.compile(r"\+\d[\d\s\-.]{7,20}\d")

URL_RE: Pattern[str] = re.compile(r"(?:https?://)?(?:www\.)?[\w\-]+\.[a-zA-Z]{2,}(?:/\S*)?")

STREET_RE: Pattern[str] = re.compile(
    r"\d+\s+\w+\s+(?:st|street|ave|avenue|blvd|boulevard|rd|road|lane|ln"
    r"|dr|drive|way|court|ct|place|pl|suite|ste)",
    re.IGNORECASE,
)

COMPANY_SUFFIX_RE: Pattern[str] = re.compile(
    r"\b(?:LLC|Inc\.?|Corp\.?|Ltd\.?|Co\.|Company|Group|Solutions|Services"
    r"|Technologies|Tech|Consulting|Associates|Partners|Agency|Studio|Global"
    r"|Ventures|Holdings|Enterprises|International)\b",
    re.IGNORECASE,
)

# Short suffix check used when scoring a spaCy ORG entity.
COMPANY_SHORT_SUFFIX_RE: Pattern[str] = re.compile(r"\b(Inc|Corp|LLC|Ltd|Co)\b", re.IGNORECASE)

# A "clean name" is 1-4 tokens, each alphabetic (allowing - ' .).
NAME_TOKEN_RE: Pattern[str] = re.compile(r"[A-Za-z\-'.]+$")

# Leading-noise strippers for a raw OCR line.
LEADING_BULLET_RE: Pattern[str] = re.compile(r"^[•\-*@#~]+\s*")
LEADING_ENUM_RE: Pattern[str] = re.compile(r"^\d+[).]\s*")

JOB_TITLE_TOKENS: frozenset[str] = frozenset(
    {
        "ceo",
        "cto",
        "cfo",
        "coo",
        "vp",
        "vice",
        "president",
        "director",
        "manager",
        "engineer",
        "developer",
        "designer",
        "analyst",
        "consultant",
        "founder",
        "head",
        "lead",
        "principal",
        "senior",
        "junior",
        "associate",
        "officer",
        "executive",
        "architect",
        "specialist",
        "scientist",
        "researcher",
        "coordinator",
        "partner",
    }
)

# Symbols dropped from every OCR line before parsing.
NOISE_CHARS: tuple[str, ...] = ("©", "®", "™")

# Regions phonenumbers' PhoneNumberMatcher is tried against, in order, when the
# primary pass finds nothing.
PHONE_MATCH_REGIONS: tuple[str, ...] = ("US", "GB", "IN", "CA", "AU", "DE", "FR", "JP")

# Minimum digit count for a candidate to be considered a phone number at all.
MIN_PHONE_DIGITS = 7

# spaCy entity labels the parser reads.
SPACY_PERSON_LABEL = "PERSON"
SPACY_ORG_LABEL = "ORG"
SPACY_GPE_LABEL = "GPE"
