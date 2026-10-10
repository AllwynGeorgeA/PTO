"""Google OAuth 2.0 authorization-code flow via httpx."""

import logging
from urllib.parse import urlencode

import httpx

from app.auth.jwt import create_state_token, decode_token
from app.config import settings
from app.exceptions import AppError, UnauthorizedError

logger = logging.getLogger(__name__)

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


class OAuthUnavailableError(AppError):
    status_code, code = 503, "oauth_not_configured"


def google_enabled() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def build_authorize_url(redirect_uri: str) -> str:
    if not google_enabled():
        raise OAuthUnavailableError(
            "Google sign-in is not configured (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)"
        )
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": create_state_token(),
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def fetch_google_profile(code: str, state: str, redirect_uri: str) -> dict[str, str]:
    """Verify state, exchange the code, return {email, name}."""
    if not google_enabled():
        raise OAuthUnavailableError("Google sign-in is not configured")
    decode_token(state, expected_type="oauth_state")  # raises UnauthorizedError on mismatch
    try:
        with httpx.Client(timeout=10) as http:
            tok = http.post(
                TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            tok.raise_for_status()
            info = http.get(
                USERINFO_URL,
                headers={"Authorization": f"Bearer {tok.json()['access_token']}"},
            )
            info.raise_for_status()
            data = info.json()
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        logger.warning("Google OAuth exchange failed: %s", exc)
        raise UnauthorizedError("Google authentication failed") from exc
    if not data.get("email") or not data.get("email_verified", False):
        raise UnauthorizedError("Google account email not verified")
    return {"email": data["email"].lower(), "name": data.get("name", "")}
