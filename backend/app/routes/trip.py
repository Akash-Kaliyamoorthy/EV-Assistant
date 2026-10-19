"""
Trip planning route.
"""
from fastapi import APIRouter
from app.models.schemas import TripEstimateRequest, TripEstimateResponse
from app.services.calculations import estimate_trip

router = APIRouter(prefix="/api/trip", tags=["Trip Planning"])


@router.post(
    "/estimate",
    response_model=TripEstimateResponse,
    summary="Estimate charging needs for a road trip",
)
async def trip_estimate(req: TripEstimateRequest) -> TripEstimateResponse:
    """
    Estimates charging requirements for a road trip.

    NOTE: Distance is user-supplied or estimated via a rough heuristic.
    This does NOT use a live routing API. See service code for the
    future-extension seam to plug in Google Maps, OSRM, etc.
    """
    return estimate_trip(req)
