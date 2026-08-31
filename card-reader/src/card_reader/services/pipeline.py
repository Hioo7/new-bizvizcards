"""Orchestrates the extraction: preprocess → OCR → parse → confidence.

Also the single load-shedding point: an admission semaphore sized
``ocr_max_concurrency + ocr_max_queue`` gates the *whole* CPU pipeline, and a
wall-clock timeout bounds a pathological request.
"""

from __future__ import annotations

import asyncio
import statistics
from concurrent.futures import ThreadPoolExecutor

import structlog

from card_reader.core.config import Settings
from card_reader.core.errors import NoTextExtractedError, OcrOverloadError, OcrTimeoutError
from card_reader.schemas.extraction import ExtractionResponse
from card_reader.services.ocr import OcrService
from card_reader.services.parser import ContactParser
from card_reader.services.preprocessor import preprocess_image

logger = structlog.get_logger(__name__)


class ExtractionService:
    def __init__(
        self,
        settings: Settings,
        ocr: OcrService,
        parser: ContactParser,
    ) -> None:
        self._settings = settings
        self._ocr = ocr
        self._parser = parser
        self._cpu_executor = ThreadPoolExecutor(
            max_workers=settings.ocr_max_concurrency,
            thread_name_prefix="cpu",
        )
        self._admission = asyncio.Semaphore(settings.ocr_max_concurrency + settings.ocr_max_queue)

    async def extract(self, image_bytes: bytes) -> ExtractionResponse:
        try:
            await asyncio.wait_for(
                self._admission.acquire(),
                timeout=self._settings.ocr_queue_timeout_s,
            )
        except TimeoutError as exc:
            raise OcrOverloadError from exc

        try:
            return await asyncio.wait_for(
                self._run(image_bytes),
                timeout=self._settings.pipeline_timeout_s,
            )
        except TimeoutError as exc:
            raise OcrTimeoutError from exc
        finally:
            self._admission.release()

    async def _run(self, image_bytes: bytes) -> ExtractionResponse:
        loop = asyncio.get_running_loop()

        image = await loop.run_in_executor(
            self._cpu_executor,
            lambda: preprocess_image(
                image_bytes,
                upscale_px=self._settings.image_upscale_px,
                enable_deskew=self._settings.enable_deskew,
            ),
        )

        lines = await self._ocr.extract_lines(image)
        if not lines:
            raise NoTextExtractedError

        contact = await loop.run_in_executor(self._cpu_executor, self._parser.parse, lines)
        confidence = round(statistics.mean(line.confidence for line in lines), 4)

        return ExtractionResponse(success=True, contact=contact, confidence=confidence)

    def close(self) -> None:
        self._cpu_executor.shutdown(wait=True, cancel_futures=True)
