"""Application lifespan: build the heavy singletons once per worker, tear them
down on shutdown.

The services are stashed on ``app.state`` purely as the source the ``Depends``
providers (``dependencies.py``) read from — no business logic touches
``app.state`` directly.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass

import structlog
from fastapi import FastAPI

from card_reader.core.config import Settings
from card_reader.services.nlp import load_spacy_model
from card_reader.services.ocr import OcrService
from card_reader.services.parser import ContactParser
from card_reader.services.pipeline import ExtractionService

logger = structlog.get_logger(__name__)


@dataclass(slots=True)
class ServiceRegistry:
    settings: Settings
    ocr: OcrService
    extraction: ExtractionService


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings: Settings = app.state.settings

    logger.info("startup_begin", environment=settings.environment)
    ocr = OcrService(settings)
    ocr.verify_binary()

    nlp = load_spacy_model(settings.spacy_model)
    logger.info("spacy_model_loaded", model=settings.spacy_model)

    parser = ContactParser(nlp, default_region=settings.default_phone_region)
    extraction = ExtractionService(settings, ocr, parser)

    app.state.services = ServiceRegistry(settings=settings, ocr=ocr, extraction=extraction)
    logger.info("startup_complete")

    try:
        yield
    finally:
        logger.info("shutdown_begin")
        extraction.close()
        ocr.close()
        logger.info("shutdown_complete")
