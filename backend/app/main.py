import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.config import get_settings
from app.auth.router import router as auth_router
from app.api.content_router import router as content_router
from app.api.history_router import router as history_router, router_tone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    # Ensure MongoDB index on tone_profiles for fast per-user lookups
    from app.db.mongo import get_db
    db = get_db()
    await db.tone_profiles.create_index([("user_id", 1)])
    logger.info("ContentOS backend starting up")
    yield
    logger.info("ContentOS backend shutting down")


app = FastAPI(
    title="ContentOS API",
    description="AI-powered content repurposing platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(content_router)
app.include_router(history_router)
app.include_router(router_tone)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ContentOS"}


@app.get("/")
async def root():
    return {"message": "ContentOS API — visit /docs for API reference"}
