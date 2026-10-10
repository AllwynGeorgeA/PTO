"""Schemas for the AI reply generator."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Tone = Literal[
    "professional", "funny", "savage_office_safe", "corporate_diplomatic", "tanglish_manager"
]


class ReplyGenerateIn(BaseModel):
    """Request body for generating a reply."""

    message: str = Field(min_length=1, max_length=2000)
    tone: Tone
    # Tell the sender who to contact and when I am next available (from my PTO plan).
    include_availability: bool = False


class ReplyUpdateIn(BaseModel):
    """Editable reply fields."""

    generated_reply: str | None = Field(default=None, min_length=1, max_length=5000)
    is_saved: bool | None = None


class ReplyOut(BaseModel):
    """A stored reply."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    incoming_message: str
    tone: str
    generated_reply: str
    is_saved: bool
    source: str
    created_at: datetime


class UsageOut(BaseModel):
    """Monthly AI reply usage. limit is null for unlimited plans."""

    used: int
    limit: int | None
    plan: str
