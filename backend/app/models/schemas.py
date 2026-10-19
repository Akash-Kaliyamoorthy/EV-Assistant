"""
Pydantic request/response models for the EV Charging Assistant API.
All models use Pydantic v2 syntax.
"""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


# ---------------------------------------------------------------------------
# Shared / base models
# ---------------------------------------------------------------------------

class VehicleProfile(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    battery_capacity_kwh: Optional[float] = Field(default=None, ge=1, le=200)
    current_soc_percent: Optional[float] = Field(default=None, ge=0, le=100)
    target_soc_percent: Optional[float] = Field(default=None, ge=0, le=100)
    efficiency_km_per_kwh: Optional[float] = Field(default=None, ge=0.5, le=20)
    connector_type: Optional[str] = None
    home_tariff_inr_per_kwh: Optional[float] = Field(default=None, ge=0)
    preferred_charger_power_kw: Optional[float] = Field(default=None, ge=0)


class ConversationTurn(BaseModel):
    role: str  # "user" or "model"
    content: str


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_history: list[ConversationTurn] = Field(default_factory=list)
    vehicle_profile: Optional[VehicleProfile] = None

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be blank or whitespace only.")
        return v.strip()


class ChatResponse(BaseModel):
    reply: str
    calculation_context: Optional[dict[str, Any]] = None
    model_used: Optional[str] = None


# ---------------------------------------------------------------------------
# Charging-time calculation
# ---------------------------------------------------------------------------

class ChargingTimeRequest(BaseModel):
    battery_capacity_kwh: float = Field(gt=0, le=200, description="Battery capacity in kWh")
    current_soc_percent: float = Field(ge=0, le=100, description="Current state-of-charge %")
    target_soc_percent: float = Field(ge=0, le=100, description="Target state-of-charge %")
    charger_power_kw: float = Field(gt=0, le=500, description="Charger power in kW")
    efficiency_factor: float = Field(
        default=0.9, ge=0.5, le=1.0,
        description="Charging efficiency factor (0.5–1.0)"
    )

    @field_validator("target_soc_percent")
    @classmethod
    def target_must_exceed_current(cls, v: float, info: Any) -> float:
        current = info.data.get("current_soc_percent")
        if current is not None and v <= current:
            raise ValueError(
                f"target_soc_percent ({v}) must be greater than current_soc_percent ({current})."
            )
        return v


class ChargingTimeResponse(BaseModel):
    energy_required_kwh: float
    estimated_time_hours: float
    estimated_time_minutes: float
    soc_gain_percent: float
    efficiency_factor: float
    disclaimer: str


# ---------------------------------------------------------------------------
# Charging-cost calculation
# ---------------------------------------------------------------------------

class ChargingCostRequest(BaseModel):
    battery_capacity_kwh: float = Field(gt=0, le=200)
    current_soc_percent: float = Field(ge=0, le=100)
    target_soc_percent: float = Field(ge=0, le=100)
    tariff_per_kwh: float = Field(gt=0, description="Electricity tariff per kWh (INR by default)")
    efficiency_factor: float = Field(default=0.9, ge=0.5, le=1.0)
    efficiency_km_per_kwh: Optional[float] = Field(default=None, ge=0.5, le=20)
    currency_symbol: str = Field(default="₹")

    @field_validator("target_soc_percent")
    @classmethod
    def target_must_exceed_current(cls, v: float, info: Any) -> float:
        current = info.data.get("current_soc_percent")
        if current is not None and v <= current:
            raise ValueError("target_soc_percent must be greater than current_soc_percent.")
        return v


class ChargingCostResponse(BaseModel):
    energy_required_kwh: float
    energy_delivered_kwh: float
    total_cost: float
    cost_per_10_percent_soc: float
    cost_per_100_km: Optional[float] = None
    currency_symbol: str
    soc_gain_percent: float


# ---------------------------------------------------------------------------
# Range estimation
# ---------------------------------------------------------------------------

class RangeRequest(BaseModel):
    battery_capacity_kwh: float = Field(gt=0, le=200)
    current_soc_percent: float = Field(ge=0, le=100)
    efficiency_km_per_kwh: float = Field(ge=0.5, le=20)


class RangeResponse(BaseModel):
    remaining_energy_kwh: float
    estimated_range_km: float
    current_soc_percent: float
    disclaimer: str


# ---------------------------------------------------------------------------
# Charging recommendation
# ---------------------------------------------------------------------------

class RecommendationRequest(BaseModel):
    current_soc_percent: float = Field(ge=0, le=100)
    target_soc_percent: float = Field(ge=0, le=100)
    trip_distance_km: Optional[float] = Field(default=None, ge=0)
    efficiency_km_per_kwh: Optional[float] = Field(default=None, ge=0.5, le=20)
    charger_power_kw: Optional[float] = Field(default=None, gt=0, le=500)


class RecommendationResponse(BaseModel):
    tier: str               # "charge_now" | "optional" | "not_necessary"
    message: str
    urgency_level: int      # 1 (low) to 3 (high)
    disclaimer: str


# ---------------------------------------------------------------------------
# Stations
# ---------------------------------------------------------------------------

class StationFilters(BaseModel):
    charger_type: Optional[str] = None   # "AC" | "DC"
    connector_type: Optional[str] = None
    max_distance_km: Optional[float] = Field(default=None, ge=0)
    available_only: bool = False


class NearbyStationsRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    radius_km: float = Field(default=10.0, gt=0, le=500)
    filters: Optional[StationFilters] = None


class StationInfo(BaseModel):
    id: str
    name: str
    city: str
    latitude: float
    longitude: float
    distance_km: Optional[float] = None
    charger_type: str       # "AC" | "DC"
    connector_type: str     # e.g. "CCS2", "CHAdeMO", "Type 2"
    power_kw: float
    available: bool
    price_per_kwh_inr: Optional[float] = None
    hours: str              # e.g. "24/7" or "06:00–22:00"
    address: Optional[str] = None


# ---------------------------------------------------------------------------
# Trip planning
# ---------------------------------------------------------------------------

class TripEstimateRequest(BaseModel):
    origin: str = Field(min_length=2, max_length=200)
    destination: str = Field(min_length=2, max_length=200)
    current_soc_percent: float = Field(ge=0, le=100)
    battery_capacity_kwh: float = Field(gt=0, le=200)
    efficiency_km_per_kwh: float = Field(ge=0.5, le=20)
    desired_arrival_soc_percent: float = Field(ge=0, le=100)
    trip_distance_km: Optional[float] = Field(
        default=None, ge=1,
        description="Provide estimated distance. If omitted, rough heuristic is used."
    )
    charger_power_kw: float = Field(default=50.0, gt=0, le=500)


class TripEstimateResponse(BaseModel):
    origin: str
    destination: str
    estimated_distance_km: float
    starting_soc_percent: float
    energy_required_kwh: float
    projected_arrival_soc_percent: float
    recommended_charge_kwh: float
    charging_required: bool
    suggested_charging_stop: Optional[str] = None
    estimated_charging_duration_minutes: Optional[float] = None
    disclaimer: str


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    version: str
    gemini_configured: bool
