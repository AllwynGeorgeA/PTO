import logging

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.exceptions import register_exception_handlers
from app.limiter import limiter
from app.routers import auth as auth_router
from app.routers import billing, dashboard, handover, pto_plans, replies

logging.basicConfig(level=logging.INFO)

API_PREFIX = "/api/v1"

app = FastAPI(title=settings.APP_NAME, version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_exception_handlers(app)

api_router = APIRouter(prefix=API_PREFIX)
api_router.include_router(auth_router.router)
for _module in (pto_plans, dashboard, replies, handover, billing):
    api_router.include_router(_module.router)
app.include_router(api_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}
