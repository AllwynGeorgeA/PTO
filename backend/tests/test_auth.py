from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token, create_state_token, hash_password, verify_password
from app.config import settings
from app.models import RefreshToken, User

BASE = "/api/v1/auth"
PW = "Passw0rd!x"


def _register(client: TestClient, email: str = "new@example.com"):  # type: ignore[no-untyped-def]
    return client.post(
        f"{BASE}/register", json={"email": email, "password": PW, "full_name": "New User"}
    )


def _login(client: TestClient, email: str, password: str = PW):  # type: ignore[no-untyped-def]
    return client.post(f"{BASE}/login", data={"username": email, "password": password})


def test_register_login_me(client: TestClient) -> None:
    r = _register(client)
    assert r.status_code == 201
    assert r.json()["plan"] == "free" and "hashed_password" not in r.json()
    tokens = _login(client, "new@example.com").json()
    assert tokens["token_type"] == "bearer"
    me = client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.json()["email"] == "new@example.com"


def test_register_validation_and_duplicate(client: TestClient) -> None:
    bad = client.post(
        f"{BASE}/register", json={"email": "a@b.co", "password": "short", "full_name": "x"}
    )
    assert bad.status_code == 422
    assert _register(client).status_code == 201
    assert _register(client).status_code == 409


def test_wrong_password_and_unknown_user(client: TestClient, user: User) -> None:
    assert _login(client, user.email, "nope-nope").status_code == 401
    assert _login(client, "ghost@example.com").status_code == 401


def test_inactive_user(client: TestClient, db: Session, user: User) -> None:
    user.is_active = False
    db.commit()
    assert _login(client, user.email).status_code == 401
    assert (
        client.get(
            f"{BASE}/me", headers={"Authorization": f"Bearer {create_access_token(user.id)}"}
        ).status_code
        == 401
    )


def test_refresh_rotation_and_logout(client: TestClient, db: Session, user: User) -> None:
    t1 = _login(client, user.email).json()
    stored = db.scalars(select(RefreshToken)).all()
    assert len(stored) == 1 and stored[0].token != t1["refresh_token"]  # hashed at rest

    t2 = client.post(f"{BASE}/refresh", json={"refresh_token": t1["refresh_token"]})
    assert t2.status_code == 200
    # old one is single-use
    assert (
        client.post(f"{BASE}/refresh", json={"refresh_token": t1["refresh_token"]}).status_code
        == 401
    )

    new_rt = t2.json()["refresh_token"]
    assert client.post(f"{BASE}/logout", json={"refresh_token": new_rt}).status_code == 204
    assert client.post(f"{BASE}/refresh", json={"refresh_token": new_rt}).status_code == 401
    # an access token is not a refresh token
    assert (
        client.post(f"{BASE}/refresh", json={"refresh_token": t1["access_token"]}).status_code
        == 401
    )


def test_update_me(client: TestClient, user: User, auth_headers: dict[str, str]) -> None:
    r = client.put(f"{BASE}/me", json={"full_name": "Alice B"}, headers=auth_headers)
    assert r.json()["full_name"] == "Alice B"
    bad = client.put(
        f"{BASE}/me",
        json={"current_password": "wrong-pass", "new_password": "NewPassw0rd!"},
        headers=auth_headers,
    )
    assert bad.status_code == 401
    ok = client.put(
        f"{BASE}/me",
        json={"current_password": PW, "new_password": "NewPassw0rd!"},
        headers=auth_headers,
    )
    assert ok.status_code == 200
    assert _login(client, user.email, "NewPassw0rd!").status_code == 200
    assert _login(client, user.email, PW).status_code == 401


