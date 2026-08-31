"""Image preprocessing — Pillow only, no OpenCV / numpy.

Ported from the legacy service. Pipeline: decode → honour EXIF orientation →
flatten transparency → grayscale → upscale → autocontrast → sharpen →
(optional) deskew.
"""

from __future__ import annotations

import io
from collections.abc import Sequence

from PIL import Image, ImageFilter, ImageOps, UnidentifiedImageError

from card_reader.core.errors import ImageDecodeError

# Angles (degrees) tried by the deskew search, and how many rows to sample.
_DESKEW_ANGLES: tuple[float, ...] = tuple(a * 0.5 for a in range(-10, 11))
_DESKEW_ROW_SAMPLES = 40
# Below this absolute angle the rotation is not worth the quality loss.
_DESKEW_MIN_ANGLE = 0.5


def preprocess_image(
    image_bytes: bytes,
    *,
    upscale_px: int,
    enable_deskew: bool,
) -> Image.Image:
    """Decode and clean a card image for OCR. Raises :class:`ImageDecodeError`."""
    try:
        img: Image.Image = Image.open(io.BytesIO(image_bytes))
        img.load()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ImageDecodeError(f"Could not decode image: {exc}") from exc

    # Rotate per EXIF orientation (phone photos) before anything else.
    img = ImageOps.exif_transpose(img) or img

    img = _flatten_to_rgb(img)
    img = img.convert("L")
    img = _upscale(img, min_width=upscale_px)
    img = ImageOps.autocontrast(img, cutoff=1)
    img = img.filter(ImageFilter.SHARPEN)
    if enable_deskew:
        img = _deskew(img)
    return img


def _flatten_to_rgb(img: Image.Image) -> Image.Image:
    if img.mode in ("RGBA", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        return background
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def _upscale(img: Image.Image, *, min_width: int) -> Image.Image:
    width, height = img.size
    if width >= min_width:
        return img
    scale = min_width / width
    return img.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)


def _deskew(img: Image.Image) -> Image.Image:
    """Estimate skew by maximising row-projection variance of the edge map.

    A correctly-aligned page has text rows that project into sharp
    high/low bands (high variance); a skewed one smears them out.
    """
    edges = img.filter(ImageFilter.FIND_EDGES)
    step = max(1, edges.height // _DESKEW_ROW_SAMPLES)

    best_angle = 0.0
    best_score = -1.0
    for angle in _DESKEW_ANGLES:
        rotated = edges.rotate(angle, expand=False, fillcolor=0)
        row_sums = [
            float(sum(rotated.crop((0, y, rotated.width, y + 1)).tobytes()))
            for y in range(0, rotated.height, step)
        ]
        score = _variance(row_sums)
        if score > best_score:
            best_score = score
            best_angle = angle

    if abs(best_angle) < _DESKEW_MIN_ANGLE:
        return img
    return img.rotate(best_angle, expand=False, fillcolor=255)


def _variance(values: Sequence[float]) -> float:
    if not values:
        return 0.0
    mean = sum(values) / len(values)
    return sum((v - mean) ** 2 for v in values) / len(values)
