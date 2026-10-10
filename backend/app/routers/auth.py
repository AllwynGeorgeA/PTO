from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import oauth
from app.config import settings
from app.dependencies import get_current_user, get_db
from app.limiter import limiter
from app.models import User
from app.schemas.auth import (
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
    UserUpdate,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _callback_uri(request: Request) -> str:
    return str(request.url_for("google_callback"))


@router.post("/register", response_model=UserOut, status_code=201)
@limiter.limit("10/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)) -> User:
    return auth_service.register(db, body.email, body.password, body.full_name)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> TokenResponse:
    return auth_service.login(db, form.username, form.password)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
def refresh(request: Request, body: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.refresh(db, body.refresh_token)


@router.post("/logout", status_code=204)
def logout(body: RefreshRequest, db: Session = Depends(get_db)) -> None:
    auth_service.logout(db, body.refresh_token)


@router.get("/google")
def google_login(request: Request) -> RedirectResponse:
    return RedirectResponse(oauth.build_authorize_url(_callback_uri(request)))


@router.get("/google/callback")
@limiter.limit("30/minute")
def google_callback(
    request: Request, code: str, state: str, db: Session = Depends(get_db)
) -> RedirectResponse:
    profile = oauth.fetch_google_profile(code, state, _callback_uri(request))
    tokens = auth_service.oauth_login(db, profile["email"], profile["name"])
    frag = urlencode({"access_token": tokens.access_token, "refresh_token": tokens.refresh_token})
    return RedirectResponse(f"{settings.ALLOWED_ORIGINS[0]}/auth/callback#{frag}")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.put("/me", response_model=UserOut)
def update_me(
    body: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> User:
    return auth_service.update_profile(db, user, body)
