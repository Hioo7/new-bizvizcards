from __future__ import annotations

import io

import pytest
from PIL import Image

from card_reader.core.errors import ImageDecodeError
from card_reader.services.preprocessor import preprocess_image


def test_valid_image_becomes_grayscale_and_upscaled(sample_card_png: bytes) -> None:
    result = preprocess_image(sample_card_png, upscale_px=1500, enable_deskew=False)

    assert result.mode == "L"
    assert result.width >= 1500


def test_no_upscale_when_already_wide_enough(sample_card_png: bytes) -> None:
    result = preprocess_image(sample_card_png, upscale_px=100, enable_deskew=False)

    assert result.width == 900  # unchanged


def test_corrupt_bytes_raise_image_decode_error(corrupt_bytes: bytes) -> None:
    with pytest.raises(ImageDecodeError):
        preprocess_image(corrupt_bytes, upscale_px=1500, enable_deskew=False)


def test_truncated_image_raises_image_decode_error(sample_card_png: bytes) -> None:
    with pytest.raises(ImageDecodeError):
        preprocess_image(sample_card_png[:50], upscale_px=1500, enable_deskew=False)


def test_rgba_image_is_flattened(monkeypatch: pytest.MonkeyPatch) -> None:
    rgba = Image.new("RGBA", (1600, 900), (255, 255, 255, 128))
    buffer = io.BytesIO()
    rgba.save(buffer, format="PNG")

    result = preprocess_image(buffer.getvalue(), upscale_px=1500, enable_deskew=False)

    assert result.mode == "L"


def test_deskew_toggle_runs_without_error(sample_card_png: bytes) -> None:
    with_deskew = preprocess_image(sample_card_png, upscale_px=800, enable_deskew=True)
    without = preprocess_image(sample_card_png, upscale_px=800, enable_deskew=False)

    assert with_deskew.mode == without.mode == "L"
