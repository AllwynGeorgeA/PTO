"""Password hashing and JWT helpers."""

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.config import settings
from app.exceptions import UnauthorizedError

REFRESH_TOKEN_EXPIRE_DAYS = 7


def _pw_bytes(password: str) -> bytes:
    # Pre-hash so passwords > 72 bytes are not silently truncated (bcrypt limit).
    return hashlib.sha256(password.encode()).hexdigest().encode()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_pw_bytes(password), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(_pw_bytes(password), hashed.encode())
    except ValueError:
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _encode(claims: dict[str, object], token_type: str, ttl: timedelta) -> str:
    now = datetime.now(UTC)
    payload = {**claims, "type": token_type, "iat": now, "exp": now + ttl, "jti": uuid.uuid4().hex}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: int) -> str:
    return _encode(
        {"sub": str(user_id)}, "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )


def create_refresh_token(user_id: int) -> str:
    return _encode({"sub": str(user_id)}, "refresh", timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))


def create_state_token() -> str:
    return _encode({}, "oauth_state", timedelta(minutes=10))


def decode_token(token: str, expected_type: str = "access") -> dict[str, object]:
    try:
        payload: dict[str, object] = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Invalid or expired token") from exc
    if payload.get("type") != expected_type:
        raise UnauthorizedError("Invalid token type")
    return payload
