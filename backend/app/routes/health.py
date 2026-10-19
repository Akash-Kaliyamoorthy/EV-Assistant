"""
Health check route.
"""
from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services.gemini_service import is_gemini_configured

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Liveness check")
async def health_check() -> HealthResponse:
    """Returns service health status and configuration info."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        gemini_configured=is_gemini_configured(),
    )
