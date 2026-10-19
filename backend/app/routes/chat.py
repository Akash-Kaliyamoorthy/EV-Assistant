"""
Chat route — the main conversational endpoint.

Orchestration:
1. Validate the request.
2. Detect if the message implies a numeric calculation.
3. If so, run the deterministic calculation service first.
4. Pass computed results to Gemini for natural-language explanation.
5. Return structured response to the frontend.
"""
from __future__ import annotations

import re
import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.models.schemas import ChatRequest, ChatResponse, VehicleProfile
from app.services import gemini_service
from app.services import calculations

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Chat"])


# ---------------------------------------------------------------------------
# Keyword detection helpers
# ---------------------------------------------------------------------------

_TIME_KEYWORDS = re.compile(
    r"\b(how long|charging time|time to charge|minutes|hours|charge from|charge to|"
    r"how many hours|how many minutes)\b",
    re.IGNORECASE,
)
_COST_KEYWORDS = re.compile(
    r"\b(cost|price|money|rupees|inr|₹|how much.*charge|charging.*cost|charge.*cost)\b",
    re.IGNORECASE,
)
_RANGE_KEYWORDS = re.compile(
    r"\b(range|how far|distance.*battery|km.*left|remaining range|how many km)\b",
    re.IGNORECASE,
)


def _try_build_calculation_context(
    message: str,
    profile: Optional[VehicleProfile],
) -> Optional[dict[str, Any]]:
    """
    If the message implies a calculation AND the vehicle profile has enough data,
    run the relevant deterministic service and return the results as context dict.
    Returns None if calculation is not applicable or data is insufficient.
    """
    if profile is None:
        return None

    ctx: dict[str, Any] = {}

    # Charging time
    if _TIME_KEYWORDS.search(message):
        if (
            profile.battery_capacity_kwh
            and profile.current_soc_percent is not None
            and profile.target_soc_percent is not None
            and profile.target_soc_percent > profile.current_soc_percent
        ):
            from app.models.schemas import ChargingTimeRequest
            try:
                req = ChargingTimeRequest(
                    battery_capacity_kwh=profile.battery_capacity_kwh,
                    current_soc_percent=profile.current_soc_percent,
                    target_soc_percent=profile.target_soc_percent,
                    charger_power_kw=profile.preferred_charger_power_kw or 7.4,
                )
                result = calculations.calculate_charging_time(req)
                ctx["charging_time"] = result.model_dump()
                ctx["calculation_type"] = "charging_time"
            except Exception as e:
                logger.warning("Auto-calculation (time) failed: %s", e)

    # Charging cost
    if _COST_KEYWORDS.search(message) and not ctx:
        if (
            profile.battery_capacity_kwh
            and profile.current_soc_percent is not None
            and profile.target_soc_percent is not None
            and profile.target_soc_percent > profile.current_soc_percent
            and profile.home_tariff_inr_per_kwh
        ):
            from app.models.schemas import ChargingCostRequest
            try:
                req = ChargingCostRequest(
                    battery_capacity_kwh=profile.battery_capacity_kwh,
                    current_soc_percent=profile.current_soc_percent,
                    target_soc_percent=profile.target_soc_percent,
                    tariff_per_kwh=profile.home_tariff_inr_per_kwh,
                    efficiency_km_per_kwh=profile.efficiency_km_per_kwh,
                )
                result = calculations.calculate_charging_cost(req)
                ctx["charging_cost"] = result.model_dump()
                ctx["calculation_type"] = "charging_cost"
            except Exception as e:
                logger.warning("Auto-calculation (cost) failed: %s", e)

    # Range
    if _RANGE_KEYWORDS.search(message) and not ctx:
        if (
            profile.battery_capacity_kwh
            and profile.current_soc_percent is not None
            and profile.efficiency_km_per_kwh
        ):
            from app.models.schemas import RangeRequest
            try:
                req = RangeRequest(
                    battery_capacity_kwh=profile.battery_capacity_kwh,
                    current_soc_percent=profile.current_soc_percent,
                    efficiency_km_per_kwh=profile.efficiency_km_per_kwh,
                )
                result = calculations.calculate_range(req)
                ctx["range_estimate"] = result.model_dump()
                ctx["calculation_type"] = "range"
            except Exception as e:
                logger.warning("Auto-calculation (range) failed: %s", e)

    return ctx if ctx else None


# ---------------------------------------------------------------------------
# POST /api/chat
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse, summary="Main AI chat endpoint")
async def chat(req: ChatRequest) -> ChatResponse:
    """
    Send a message to the EV Charging Assistant.

    The backend:
    1. Optionally runs deterministic calculations from the vehicle profile.
    2. Passes results to Gemini for natural-language explanation.
    3. Returns the AI reply and any structured calculation data.
    """
    if not gemini_service.is_gemini_configured():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI service not configured",
                "message": (
                    "The GEMINI_API_KEY environment variable is not set. "
                    "Please configure it in your environment."
                ),
            },
        )

    # Try to auto-compute numeric context from vehicle profile
    profile_dict = req.vehicle_profile.model_dump() if req.vehicle_profile else None
    calculation_context = _try_build_calculation_context(req.message, req.vehicle_profile)

    # Convert history to the format the service expects
    history = [{"role": t.role, "content": t.content} for t in req.conversation_history]

    try:
        result = await gemini_service.chat_with_gemini(
            user_message=req.message,
            conversation_history=history,
            vehicle_profile=profile_dict,
            calculation_context=calculation_context,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail={"error": "AI unavailable", "message": str(exc)})

    return ChatResponse(
        reply=result["reply"],
        calculation_context=calculation_context,
        model_used=result.get("model_used"),
    )
