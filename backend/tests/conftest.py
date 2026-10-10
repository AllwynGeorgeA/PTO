"""Shared test fixtures: in-memory SQLite, TestClient, users and auth headers.

Tests never call real OpenAI/Dodo/SMTP: the related settings are blanked for every test.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import get_db
from app.main import app, limiter
from app.models import Base, User


@pytest.fixture(autouse=True)
def _no_external_services(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in ("OPENAI_API_KEY", "DODO_API_KEY", "DODO_WEBHOOK_SECRET", "SMTP_HOST"):
        monkeypatch.setattr(settings, name, "", raising=False)
    limiter.enabled = False


@pytest.fixture
def db_engine() -> Iterator[Engine]:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture
def db(db_engine: Engine) -> Iterator[Session]:
    with (
        sessionmaker(bind=db_engine, expire_on_commit=False)(  # type: ignore[call-overload]
        ) as session
    ):
        yield session


@pytest.fixture
def client(db_engine: Engine) -> Iterator[TestClient]:
    factory = sessionmaker(bind=db_engine, expire_on_commit=False)

    def override_get_db() -> Iterator[Session]:
        with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def make_user(
    db: Session,
    email: str,
    plan: str = "free",
    is_admin: bool = False,
    password: str = "Passw0rd!x",
) -> User:
    from app.auth.jwt import hash_password

    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=email.split("@")[0],
        is_active=True,
        is_verified=True,
        is_admin=is_admin,
        plan=plan,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def headers_for(user: User) -> dict[str, str]:
    from app.auth.jwt import create_access_token

    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


@pytest.fixture
def user(db: Session) -> User:
    return make_user(db, "alice@example.com")


@pytest.fixture
def other_user(db: Session) -> User:
    return make_user(db, "bob@example.com")


@pytest.fixture
def admin_user(db: Session) -> User:
    return make_user(db, "admin@example.com", is_admin=True)


@pytest.fixture
def auth_headers(user: User) -> dict[str, str]:
    return headers_for(user)


@pytest.fixture
def other_headers(other_user: User) -> dict[str, str]:
    return headers_for(other_user)


@pytest.fixture
def admin_headers(admin_user: User) -> dict[str, str]:
    return headers_for(admin_user)
