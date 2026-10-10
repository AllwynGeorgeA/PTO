"""Billing schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class PlanOut(BaseModel):
    """A purchasable plan."""

    id: str
    name: str
    price: float
    features: list[str]


class PlansResponse(BaseModel):
    """Plan list plus demo flag."""

    plans: list[PlanOut]
    demo: bool


class CheckoutRequest(BaseModel):
    """Checkout request body."""

    plan: Literal["pro", "team"]


class CheckoutResponse(BaseModel):
    """Checkout result. In demo mode checkout_url is null and nothing is charged."""

    checkout_url: str | None = None
    demo: bool
    message: str | None = None


class SubscriptionOut(BaseModel):
    """Current subscription state."""

    plan: str
    status: str
    current_period_end: datetime | None = None
    demo: bool
