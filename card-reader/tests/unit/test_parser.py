from __future__ import annotations

from card_reader.services.ocr import OcrLine
from card_reader.services.parser import ContactParser


def _lines(*texts: str) -> list[OcrLine]:
    return [OcrLine(text=t, confidence=0.9) for t in texts]


def test_extracts_core_fields(parser: ContactParser) -> None:
    card = parser.parse(
        _lines(
            "Jane Doe",
            "Chief Technology Officer",
            "Acme Corp",
            "jane@acme.com",
            "+1 415 555 0123",
            "www.acme.com",
        )
    )

    assert card.name == "Jane Doe"
    assert card.job_title is not None and "Officer" in card.job_title
    assert card.company == "Acme Corp"
    assert card.emails == ["jane@acme.com"]
    assert card.phones == ["+14155550123"]
    assert "www.acme.com" in card.websites
    assert card.raw_text[0] == "Jane Doe"


def test_us_number_without_country_code_gets_plus_one(parser: ContactParser) -> None:
    card = parser.parse(_lines("Call 415 555 0123"))
    assert card.phones == ["+14155550123"]


def test_plus_prefixed_international_number_is_preserved(parser: ContactParser) -> None:
    card = parser.parse(_lines("Tel +44 20 7946 0958"))
    assert card.phones and card.phones[0].startswith("+44")


def test_emails_and_websites_are_deduped(parser: ContactParser) -> None:
    card = parser.parse(_lines("jane@acme.com", "jane@acme.com", "acme.com", "acme.com"))
    assert card.emails == ["jane@acme.com"]
    assert card.websites == ["acme.com"]


def test_default_region_is_respected() -> None:
    import spacy

    gb_parser = ContactParser(spacy.blank("en"), default_region="GB")
    card = gb_parser.parse(_lines("020 7946 0958"))
    assert card.phones and card.phones[0].startswith("+44")


def test_company_falls_back_to_suffix_heuristic_without_ner() -> None:
    import spacy

    plain = ContactParser(spacy.blank("en"), default_region="US")
    card = plain.parse(_lines("Nimbus Solutions LLC"))
    assert card.company == "Nimbus Solutions LLC"


def test_leading_noise_is_stripped(parser: ContactParser) -> None:
    card = parser.parse(_lines("* Jane Doe", "1) Acme Corp"))
    assert card.raw_text == ["Jane Doe", "Acme Corp"]
