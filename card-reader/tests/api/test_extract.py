from __future__ import annotations

import io

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from card_reader.core.errors import OcrOverloadError
from card_reader.dependencies import get_extraction_service
from card_reader.schemas.extraction import ExtractionResponse


def _png_bytes(size: tuple[int, int] = (1600, 900)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, "white").save(buffer, format="PNG")
    return buffer.getvalue()


def test_extract_happy_path(client: TestClient) -> None:
    response = client.post(
        "/extract",
        files={"file": ("card.png", _png_bytes(), "image/png")},
    )

    assert response.status_code == 200
    body = ExtractionResponse.model_validate(response.json())
    assert body.success is True
    assert body.contact.name is not None and "Jane" in body.contact.name
    assert body.contact.emails == ["jane@acme.com"]


def test_missing_file_is_422(client: TestClient) -> None:
    assert client.post("/extract").status_code == 422


def test_wrong_content_type_is_415(client: TestClient) -> None:
    response = client.post(
        "/extract",
        files={"file": ("note.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 415


def test_body_over_limit_is_413(client: TestClient) -> None:
    # settings fixture caps max_upload_bytes at 64 KiB.
    big = b"\x00" * (128 * 1024)
    response = client.post(
        "/extract",
        files={"file": ("card.png", big, "image/png")},
    )
    assert response.status_code == 413


def test_corrupt_image_is_422(client: TestClient) -> None:
    response = client.post(
        "/extract",
        files={"file": ("card.png", b"not-a-real-png" * 4, "image/png")},
    )
    assert response.status_code == 422


def test_overload_is_503_with_retry_after(app: FastAPI) -> None:
    class _Overloaded:
        async def extract(self, _b: bytes) -> ExtractionResponse:
            raise OcrOverloadError

    app.dependency_overrides[get_extraction_service] = lambda: _Overloaded()
    try:
        with TestClient(app) as overridden:
            response = overridden.post(
                "/extract",
                files={"file": ("card.png", _png_bytes(), "image/png")},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.headers.get("Retry-After") == "5"


@pytest.mark.parametrize("inbound_id", ["req-999", None])
def test_response_carries_request_id(client: TestClient, inbound_id: str | None) -> None:
    headers = {"X-Request-ID": inbound_id} if inbound_id else {}
    response = client.post(
        "/extract",
        files={"file": ("card.png", _png_bytes(), "image/png")},
        headers=headers,
    )
    returned = response.headers.get("X-Request-ID")
    assert returned
    if inbound_id:
        assert returned == inbound_id
