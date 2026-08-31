from __future__ import annotations

from pydantic import BaseModel, Field


class ContactCard(BaseModel):
    """Structured contact details extracted from a business-card image.

    Field names and nullability are the stable public contract — the frontend
    and any other consumer depend on this exact shape.
    """

    name: str | None = None
    job_title: str | None = None
    company: str | None = None
    emails: list[str] = Field(default_factory=list)
    phones: list[str] = Field(default_factory=list)
    websites: list[str] = Field(default_factory=list)
    address: str | None = None
    raw_text: list[str] = Field(default_factory=list)
