"""
EV Charging Assistant — FastAPI application entry point.

Uses the modern lifespan context manager pattern (not deprecated startup/shutdown events).
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load .env file in development (no-op if env vars already set, e.g. on Render)
load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup logic before yield, shutdown after."""
    logger.info("EV Charging Assistant backend starting up...")

    # Validate critical environment variables at startup
    if not os.environ.get("GEMINI_API_KEY"):
        logger.warning(
            "GEMINI_API_KEY is not set! Chat endpoint will return 503 until configured."
        )
    else:
        logger.info("Gemini API key detected — AI chat is ready.")

    yield  # Application serves requests here

    logger.info("EV Charging Assistant backend shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="EV Charging Assistant API",
    description=(
        "Backend API for the EV Charging Assistant. Provides AI-powered chat, "
        "deterministic charging/range/cost calculations, demo station data, "
        "and trip planning."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------------------------
# CORS — restrictive in production, open for local dev
# ---------------------------------------------------------------------------

def _build_cors_origins() -> list[str]:
    """
    Returns allowed origins:
    - Development: localhost Vite dev server
    - Production: FRONTEND_URL environment variable (must be set to your GitHub Pages URL)
    """
    origins = [
        "http://localhost:5173",    # Vite default
        "http://localhost:3000",    # fallback
        "http://127.0.0.1:5173",
    ]
    frontend_url = os.environ.get("FRONTEND_URL", "")
    if frontend_url:
        origins.append(frontend_url.rstrip("/"))
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)


# ---------------------------------------------------------------------------
# Global error handler — never leak stack traces to clients
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )


# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------

from app.routes import health, chat, calculate, recommend, stations, trip  # noqa: E402

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(calculate.router)
app.include_router(recommend.router)
app.include_router(stations.router)
app.include_router(trip.router)


# ---------------------------------------------------------------------------
# Root redirect to docs
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {
        "name": "EV Charging Assistant API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
