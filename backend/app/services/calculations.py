"""
Deterministic calculation services for the EV Charging Assistant.

IMPORTANT: These functions perform all numeric math independently of Gemini.
Gemini is given the *results* of these functions to explain in natural language.
Each function is pure (no side effects, no Gemini dependency) and fully unit-testable.
"""
from __future__ import annotations

import math
from typing import Optional

from app.models.schemas import (
    ChargingTimeRequest,
    ChargingTimeResponse,
    ChargingCostRequest,
    ChargingCostResponse,
    RangeRequest,
    RangeResponse,
    RecommendationRequest,
    RecommendationResponse,
    TripEstimateRequest,
    TripEstimateResponse,
)


# ---------------------------------------------------------------------------
# Charging-time calculation
# ---------------------------------------------------------------------------

def calculate_charging_time(req: ChargingTimeRequest) -> ChargingTimeResponse:
    """
    Estimate the time to charge from current_soc to target_soc.

    Formula:
        energy_required (kWh) = capacity × (target_soc − current_soc) / 100
        time (hours)           = energy_required / (charger_power × efficiency_factor)

    Real charging curves are non-linear (taper above ~80% SOC); this model
    uses a linear approximation and flags that in the disclaimer.
    """
    soc_gain = req.target_soc_percent - req.current_soc_percent
    energy_required_kwh = req.battery_capacity_kwh * soc_gain / 100.0
    estimated_time_hours = energy_required_kwh / (req.charger_power_kw * req.efficiency_factor)
    estimated_time_minutes = estimated_time_hours * 60

    disclaimer = (
        "This is a linear estimate. Real charging slows significantly above ~80% SOC due "
        "to CC-CV charging curves. Actual time may be 10–30% longer for high target SOC. "
        "Ambient temperature, battery age, and BMS throttling also affect charging speed."
    )

    return ChargingTimeResponse(
        energy_required_kwh=round(energy_required_kwh, 3),
        estimated_time_hours=round(estimated_time_hours, 3),
        estimated_time_minutes=round(estimated_time_minutes, 1),
        soc_gain_percent=round(soc_gain, 1),
        efficiency_factor=req.efficiency_factor,
        disclaimer=disclaimer,
    )


# ---------------------------------------------------------------------------
# Charging-cost calculation
# ---------------------------------------------------------------------------

def calculate_charging_cost(req: ChargingCostRequest) -> ChargingCostResponse:
    """
    Estimate the monetary cost of charging.

    Formula:
        energy_required   = capacity × (target_soc − current_soc) / 100
        energy_delivered  = energy_required / efficiency_factor   (accounts for losses)
        total_cost        = energy_delivered × tariff_per_kwh
    """
    soc_gain = req.target_soc_percent - req.current_soc_percent
    energy_required_kwh = req.battery_capacity_kwh * soc_gain / 100.0
    energy_delivered_kwh = energy_required_kwh / req.efficiency_factor
    total_cost = energy_delivered_kwh * req.tariff_per_kwh
    cost_per_10_pct = (10 / soc_gain * total_cost) if soc_gain > 0 else 0.0

    cost_per_100_km: Optional[float] = None
    if req.efficiency_km_per_kwh:
        # cost per km × 100
        cost_per_100_km = round((req.tariff_per_kwh / req.efficiency_km_per_kwh) * 100, 2)

    return ChargingCostResponse(
        energy_required_kwh=round(energy_required_kwh, 3),
        energy_delivered_kwh=round(energy_delivered_kwh, 3),
        total_cost=round(total_cost, 2),
        cost_per_10_percent_soc=round(cost_per_10_pct, 2),
        cost_per_100_km=cost_per_100_km,
        currency_symbol=req.currency_symbol,
        soc_gain_percent=round(soc_gain, 1),
    )


# ---------------------------------------------------------------------------
# Range estimation
# ---------------------------------------------------------------------------

def calculate_range(req: RangeRequest) -> RangeResponse:
    """
    Estimate driving range from current SOC.

    Formula:
        remaining_energy = capacity × current_soc / 100
        estimated_range  = remaining_energy × efficiency (km/kWh)
    """
    remaining_energy_kwh = req.battery_capacity_kwh * req.current_soc_percent / 100.0
    estimated_range_km = remaining_energy_kwh * req.efficiency_km_per_kwh

    disclaimer = (
        "Estimated range assumes constant efficiency. Real-world range varies with "
        "traffic conditions, highway speed, terrain, ambient temperature, HVAC usage, "
        "driving style, vehicle load, tyre pressure, and battery health (degradation). "
        "This estimate may be 15–30% optimistic under adverse conditions."
    )

    return RangeResponse(
        remaining_energy_kwh=round(remaining_energy_kwh, 3),
        estimated_range_km=round(estimated_range_km, 1),
        current_soc_percent=req.current_soc_percent,
        disclaimer=disclaimer,
    )


# ---------------------------------------------------------------------------
# Charging recommendation
# ---------------------------------------------------------------------------

