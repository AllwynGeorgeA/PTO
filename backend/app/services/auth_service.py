"""Auth business logic."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.auth.jwt import (
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.exceptions import AppError, ConflictError, UnauthorizedError
from app.models import RefreshToken, User
from app.schemas.auth import TokenResponse, UserUpdate


def _get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def issue_tokens(db: Session, user: User) -> TokenResponse:
    refresh_token = create_refresh_token(user.id)
    db.add(
        RefreshToken(
            user_id=user.id,
            token=hash_token(refresh_token),
            expires_at=datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id), refresh_token=refresh_token)


def register(db: Session, email: str, password: str, full_name: str) -> User:
    if _get_by_email(db, email):
        raise ConflictError("Email already registered")
    user = User(email=email.lower(), hashed_password=hash_password(password), full_name=full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, email: str, password: str) -> TokenResponse:
    user = _get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Incorrect email or password")
    if not user.is_active:
        raise UnauthorizedError("Account is inactive")
    return issue_tokens(db, user)


def refresh(db: Session, raw: str) -> TokenResponse:
    decode_token(raw, expected_type="refresh")
    row = db.scalar(select(RefreshToken).where(RefreshToken.token == hash_token(raw)))
    if not row:
        raise UnauthorizedError("Refresh token revoked or unknown")
    if row.revoked:
        # Reuse of a rotated token: assume theft, kill every session for this user.
        _revoke_all(db, row.user_id)
        db.commit()
        raise UnauthorizedError("Refresh token revoked or unknown")
    user = db.get(User, row.user_id)
    if not user or not user.is_active:
        raise UnauthorizedError("Account is inactive")
    # Atomic single-use: only one concurrent request can flip revoked false -> true.
    claimed = db.execute(
        update(RefreshToken)
        .where(RefreshToken.token == row.token, RefreshToken.revoked.is_(False))
        .values(revoked=True)
    )
    if claimed.rowcount != 1:
        db.rollback()
        raise UnauthorizedError("Refresh token revoked or unknown")
    return issue_tokens(db, user)


def _revoke_all(db: Session, user_id: int) -> None:
    """Revoke every refresh token of a user (caller commits)."""
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
        .values(revoked=True)
    )


def logout(db: Session, raw: str) -> None:
    row = db.scalar(select(RefreshToken).where(RefreshToken.token == hash_token(raw)))
    if row and not row.revoked:
        row.revoked = True
        db.commit()


def update_profile(db: Session, user: User, data: UserUpdate) -> User:
    if data.new_password:
        if not data.current_password or not verify_password(
            data.current_password, user.hashed_password
        ):
            raise UnauthorizedError("Current password is incorrect")
        user.hashed_password = hash_password(data.new_password)
        _revoke_all(db, user.id)
    elif data.current_password:
        raise AppError("new_password is required to change password")
    if data.full_name is not None:
        user.full_name = data.full_name
    db.commit()
    db.refresh(user)
    return user


def oauth_login(db: Session, email: str, name: str) -> TokenResponse:
    user = _get_by_email(db, email)
    if user is None:
        user = User(email=email, full_name=name or None, oauth_provider="google", is_verified=True)
        db.add(user)
    elif not user.is_active:
        raise UnauthorizedError("Account is inactive")
    else:
        if not user.is_verified:
            # Unverified password account: the registrant may be an attacker who
            # pre-registered this email. Drop their password and sessions.
            user.hashed_password = None
            _revoke_all(db, user.id)
        user.oauth_provider = user.oauth_provider or "google"
        user.is_verified = True
    db.commit()
    db.refresh(user)
    return issue_tokens(db, user)