def test_get_current_user_rejects_bad_tokens(client: TestClient, user: User) -> None:
    assert client.get(f"{BASE}/me").status_code == 401
    assert client.get(f"{BASE}/me", headers={"Authorization": "Bearer garbage"}).status_code == 401
    expired = jwt.encode(
        {"sub": str(user.id), "type": "access", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    assert (
        client.get(f"{BASE}/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
    )


def test_long_password_not_truncated() -> None:
    long_pw = "a" * 100
    h = hash_password(long_pw)
    assert verify_password(long_pw, h)
    assert not verify_password("a" * 72 + "b", h)


def test_google_unconfigured_503(client: TestClient) -> None:
    r = client.get(f"{BASE}/google", follow_redirects=False)
    assert r.status_code == 503


def test_google_state_mismatch_rejected(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "id")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "secret")
    r = client.get(f"{BASE}/google", follow_redirects=False)
    assert r.status_code in (302, 307) and "state=" in r.headers["location"]
    bad = client.get(f"{BASE}/google/callback", params={"code": "c", "state": "forged"})
    assert bad.status_code == 401
    # an access token must not be accepted as state
    bad2 = client.get(
        f"{BASE}/google/callback", params={"code": "c", "state": create_access_token(1)}
    )
    assert bad2.status_code == 401


def test_google_callback_creates_user_and_redirects(
    client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "id")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "secret")
    monkeypatch.setattr(
        "app.routers.auth.oauth.fetch_google_profile",
        lambda code, state, uri: {"email": "g@example.com", "name": "G User"},
    )
    r = client.get(
        f"{BASE}/google/callback",
        params={"code": "c", "state": create_state_token()},
        follow_redirects=False,
    )
    assert r.status_code in (302, 307)
    loc = r.headers["location"]
    assert loc.startswith(settings.ALLOWED_ORIGINS[0] + "/auth/callback#access_token=")
    u = db.scalar(select(User).where(User.email == "g@example.com"))
    assert u and u.oauth_provider == "google" and u.is_verified and u.hashed_password is None


def test_google_login_on_unverified_password_account_drops_password_and_sessions(
    client: TestClient, db: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    from tests.conftest import make_user

    victim = make_user(db, "v@example.com")
    victim.is_verified = False
    db.commit()
    attacker_rt = _login(client, "v@example.com").json()["refresh_token"]
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "id")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "secret")
    monkeypatch.setattr(
        "app.routers.auth.oauth.fetch_google_profile",
        lambda code, state, uri: {"email": "v@example.com", "name": "V"},
    )
    r = client.get(
        f"{BASE}/google/callback",
        params={"code": "c", "state": create_state_token()},
        follow_redirects=False,
    )
    assert r.status_code in (302, 307)
    db.expire_all()
    u = db.scalar(select(User).where(User.email == "v@example.com"))
    assert u and u.is_verified and u.hashed_password is None
    assert _login(client, "v@example.com").status_code == 401
    assert client.post(f"{BASE}/refresh", json={"refresh_token": attacker_rt}).status_code == 401


def test_refresh_reuse_revokes_all_sessions(client: TestClient, db: Session, user: User) -> None:
    t1 = _login(client, user.email).json()["refresh_token"]
    other = _login(client, user.email).json()["refresh_token"]
    t2 = client.post(f"{BASE}/refresh", json={"refresh_token": t1}).json()["refresh_token"]
    # replaying the rotated token kills every session, including the newest ones
    assert client.post(f"{BASE}/refresh", json={"refresh_token": t1}).status_code == 401
    for rt in (t2, other):
        assert client.post(f"{BASE}/refresh", json={"refresh_token": rt}).status_code == 401
    db.expire_all()
    assert all(r.revoked for r in db.scalars(select(RefreshToken)))


def test_password_change_revokes_refresh_tokens(
    client: TestClient, db: Session, user: User
) -> None:
    tokens = _login(client, user.email).json()
    h = {"Authorization": f"Bearer {tokens['access_token']}"}
    body = {"current_password": PW, "new_password": "N3wPassw0rd!x"}
    assert client.put(f"{BASE}/me", json=body, headers=h).status_code == 200
    rt = tokens["refresh_token"]
    assert client.post(f"{BASE}/refresh", json={"refresh_token": rt}).status_code == 401


def test_secret_key_strength() -> None:
    from pydantic import ValidationError

    from app.config import Settings

    def make(key: str, env: str) -> Settings:
        return Settings(DATABASE_URL="sqlite://", SECRET_KEY=key, APP_ENV=env, _env_file=None)

    make("x" * 40, "production")
    for key in ("short", "change-me-" + "x" * 30, "your-secret-key-" + "x" * 30):
        with pytest.raises(ValidationError):
            make(key, "production")
        make(key, "development")