def recommend_charging(req: RecommendationRequest) -> RecommendationResponse:
    """
    Rule-based charging recommendation using SOC, trip distance, and efficiency.

    GUIDANCE ONLY — not a certified battery-management decision.
    """
    current = req.current_soc_percent
    target = req.target_soc_percent

    # If trip distance and efficiency are supplied, check if the car can make it
    if req.trip_distance_km is not None and req.efficiency_km_per_kwh is not None:
        # This logic assumes battery_capacity is implied from range math
        # We work purely from current SOC as a proxy:
        # A rough heuristic: assume a "normalised" 100% SOC = 400 km reference range
        # Real recommendation would need actual capacity — see docstring.
        pass  # Trip-aware logic handled in trip estimation

    soc_gain_needed = target - current

    # Tier logic
    if current <= 20:
        tier = "charge_now"
        message = (
            f"Your battery is at {current:.0f}% — charging is strongly recommended now. "
            f"You need to add approximately {soc_gain_needed:.0f}% to reach your target of {target:.0f}%."
        )
        urgency = 3
    elif current <= 40:
        tier = "charge_now"
        message = (
            f"At {current:.0f}% SOC, charging is recommended before your next trip. "
            f"Charging to {target:.0f}% will give you {soc_gain_needed:.0f}% more capacity."
        )
        urgency = 2
    elif current <= 60:
        tier = "optional"
        message = (
            f"Your battery is at {current:.0f}%. Charging is optional — suitable for shorter trips. "
            f"Consider charging to {target:.0f}% if you have a longer journey planned."
        )
        urgency = 1
    elif current <= 80:
        tier = "optional"
        message = (
            f"At {current:.0f}% SOC you have good range available. Charging is optional depending "
            "on your plans. For daily top-ups, charging to 80% is recommended over 100% for battery longevity."
        )
        urgency = 1
    else:
        tier = "not_necessary"
        message = (
            f"Your battery is at {current:.0f}% — no charging needed for most trips. "
            "Avoid charging above 80–90% regularly to preserve long-term battery health unless "
            "you need maximum range for a long journey."
        )
        urgency = 1

    disclaimer = (
        "This is guidance only, not a certified battery-management recommendation. "
        "Consult your vehicle's manual and manufacturer app for official guidance."
    )

    return RecommendationResponse(tier=tier, message=message, urgency_level=urgency, disclaimer=disclaimer)


# ---------------------------------------------------------------------------
# Trip estimation
# ---------------------------------------------------------------------------

# Average distance (km) used as heuristic when user doesn't supply trip_distance_km.
# FUTURE EXTENSION: Replace this heuristic with a real routing API call.
# See: TripEstimateRequest.trip_distance_km field — users are encouraged to supply this.
_HEURISTIC_KM_PER_CITY_PAIR_DEFAULT = 150.0  # very rough placeholder


def estimate_trip(req: TripEstimateRequest) -> TripEstimateResponse:
    """
    Estimate charging requirements for a road trip.

    NOTE: This does NOT use a live routing API. Distance is user-supplied or estimated
    via a rough heuristic. A real routing API (Google Maps, OSRM, etc.) should be
    plugged in at the FUTURE EXTENSION seam below.
    """
    # --- FUTURE EXTENSION SEAM: routing API ---
    # To integrate a real routing API, replace the block below with:
    #   distance_km = routing_api.get_distance(req.origin, req.destination)
    # The rest of the function requires no other changes.
    if req.trip_distance_km:
        distance_km = req.trip_distance_km
        distance_source = "user-supplied"
    else:
        distance_km = _HEURISTIC_KM_PER_CITY_PAIR_DEFAULT
        distance_source = "heuristic estimate (please supply actual distance for accuracy)"
    # --- END FUTURE EXTENSION SEAM ---

    # Energy required for the trip (kWh)
    energy_for_trip_kwh = distance_km / req.efficiency_km_per_kwh

    # Starting energy
    starting_energy_kwh = req.battery_capacity_kwh * req.current_soc_percent / 100.0

    # Minimum buffer energy (desired arrival SOC)
    buffer_energy_kwh = req.battery_capacity_kwh * req.desired_arrival_soc_percent / 100.0

    # Projected arrival SOC without charging
    arrival_energy_kwh = starting_energy_kwh - energy_for_trip_kwh
    arrival_soc = max(0.0, (arrival_energy_kwh / req.battery_capacity_kwh) * 100.0)

    # How much to charge
    charging_required = arrival_energy_kwh < buffer_energy_kwh
    recommended_charge_kwh = 0.0
    charging_duration_min: Optional[float] = None
    suggested_stop: Optional[str] = None

    if charging_required:
        recommended_charge_kwh = buffer_energy_kwh - arrival_energy_kwh
        if recommended_charge_kwh < 0:
            recommended_charge_kwh = 0.0
        charging_duration_min = (recommended_charge_kwh / req.charger_power_kw) * 60
        # Rough midpoint suggestion
        midpoint_km = distance_km / 2
        suggested_stop = (
            f"Approximately {midpoint_km:.0f} km from {req.origin} "
            f"(halfway point — verify with a real charging-network map)"
        )

    disclaimer = (
        f"Distance: {distance_source}. This trip plan is an estimate, not a live navigation route. "
        "Charging stop location is a rough midpoint — use a real EV routing tool (e.g., ABRP, "
        "Google Maps EV routing) for precise charging waypoints. Real-world range varies."
    )

    return TripEstimateResponse(
        origin=req.origin,
        destination=req.destination,
        estimated_distance_km=round(distance_km, 1),
        starting_soc_percent=req.current_soc_percent,
        energy_required_kwh=round(energy_for_trip_kwh, 3),
        projected_arrival_soc_percent=round(arrival_soc, 1),
        recommended_charge_kwh=round(recommended_charge_kwh, 3),
        charging_required=charging_required,
        suggested_charging_stop=suggested_stop,
        estimated_charging_duration_minutes=round(charging_duration_min, 1) if charging_duration_min else None,
        disclaimer=disclaimer,
    )
