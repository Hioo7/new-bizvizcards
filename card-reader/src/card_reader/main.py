"""Application factory. ``app = create_app()`` at module scope for gunicorn."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from card_reader import __version__
from card_reader.core.config import Settings, get_settings
from card_reader.core.errors import register_exception_handlers
from card_reader.core.lifespan import lifespan
from card_reader.core.logging import configure_logging
from card_reader.middleware.request_context import RequestContextMiddleware
from card_reader.routes import api_router


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(level=settings.log_level, json_output=settings.log_json)

    app = FastAPI(
        title="Card Reader",
        description="Extracts structured contact details from a business-card image.",
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs" if settings.is_dev else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.is_dev else None,
    )
    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestContextMiddleware, header_name=settings.request_id_header)

    register_exception_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
