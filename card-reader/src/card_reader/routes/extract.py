from __future__ import annotations

from typing import Annotated

import structlog
from fastapi import APIRouter, File, UploadFile

from card_reader.constants.media import UPLOAD_READ_CHUNK_BYTES
from card_reader.core.config import Settings
from card_reader.core.errors import PayloadTooLargeError, UnsupportedMediaTypeError
from card_reader.dependencies import ExtractionServiceDep, SettingsDep
from card_reader.schemas.extraction import ExtractionResponse

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/extract", response_model=ExtractionResponse)
async def extract_card(
    settings: SettingsDep,
    service: ExtractionServiceDep,
    file: Annotated[UploadFile, File(description="Business-card image")],
) -> ExtractionResponse:
    image_bytes = await _read_validated_upload(file, settings)
    return await service.extract(image_bytes)


async def _read_validated_upload(file: UploadFile, settings: Settings) -> bytes:
    # 1. Content type — reject before touching the body.
    if (file.content_type or "") not in settings.allowed_content_types:
        accepted = ", ".join(sorted(settings.allowed_content_types))
        raise UnsupportedMediaTypeError(
            f"Unsupported media type {file.content_type!r}. Accepted: {accepted}."
        )

    # 2. Declared size — reject before reading a single byte.
    declared = file.size
    if declared is not None and declared > settings.max_upload_bytes:
        raise PayloadTooLargeError(_too_large_detail(settings.max_upload_bytes))

    # 3. Actual size — stream and bail the moment the ceiling is crossed.
    chunks: list[bytes] = []
    total = 0
    while chunk := await file.read(UPLOAD_READ_CHUNK_BYTES):
        total += len(chunk)
        if total > settings.max_upload_bytes:
            raise PayloadTooLargeError(_too_large_detail(settings.max_upload_bytes))
        chunks.append(chunk)
    return b"".join(chunks)


def _too_large_detail(limit_bytes: int) -> str:
    return f"File too large. Maximum allowed size is {limit_bytes // (1024 * 1024)} MB."
