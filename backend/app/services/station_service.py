"""
Charging station data service.

Architecture: StationProvider interface with a DemoStationProvider implementation.
FUTURE EXTENSION: Implement OpenChargeMapProvider (or similar) that satisfies the
same StationProvider interface — route code requires zero changes.
"""
from __future__ import annotations

import math
from abc import ABC, abstractmethod
from typing import Optional

from app.models.schemas import StationFilters, StationInfo


# ---------------------------------------------------------------------------
# Interface (abstract base)
# ---------------------------------------------------------------------------

class StationProvider(ABC):
    """Abstract interface for charging station data providers."""

    @abstractmethod
    def get_all(self, filters: Optional[StationFilters] = None) -> list[StationInfo]:
        """Return all stations, optionally filtered."""
        ...

    @abstractmethod
    def get_nearby(
        self,
        lat: float,
        lng: float,
        radius_km: float,
        filters: Optional[StationFilters] = None,
    ) -> list[StationInfo]:
        """Return stations within radius_km of (lat, lng), optionally filtered."""
        ...

    @abstractmethod
    def get_by_id(self, station_id: str) -> Optional[StationInfo]:
        """Return a single station by ID, or None."""
        ...


# ---------------------------------------------------------------------------
# Haversine distance helper
# ---------------------------------------------------------------------------

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Approximate great-circle distance in km between two lat/lng points."""
    R = 6371.0  # Earth radius km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Demo station data
# NOTE: This data is fictional and for demonstration purposes only.
# It must NEVER be presented to users as live or real-time data.
# ---------------------------------------------------------------------------

_DEMO_STATIONS_RAW: list[dict] = [
    {
        "id": "DEMO-001",
        "name": "Chennai Central EV Hub (DEMO)",
        "city": "Chennai",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "charger_type": "DC",
        "connector_type": "CCS2",
        "power_kw": 60.0,
        "available": True,
        "price_per_kwh_inr": 12.0,
        "hours": "24/7",
        "address": "Near Chennai Central Station, Chennai - SAMPLE DATA",
    },
    {
        "id": "DEMO-002",
        "name": "Bengaluru Tech Park Charger (DEMO)",
        "city": "Bengaluru",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "charger_type": "DC",
        "connector_type": "CCS2",
        "power_kw": 100.0,
        "available": True,
        "price_per_kwh_inr": 14.0,
        "hours": "06:00–22:00",
        "address": "Outer Ring Road, Bengaluru - SAMPLE DATA",
    },
    {
        "id": "DEMO-003",
        "name": "Mumbai Highway Supercharger (DEMO)",
        "city": "Mumbai",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "charger_type": "DC",
        "connector_type": "CHAdeMO",
        "power_kw": 50.0,
        "available": False,
        "price_per_kwh_inr": 16.0,
        "hours": "24/7",
        "address": "Western Express Highway, Mumbai - SAMPLE DATA",
    },
    {
        "id": "DEMO-004",
        "name": "Delhi Metro EV Station (DEMO)",
        "city": "Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "charger_type": "AC",
        "connector_type": "Type 2",
        "power_kw": 22.0,
        "available": True,
        "price_per_kwh_inr": 10.0,
        "hours": "05:00–23:00",
        "address": "Near Connaught Place, Delhi - SAMPLE DATA",
    },
    {
        "id": "DEMO-005",
        "name": "Hyderabad Hi-Tech City Charger (DEMO)",
        "city": "Hyderabad",
        "latitude": 17.4435,
        "longitude": 78.3772,
        "charger_type": "DC",
        "connector_type": "CCS2",
        "power_kw": 150.0,
        "available": True,
        "price_per_kwh_inr": 15.0,
        "hours": "24/7",
        "address": "Hi-Tech City Main Road, Hyderabad - SAMPLE DATA",
    },
    {
        "id": "DEMO-006",
        "name": "Pune IT Park AC Charger (DEMO)",
        "city": "Pune",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "charger_type": "AC",
        "connector_type": "Type 2",
        "power_kw": 7.4,
        "available": True,
        "price_per_kwh_inr": 8.0,
        "hours": "08:00–20:00",
        "address": "Hinjewadi IT Park, Pune - SAMPLE DATA",
    },
    {
        "id": "DEMO-007",
        "name": "Kolkata New Town Fast Charger (DEMO)",
        "city": "Kolkata",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "charger_type": "DC",
        "connector_type": "CHAdeMO",
        "power_kw": 50.0,
        "available": False,
        "price_per_kwh_inr": 11.0,
        "hours": "24/7",
        "address": "New Town Action Area, Kolkata - SAMPLE DATA",
    },
    {
        "id": "DEMO-008",
        "name": "Ahmedabad SG Highway EV Point (DEMO)",
        "city": "Ahmedabad",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "charger_type": "DC",
        "connector_type": "CCS2",
        "power_kw": 60.0,
        "available": True,
        "price_per_kwh_inr": 13.0,
        "hours": "24/7",
        "address": "SG Highway, Ahmedabad - SAMPLE DATA",
    },
]


def _raw_to_station_info(raw: dict, distance_km: Optional[float] = None) -> StationInfo:
    return StationInfo(
        id=raw["id"],
        name=raw["name"],
        city=raw["city"],
        latitude=raw["latitude"],
        longitude=raw["longitude"],
        distance_km=round(distance_km, 2) if distance_km is not None else None,
        charger_type=raw["charger_type"],
        connector_type=raw["connector_type"],
        power_kw=raw["power_kw"],
        available=raw["available"],
        price_per_kwh_inr=raw.get("price_per_kwh_inr"),
        hours=raw["hours"],
        address=raw.get("address"),
    )


def _apply_filters(stations: list[StationInfo], filters: Optional[StationFilters]) -> list[StationInfo]:
    if not filters:
        return stations
    result = stations
    if filters.charger_type:
        result = [s for s in result if s.charger_type.upper() == filters.charger_type.upper()]
    if filters.connector_type:
        result = [s for s in result if s.connector_type.lower() == filters.connector_type.lower()]
    if filters.max_distance_km is not None and all(s.distance_km is not None for s in result):
        result = [s for s in result if s.distance_km is not None and s.distance_km <= filters.max_distance_km]
    if filters.available_only:
        result = [s for s in result if s.available]
    return result


# ---------------------------------------------------------------------------
# Demo provider implementation
# ---------------------------------------------------------------------------

class DemoStationProvider(StationProvider):
    """
    Returns fictional sample stations for demonstration.
    FUTURE EXTENSION: Replace with OpenChargeMapProvider or similar that
    implements the same StationProvider interface.
    """

    def get_all(self, filters: Optional[StationFilters] = None) -> list[StationInfo]:
        stations = [_raw_to_station_info(r) for r in _DEMO_STATIONS_RAW]
        return _apply_filters(stations, filters)

    def get_nearby(
        self,
        lat: float,
        lng: float,
        radius_km: float,
        filters: Optional[StationFilters] = None,
    ) -> list[StationInfo]:
        nearby = []
        for raw in _DEMO_STATIONS_RAW:
            dist = _haversine_km(lat, lng, raw["latitude"], raw["longitude"])
            if dist <= radius_km:
                nearby.append(_raw_to_station_info(raw, dist))
        nearby.sort(key=lambda s: s.distance_km or 0)
        return _apply_filters(nearby, filters)

    def get_by_id(self, station_id: str) -> Optional[StationInfo]:
        for raw in _DEMO_STATIONS_RAW:
            if raw["id"] == station_id:
                return _raw_to_station_info(raw)
        return None


# ---------------------------------------------------------------------------
# Singleton provider (swap implementation here if plugging in a real provider)
# ---------------------------------------------------------------------------

station_provider: StationProvider = DemoStationProvider()
