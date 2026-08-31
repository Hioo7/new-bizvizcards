from __future__ import annotations

import shutil
from collections.abc import Iterator

import pytest
from PIL import Image

from card_reader.core.config import Settings
from card_reader.core.errors import OcrTimeoutError
from card_reader.services.ocr import OcrService


@pytest.fixture
def ocr(settings: Settings) -> Iterator[OcrService]:
    service = OcrService(settings)
    yield service
    service.close()


async def test_groups_words_into_ordered_lines(ocr: OcrService, mock_tesseract: None) -> None:
    lines = await ocr.extract_lines(Image.new("L", (10, 10)))

    texts = [line.text for line in lines]
    assert texts[0] == "Jane Doe"
    assert "Chief Technology Officer" in texts
    assert all(0.0 <= line.confidence <= 1.0 for line in lines)


async def test_low_confidence_and_empty_words_are_dropped(
    settings: Settings, monkeypatch: pytest.MonkeyPatch
) -> None:
    grid = {
        "text": ["Good", "", "Faint"],
        "conf": [95, 88, 20],
        "block_num": [0, 0, 0],
        "par_num": [0, 0, 0],
        "line_num": [0, 1, 2],
        "top": [0, 20, 40],
    }
    monkeypatch.setattr("card_reader.services.ocr.pytesseract.image_to_data", lambda *a, **k: grid)
    service = OcrService(settings)
    try:
        lines = await service.extract_lines(Image.new("L", (10, 10)))
    finally:
        service.close()

    assert [line.text for line in lines] == ["Good"]


async def test_tesseract_timeout_becomes_ocr_timeout_error(
    settings: Settings, monkeypatch: pytest.MonkeyPatch
) -> None:
    def _raise(*_a: object, **_k: object) -> None:
        raise RuntimeError("Tesseract process timeout")

    monkeypatch.setattr("card_reader.services.ocr.pytesseract.image_to_data", _raise)
    service = OcrService(settings)
    try:
        with pytest.raises(OcrTimeoutError):
            await service.extract_lines(Image.new("L", (10, 10)))
    finally:
        service.close()


@pytest.mark.requires_tesseract
@pytest.mark.skipif(shutil.which("tesseract") is None, reason="tesseract binary not installed")
async def test_real_tesseract_reads_the_fixture_card(
    settings: Settings, sample_card_png: bytes
) -> None:
    from card_reader.services.preprocessor import preprocess_image

    service = OcrService(settings)
    try:
        service.verify_binary()
        image = preprocess_image(
            sample_card_png, upscale_px=settings.image_upscale_px, enable_deskew=False
        )
        lines = await service.extract_lines(image)
    finally:
        service.close()

    joined = " ".join(line.text for line in lines).lower()
    assert "jane" in joined or "acme" in joined
