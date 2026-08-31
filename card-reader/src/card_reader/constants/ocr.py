"""Fixed values for the OCR stage. Tunable equivalents live on ``Settings``."""

from __future__ import annotations

# Tesseract engine config: --oem 3 = default LSTM engine,
# --psm 4 = "assume a single column of text of variable sizes" (business cards
# are usually one column of stacked lines).
DEFAULT_TESSERACT_CONFIG = "--oem 3 --psm 4"

DEFAULT_TESSERACT_LANG = "eng"

# Word confidence (0-1) below which a recognised word is discarded before it is
# grouped into a line. Tesseract reports confidence per word on a 0-100 scale.
DEFAULT_MIN_WORD_CONFIDENCE = 0.5

# A card photographed close-up can still be low-resolution; upscale narrow
# images so glyph strokes are thick enough for the LSTM recogniser.
DEFAULT_IMAGE_UPSCALE_PX = 1500

# Tesseract's per-word confidence for an empty / non-text cell.
TESSERACT_EMPTY_CONFIDENCE = -1
