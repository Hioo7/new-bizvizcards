from __future__ import annotations

import asyncio

import pytest
from PIL import Image

from card_reader.core.config import Settings
from card_reader.core.errors import NoTextExtractedError, OcrOverloadError
from card_reader.services.ocr import OcrLine, OcrService
from card_reader.services.parser import ContactParser
from card_reader.services.pipeline import ExtractionService


@pytest.fixture
def extraction(
    settings: Settings, mock_tesseract: None, parser: ContactParser
) -> ExtractionService:
    ocr = OcrService(settings)
    service = ExtractionService(settings, ocr, parser)
    yield service
    service.close()
    ocr.close()


async def test_happy_path_returns_valid_response(
    extraction: ExtractionService, sample_card_png: bytes
) -> None:
    response = await extraction.extract(sample_card_png)

    assert response.success is True
    assert response.contact.name == "Jane Doe"
    assert 0.0 <= response.confidence <= 1.0


async def test_no_text_raises_no_text_extracted(
    settings: Settings, parser: ContactParser, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        "card_reader.services.ocr.pytesseract.image_to_data",
        lambda *a, **k: {
            "text": [],
            "conf": [],
            "block_num": [],
            "par_num": [],
            "line_num": [],
            "top": [],
        },
    )
    ocr = OcrService(settings)
    service = ExtractionService(settings, ocr, parser)
    try:
        with pytest.raises(NoTextExtractedError):
            await service.extract(_blank_png())
    finally:
        service.close()
        ocr.close()


async def test_overload_sheds_load_with_503(settings: Settings, parser: ContactParser) -> None:
    # concurrency 1 + queue 1 → admission semaphore of 2; a 3rd concurrent call
    # that can't get a slot inside the (tiny) queue timeout must be rejected.
    tuned = settings.model_copy(update={"ocr_queue_timeout_s": 0.05})

    class _SlowOcr(OcrService):
        async def extract_lines(self, image: Image.Image) -> list[OcrLine]:
            await asyncio.sleep(0.4)
            return [OcrLine("Jane Doe", 0.9)]

    ocr = _SlowOcr(tuned)
    service = ExtractionService(tuned, ocr, parser)
    try:
        first = asyncio.create_task(service.extract(_blank_png()))
        second = asyncio.create_task(service.extract(_blank_png()))
        await asyncio.sleep(0.05)
        with pytest.raises(OcrOverloadError):
            await service.extract(_blank_png())
        await asyncio.gather(first, second)
    finally:
        service.close()
        ocr.close()


def _blank_png() -> bytes:
    import io

    buffer = io.BytesIO()
    Image.new("RGB", (1600, 900), "white").save(buffer, format="PNG")
    return buffer.getvalue()
