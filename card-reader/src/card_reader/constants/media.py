"""Fixed values for upload handling.

These are the hard defaults baked into the code. Operationally tunable
equivalents live on ``Settings`` (``core/config.py``); a route reads the
setting, not the constant, so deployments can override without a code change.
"""

from __future__ import annotations

# Default request-body ceiling. Matches the nginx ``client_max_body_size 10m``
# at the edge so the two walls agree.
DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024

# Content types Tesseract + Pillow can actually read. PDF/HEIC are not
# supported (no poppler / pillow-heif in the image).
DEFAULT_ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/bmp",
        "image/tiff",
    }
)

# Chunk size for the streaming size guard in ``routes/extract.py`` — the upload
# is read incrementally and rejected the moment it crosses the ceiling, instead
# of being buffered whole and then measured.
UPLOAD_READ_CHUNK_BYTES = 1 << 20
