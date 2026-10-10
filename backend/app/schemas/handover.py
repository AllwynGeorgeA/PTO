"""Handover task schemas."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Priority = Literal["low", "medium", "high"]


class HandoverTaskIn(BaseModel):
    """Create/update payload."""

    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    priority: Priority = "medium"
    backup_person: str | None = Field(default=None, max_length=100)
    deadline: date | None = None
    pto_plan_id: int | None = None


class HandoverTaskOut(BaseModel):
    """Task response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    pto_plan_id: int | None
    name: str
    description: str | None
    priority: str
    backup_person: str | None
    deadline: date | None
    status: str
    created_at: datetime


class SummaryIn(BaseModel):
    """Summary request; optionally limited to one PTO plan."""

    pto_plan_id: int | None = None


class SummaryOut(BaseModel):
    """Generated handover summary."""

    summary: str
    source: Literal["openai", "template"]
