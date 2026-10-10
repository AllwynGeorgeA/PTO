from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "PTOShield AI"
    # "development" or "test" allow placeholder SECRET_KEYs; anything else is strict.
    APP_ENV: str = "production"
    # Required: startup fails with a clear validation error if missing/empty.
    DATABASE_URL: str = Field(min_length=1)
    SECRET_KEY: str = Field(min_length=1)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = ""
    DODO_API_KEY: str = ""
    DODO_WEBHOOK_SECRET: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    VITE_API_URL: str = "http://localhost:8000"

    @model_validator(mode="after")
    def _check_secret_key(self) -> "Settings":
        if self.APP_ENV in ("development", "test"):
            return self
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        if any(p in self.SECRET_KEY.lower() for p in ("change-me", "your-secret-key")):
            raise ValueError("SECRET_KEY is still the placeholder; generate a real one")
        return self

    @property
    def openai_enabled(self) -> bool:
        return bool(self.OPENAI_API_KEY)

    @property
    def dodo_demo_mode(self) -> bool:
        return not self.DODO_API_KEY

    @property
    def smtp_enabled(self) -> bool:
        return bool(self.SMTP_HOST)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
