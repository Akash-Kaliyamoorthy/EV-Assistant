"""
Charging recommendation route.
"""
from fastapi import APIRouter
from app.models.schemas import RecommendationRequest, RecommendationResponse
from app.services.calculations import recommend_charging

router = APIRouter(prefix="/api/recommend", tags=["Recommendations"])


@router.post(
    "/charging",
    response_model=RecommendationResponse,
    summary="Get a charging recommendation",
)
async def charging_recommendation(req: RecommendationRequest) -> RecommendationResponse:
    """
    Returns a rule-based charging recommendation (not a certified BMS decision).
    """
    return recommend_charging(req)
