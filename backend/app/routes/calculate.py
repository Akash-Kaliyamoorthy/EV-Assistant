"""
Calculation endpoints — delegates to deterministic services.
Gemini is NOT called here; these are pure numeric endpoints.
"""
from fastapi import APIRouter
from app.models.schemas import (
    ChargingTimeRequest, ChargingTimeResponse,
    ChargingCostRequest, ChargingCostResponse,
    RangeRequest, RangeResponse,
    RecommendationRequest, RecommendationResponse,
)
from app.services.calculations import (
    calculate_charging_time,
    calculate_charging_cost,
    calculate_range,
    recommend_charging,
)

router = APIRouter(prefix="/api/calculate", tags=["Calculations"])


@router.post(
    "/charging-time",
    response_model=ChargingTimeResponse,
    summary="Estimate EV charging time",
)
async def charging_time(req: ChargingTimeRequest) -> ChargingTimeResponse:
    """
    Estimates charging time based on battery capacity, SOC, and charger power.
    All math is deterministic — Gemini is not involved.
    """
    return calculate_charging_time(req)


@router.post(
    "/charging-cost",
    response_model=ChargingCostResponse,
    summary="Estimate EV charging cost",
)
async def charging_cost(req: ChargingCostRequest) -> ChargingCostResponse:
    """
    Estimates charging cost based on energy required and electricity tariff.
    Defaults to INR (₹) unless another currency symbol is specified.
    """
    return calculate_charging_cost(req)


@router.post(
    "/range",
    response_model=RangeResponse,
    summary="Estimate remaining driving range",
)
async def range_estimate(req: RangeRequest) -> RangeResponse:
    """
    Estimates remaining driving range from current battery SOC and efficiency.
    """
    return calculate_range(req)


# Recommendation is grouped under /api/recommend for clarity
