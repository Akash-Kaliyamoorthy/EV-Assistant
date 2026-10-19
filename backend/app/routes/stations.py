"""
Charging stations routes.
Data is fictional demo data — clearly labeled as sample data in responses.
"""
from fastapi import APIRouter, Query
from typing import Optional

from app.models.schemas import NearbyStationsRequest, StationFilters, StationInfo
from app.services.station_service import station_provider

router = APIRouter(prefix="/api/stations", tags=["Stations"])

_SAMPLE_DATA_NOTE = (
    "⚠️ SAMPLE STATION DATA: This data is fictional and for demonstration purposes only. "
    "It is NOT real-time or live charging station data."
)


@router.get("", summary="List all demo charging stations")
async def get_stations(
    charger_type: Optional[str] = Query(default=None, description="AC or DC"),
    connector_type: Optional[str] = Query(default=None),
    available_only: bool = Query(default=False),
) -> dict:
    filters = StationFilters(
        charger_type=charger_type,
        connector_type=connector_type,
        available_only=available_only,
    )
    stations = station_provider.get_all(filters)
    return {
        "stations": [s.model_dump() for s in stations],
        "count": len(stations),
        "data_note": _SAMPLE_DATA_NOTE,
    }


@router.post("/nearby", summary="Find demo stations near a location")
async def get_nearby_stations(req: NearbyStationsRequest) -> dict:
    stations = station_provider.get_nearby(
        lat=req.latitude,
        lng=req.longitude,
        radius_km=req.radius_km,
        filters=req.filters,
    )
    return {
        "stations": [s.model_dump() for s in stations],
        "count": len(stations),
        "search_radius_km": req.radius_km,
        "data_note": _SAMPLE_DATA_NOTE,
    }
