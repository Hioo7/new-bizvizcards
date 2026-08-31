from __future__ import annotations

import io
import shutil
from collections.abc import Iterator
from typing import Any

import pytest
import spacy
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
from spacy.language import Language

from card_reader.core.config import Settings
from card_reader.main import create_app
from card_reader.services.parser import ContactParser

# Canned tesseract word grid used by ``mock_tesseract`` — one readable card.
_TESSERACT_WORDS = [
    ("Jane", 96, 0, 0, 0, 10),
    ("Doe", 95, 0, 0, 0, 10),
    ("Chief", 92, 0, 0, 1, 40),
    ("Technology", 91, 0, 0, 1, 40),
    ("Officer", 93, 0, 0, 1, 40),
    ("Acme", 90, 0, 0, 2, 70),
    ("Corp", 89, 0, 0, 2, 70),
    ("jane@acme.com", 88, 0, 0, 3, 100),
    ("+1", 85, 0, 0, 4, 130),
    ("415", 84, 0, 0, 4, 130),
    ("555", 84, 0, 0, 4, 130),
    ("0123", 83, 0, 0, 4, 130),
    ("www.acme.com", 87, 0, 0, 5, 160),
]


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,  # type: ignore[call-arg]
        environment="dev",
        log_json=False,
        max_upload_bytes=64 * 1024,
        enable_deskew=False,
        ocr_max_concurrency=1,
        ocr_max_queue=1,
        ocr_queue_timeout_s=1.0,
        pipeline_timeout_s=5.0,
    )


@pytest.fixture
def fake_nlp() -> Language:
    nlp = spacy.blank("en")
    ruler = nlp.add_pipe("entity_ruler")
    ruler.add_patterns(  # type: ignore[attr-defined]
        [
            {"label": "PERSON", "pattern": "Jane Doe"},
            {"label": "ORG", "pattern": "Acme Corp"},
            {"label": "GPE", "pattern": "San Francisco"},
        ]
    )
    return nlp


@pytest.fixture
def parser(fake_nlp: Language) -> ContactParser:
    return ContactParser(fake_nlp, default_region="US")


@pytest.fixture
def sample_card_png() -> bytes:
    img = Image.new("RGB", (900, 500), "white")
    draw = ImageDraw.Draw(img)
    for i, line in enumerate(
        ["Jane Doe", "Chief Technology Officer", "Acme Corp", "jane@acme.com"]
    ):
        draw.text((40, 40 + i * 80), line, fill="black")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def corrupt_bytes() -> bytes:
    return b"not-an-image" * 8


@pytest.fixture
def mock_tesseract(monkeypatch: pytest.MonkeyPatch) -> None:
    """Patch pytesseract so tests run without the tesseract binary installed."""
    n = len(_TESSERACT_WORDS)
    grid: dict[str, list[Any]] = {
        "text": [w[0] for w in _TESSERACT_WORDS],
        "conf": [w[1] for w in _TESSERACT_WORDS],
        "block_num": [w[2] for w in _TESSERACT_WORDS],
        "par_num": [w[3] for w in _TESSERACT_WORDS],
        "line_num": [w[4] for w in _TESSERACT_WORDS],
        "top": [w[5] for w in _TESSERACT_WORDS],
        "left": [0] * n,
        "width": [10] * n,
        "height": [10] * n,
    }
    monkeypatch.setattr(
        "card_reader.services.ocr.pytesseract.image_to_data",
        lambda *args, **kwargs: grid,
    )
    monkeypatch.setattr(
        "card_reader.services.ocr.pytesseract.get_tesseract_version",
        lambda: "5.3.0",
    )


@pytest.fixture
def app(settings: Settings, mock_tesseract: None) -> FastAPI:
    return create_app(settings)


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:  # runs lifespan (startup + shutdown)
        yield test_client


@pytest.fixture
def tesseract_available() -> bool:
    return shutil.which("tesseract") is not None
