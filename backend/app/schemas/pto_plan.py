"""PTO plan schemas. status and days_remaining are computed at read time."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field, model_validator

PtoStatus = Literal["upcoming", "active", "completed"]


def compute_status(start: date, end: date, today: date) -> PtoStatus:
    """Return upcoming / active / completed relative to `today` (both ends inclusive)."""
    if today < start:
        return "upcoming"
    return "active" if today <= end else "completed"


def compute_days_remaining(start: date, end: date, today: date) -> int:
    """Days until start (upcoming), until end (active), else 0."""
    status = compute_status(start, end, today)
    if status == "upcoming":
        return (start - today).days
    if status == "active":
        return (end - today).days
    return 0


class PtoPlanIn(BaseModel):
    """Create/update payload."""

    employee_name: str = Field(min_length=1, max_length=100)
    start_date: date
    end_date: date
    backup_person: str = Field(min_length=1, max_length=100)
    contact_email: EmailStr
    reason: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _check_dates(self) -> "PtoPlanIn":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class PtoPlanOut(BaseModel):
    """Plan with status and days_remaining computed from today's date."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_name: str
    start_date: date
    end_date: date
    backup_person: str
    contact_email: str
    reason: str | None
    created_at: datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def status(self) -> PtoStatus:
        """Computed from today's date."""
        return compute_status(self.start_date, self.end_date, date.today())

    @computed_field  # type: ignore[prop-decorator]
    @property
    def days_remaining(self) -> int:
        """Computed from today's date."""
        return compute_days_remaining(self.start_date, self.end_date, date.today())
