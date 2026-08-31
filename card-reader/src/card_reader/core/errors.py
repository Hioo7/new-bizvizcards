"""Typed domain exceptions and the handlers that turn them into HTTP responses.

Every handler renders ``{"detail": "..."}`` so the response shape matches
FastAPI's own validation errors and the legacy service.
"""

from __future__ import annotations

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = structlog.get_logger(__name__)

_SERVER_ERROR = 500


class CardReaderError(Exception):
    """Base class for every error this service raises deliberately."""

    status_code: int = _SERVER_ERROR
    detail: str = "Internal error"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail or self.detail)
        if detail:
            self.detail = detail


class PayloadTooLargeError(CardReaderError):
    status_code = 413
    detail = "File too large."


class UnsupportedMediaTypeError(CardReaderError):
    status_code = 415
    detail = "Unsupported media type."


class ImageDecodeError(CardReaderError):
    status_code = 422
    detail = "Could not decode the image."


class NoTextExtractedError(CardReaderError):
    status_code = 422
    detail = "No readable text could be extracted from the image."


class OcrOverloadError(CardReaderError):
    status_code = 503
    detail = "The scanner is busy. Try again shortly."


class OcrTimeoutError(CardReaderError):
    status_code = 504
    detail = "The scan took too long and was cancelled."


def _handler(request: Request, exc: CardReaderError) -> JSONResponse:
    headers: dict[str, str] = {}
    if isinstance(exc, OcrOverloadError):
        headers["Retry-After"] = "5"
    if exc.status_code >= _SERVER_ERROR:
        logger.error("request_failed", detail=exc.detail, status=exc.status_code)
    else:
        logger.info("request_rejected", detail=exc.detail, status=exc.status_code)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers or None,
    )


def _unexpected_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_exception")
    return JSONResponse(
        status_code=_SERVER_ERROR,
        content={"detail": "Internal error"},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(CardReaderError, _handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, _unexpected_handler)
