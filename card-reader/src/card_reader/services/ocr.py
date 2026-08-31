"""OCR stage — Tesseract via ``pytesseract``.

Owns a bounded per-worker ``ThreadPoolExecutor`` (Tesseract shells out to its
own binary, so threads suffice — the heavy work is already a subprocess) and a
hard per-call timeout that kills a stuck tesseract subprocess. Admission
control / load-shedding lives one level up, in :class:`ExtractionService`.
"""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import NamedTuple

import pytesseract
import structlog
from PIL.Image import Image
from pytesseract import Output

from card_reader.constants.ocr import TESSERACT_EMPTY_CONFIDENCE
from card_reader.core.config import Settings
from card_reader.core.errors import OcrTimeoutError

logger = structlog.get_logger(__name__)


class OcrLine(NamedTuple):
    text: str
    confidence: float  # 0.0 - 1.0


class OcrService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
        self._executor = ThreadPoolExecutor(
            max_workers=settings.ocr_max_concurrency,
            thread_name_prefix="ocr",
        )

    def verify_binary(self) -> None:
        """Fail fast at startup if the tesseract binary is missing."""
        try:
            version = pytesseract.get_tesseract_version()
        except Exception as exc:  # pytesseract raises assorted bare exceptions
            raise RuntimeError(
                f"Tesseract binary not found at {self._settings.tesseract_cmd!r}. "
                f"Install tesseract-ocr + the language pack."
            ) from exc
        logger.info("tesseract_ready", version=str(version))

    async def extract_lines(self, image: Image) -> list[OcrLine]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self._executor, self._run_ocr, image)

    def _run_ocr(self, image: Image) -> list[OcrLine]:
        try:
            data: dict[str, list[object]] = pytesseract.image_to_data(
                image,
                config=self._settings.tesseract_config,
                lang=self._settings.tesseract_lang,
                timeout=self._settings.tesseract_timeout_s,
                output_type=Output.DICT,
            )
        except RuntimeError as exc:  # pytesseract raises RuntimeError on timeout
            raise OcrTimeoutError from exc
        return self._group_lines(data)

    def _group_lines(self, data: dict[str, list[object]]) -> list[OcrLine]:
        min_conf = self._settings.min_word_confidence
        buckets: dict[tuple[int, int, int], _LineBucket] = {}

        for i in range(len(data["text"])):
            word = str(data["text"][i]).strip()
            conf = int(data["conf"][i])  # type: ignore[call-overload]
            if not word or conf <= TESSERACT_EMPTY_CONFIDENCE:
                continue
            key = (
                int(data["block_num"][i]),  # type: ignore[call-overload]
                int(data["par_num"][i]),  # type: ignore[call-overload]
                int(data["line_num"][i]),  # type: ignore[call-overload]
            )
            bucket = buckets.get(key)
            if bucket is None:
                bucket = _LineBucket(top=int(data["top"][i]))  # type: ignore[call-overload]
                buckets[key] = bucket
            bucket.words.append(word)
            bucket.confidences.append(conf)

        lines: list[OcrLine] = []
        for bucket in sorted(buckets.values(), key=lambda b: b.top):
            confidence = (sum(bucket.confidences) / len(bucket.confidences)) / 100.0
            if confidence >= min_conf:
                lines.append(OcrLine(text=" ".join(bucket.words), confidence=round(confidence, 4)))
        return lines

    def close(self) -> None:
        self._executor.shutdown(wait=True, cancel_futures=True)


class _LineBucket:
    __slots__ = ("confidences", "top", "words")

    def __init__(self, top: int) -> None:
        self.top = top
        self.words: list[str] = []
        self.confidences: list[int] = []
