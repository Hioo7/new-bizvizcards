"""Per-request correlation id + timing + a single structured access log line."""

from __future__ import annotations

import time
import uuid
from collections.abc import Awaitable, Callable

import structlog
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

logger = structlog.get_logger("card_reader.access")

_Handler = Callable[[Request], Awaitable[Response]]


class RequestContextMiddleware:
    """Pure-ASGI middleware (cheaper than ``BaseHTTPMiddleware``)."""

    def __init__(self, app: ASGIApp, *, header_name: str) -> None:
        self._app = app
        self._header = header_name
        self._header_lower = header_name.lower().encode()

    async def __call__(self, scope, receive, send) -> None:  # type: ignore[no-untyped-def]
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return

        headers = dict(scope["headers"])
        request_id = headers.get(self._header_lower, b"").decode() or uuid.uuid4().hex
        method = scope["method"]
        path = scope["path"]
        started = time.perf_counter()
        status_code = 500

        structlog.contextvars.bind_contextvars(request_id=request_id)

        async def send_wrapper(message) -> None:  # type: ignore[no-untyped-def]
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                message["headers"] = [
                    *message.get("headers", []),
                    (self._header.encode(), request_id.encode()),
                ]
            await send(message)

        try:
            await self._app(scope, receive, send_wrapper)
        finally:
            logger.info(
                "request",
                method=method,
                path=path,
                status=status_code,
                duration_ms=round((time.perf_counter() - started) * 1000, 1),
            )
            structlog.contextvars.unbind_contextvars("request_id")
