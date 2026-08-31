"""FastAPI dependency providers — the only way routes reach the singletons."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request

from card_reader.core.config import Settings
from card_reader.core.lifespan import ServiceRegistry
from card_reader.services.pipeline import ExtractionService


def get_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_services(request: Request) -> ServiceRegistry:
    services: ServiceRegistry = request.app.state.services
    return services


def get_extraction_service(
    services: Annotated[ServiceRegistry, Depends(get_services)],
) -> ExtractionService:
    return services.extraction


SettingsDep = Annotated[Settings, Depends(get_settings)]
ExtractionServiceDep = Annotated[ExtractionService, Depends(get_extraction_service)]
