"""Gunicorn config — every value comes from ``Settings`` so deployments tune it
via ``CARD_READER_*`` env vars, not by editing this file.

Note: ``preload_app`` is deliberately left OFF. Forking a master that has
already imported spaCy / thinc / BLAS is not reliably fork-safe; each worker
loads its own model in the FastAPI lifespan instead.
"""

from __future__ import annotations

from card_reader.core.config import get_settings

_settings = get_settings()

bind = f"{_settings.host}:{_settings.port}"
workers = _settings.workers
worker_class = "uvicorn.workers.UvicornWorker"
preload_app = False

timeout = _settings.worker_timeout
graceful_timeout = _settings.graceful_timeout
keepalive = 5

max_requests = _settings.max_requests
max_requests_jitter = _settings.max_requests_jitter

accesslog = "-"
errorlog = "-"
loglevel = _settings.log_level.lower()
