"""The one place the spaCy model is loaded.

Called once per worker from the lifespan; the resulting ``Language`` is injected
into :class:`~card_reader.services.parser.ContactParser` (no module globals).
"""

from __future__ import annotations

import spacy
from spacy.language import Language


def load_spacy_model(name: str) -> Language:
    try:
        return spacy.load(name)
    except OSError as exc:  # model package not installed
        raise RuntimeError(
            f"spaCy model {name!r} is not installed. It ships as a pinned "
            f"dependency — run `uv sync`."
        ) from exc
