from __future__ import annotations

from pydantic import BaseModel

from card_reader.schemas.contact import ContactCard


class ExtractionResponse(BaseModel):
    """Response body of ``POST /extract``. Stable public contract."""

    success: bool
    contact: ContactCard
    confidence: float
    message: str | None = None
