"""The single place environment configuration is read, parsed and validated.

Nothing else in the service touches ``os.environ`` — inject ``Settings`` (via
``get_settings()`` or the ``dependencies.get_settings`` provider) instead.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

from card_reader.constants.media import (
    DEFAULT_ALLOWED_CONTENT_TYPES,
    DEFAULT_MAX_UPLOAD_BYTES,
)
from card_reader.constants.ocr import (
    DEFAULT_IMAGE_UPSCALE_PX,
    DEFAULT_MIN_WORD_CONFIDENCE,
    DEFAULT_TESSERACT_CONFIG,
    DEFAULT_TESSERACT_LANG,
)


class Settings(BaseSettings):
    """All runtime configuration. Env vars are prefixed ``CARD_READER_``."""

    model_config = SettingsConfigDict(
        env_prefix="CARD_READER_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── General ──────────────────────────────────────────────────────────────
    environment: Literal["dev", "staging", "prod"] = "prod"
    host: str = "0.0.0.0"  # noqa: S104 — a container binds all interfaces by design
    port: int = 8000
    log_level: str = "INFO"
    log_json: bool = True
    request_id_header: str = "X-Request-ID"

    # ── CORS (only relevant when a browser hits the service directly, i.e. dev;
    #     in prod it is same-origin behind nginx) ───────────────────────────────
    # NoDecode: skip pydantic-settings' automatic JSON parse of the env value so
    # the `_split_list` validator below can accept a plain CSV string too.
    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    # ── Upload limits ────────────────────────────────────────────────────────
    max_upload_bytes: int = DEFAULT_MAX_UPLOAD_BYTES
    allowed_content_types: Annotated[set[str], NoDecode] = Field(
        default_factory=lambda: set(DEFAULT_ALLOWED_CONTENT_TYPES)
    )

    # ── Worker model (consumed by gunicorn.conf.py) ──────────────────────────
    workers: int = 2
    worker_timeout: int = 60
    graceful_timeout: int = 30
    max_requests: int = 200
    max_requests_jitter: int = 50

    # ── Concurrency / load hardening ─────────────────────────────────────────
    # Concurrent OCR jobs per worker (= executor threads).
    ocr_max_concurrency: int = 2
    # Extra requests allowed to wait for a slot before the service sheds load.
    ocr_max_queue: int = 4
    # Max seconds a request waits for an admission slot before a 503.
    ocr_queue_timeout_s: float = 10.0
    # Kills the tesseract subprocess if it runs longer than this.
    tesseract_timeout_s: float = 20.0
    # Whole-request wall-clock ceiling (preprocess + OCR + parse) → 504.
    pipeline_timeout_s: float = 30.0

    # ── Pipeline tuning ──────────────────────────────────────────────────────
    tesseract_cmd: str = "tesseract"
    tesseract_config: str = DEFAULT_TESSERACT_CONFIG
    tesseract_lang: str = DEFAULT_TESSERACT_LANG
    min_word_confidence: float = DEFAULT_MIN_WORD_CONFIDENCE
    image_upscale_px: int = DEFAULT_IMAGE_UPSCALE_PX
    enable_deskew: bool = True
    spacy_model: str = "en_core_web_sm"
    default_phone_region: str = "US"

    @field_validator("allowed_origins", "allowed_content_types", mode="before")
    @classmethod
    def _split_list(cls, value: object) -> object:
        """Accept a CSV string as well as a JSON array for list/set fields.

        pydantic-settings only parses JSON for complex types by default; ops are
        used to the legacy ``ALLOWED_DOMAINS=a,b,c`` CSV habit, so honour both.
        """
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        if not stripped:
            return []
        if stripped.startswith("["):
            return json.loads(stripped)
        return [item.strip() for item in stripped.split(",") if item.strip()]

    @property
    def is_dev(self) -> bool:
        return self.environment == "dev"


@lru_cache
def get_settings() -> Settings:
    """Process-wide singleton. Cleared in tests via ``get_settings.cache_clear()``."""
    return Settings()
