"""
Unit tests for deterministic calculation services.
No Gemini API key or network access required.
"""
import pytest
from app.models.schemas import (
    ChargingTimeRequest,
    ChargingCostRequest,
    RangeRequest,
    RecommendationRequest,
    TripEstimateRequest,
)
from app.services.calculations import (
    calculate_charging_time,
    calculate_charging_cost,
    calculate_range,
    recommend_charging,
    estimate_trip,
)


# ---------------------------------------------------------------------------
# Charging time tests
# ---------------------------------------------------------------------------

class TestChargingTime:
    def test_basic_calculation(self):
        req = ChargingTimeRequest(
            battery_capacity_kwh=40.0,
            current_soc_percent=20.0,
            target_soc_percent=80.0,
            charger_power_kw=11.0,
            efficiency_factor=0.9,
        )
        result = calculate_charging_time(req)
        # energy = 40 * 0.6 = 24 kWh; time = 24 / (11 * 0.9) = 24 / 9.9 ≈ 2.424 hrs
        assert abs(result.energy_required_kwh - 24.0) < 0.01
        assert abs(result.estimated_time_hours - 24.0 / (11.0 * 0.9)) < 0.01
        assert result.soc_gain_percent == 60.0
        assert result.estimated_time_minutes > 0

    def test_soc_gain_correct(self):
        req = ChargingTimeRequest(
            battery_capacity_kwh=50.0,
            current_soc_percent=10.0,
            target_soc_percent=90.0,
            charger_power_kw=50.0,
        )
        result = calculate_charging_time(req)
        assert result.soc_gain_percent == 80.0

    def test_fast_charger_is_faster(self):
        base = dict(
            battery_capacity_kwh=30.0,
            current_soc_percent=20.0,
            target_soc_percent=80.0,
        )
        slow = calculate_charging_time(ChargingTimeRequest(**base, charger_power_kw=3.3))
        fast = calculate_charging_time(ChargingTimeRequest(**base, charger_power_kw=50.0))
        assert slow.estimated_time_hours > fast.estimated_time_hours

    def test_validation_target_must_exceed_current(self):
        with pytest.raises(Exception):
            ChargingTimeRequest(
                battery_capacity_kwh=40.0,
                current_soc_percent=80.0,
                target_soc_percent=20.0,
                charger_power_kw=11.0,
            )

    def test_validation_equal_soc_rejected(self):
        with pytest.raises(Exception):
            ChargingTimeRequest(
                battery_capacity_kwh=40.0,
                current_soc_percent=50.0,
                target_soc_percent=50.0,
                charger_power_kw=11.0,
            )

    def test_disclaimer_present(self):
        req = ChargingTimeRequest(
            battery_capacity_kwh=40.0,
            current_soc_percent=20.0,
            target_soc_percent=80.0,
            charger_power_kw=11.0,
        )
        result = calculate_charging_time(req)
        assert len(result.disclaimer) > 20


# ---------------------------------------------------------------------------
# Charging cost tests
# ---------------------------------------------------------------------------

class TestChargingCost:
    def test_basic_cost(self):
        req = ChargingCostRequest(
            battery_capacity_kwh=40.0,
            current_soc_percent=20.0,
            target_soc_percent=80.0,
            tariff_per_kwh=10.0,  # ₹10/kWh
        )
        result = calculate_charging_cost(req)
        # energy_required = 40 * 0.6 = 24 kWh
        # energy_delivered = 24 / 0.9 ≈ 26.667 kWh
        # cost = 26.667 * 10 ≈ 266.67
        assert abs(result.energy_required_kwh - 24.0) < 0.01
        assert result.total_cost > 0
        assert result.currency_symbol == "₹"

    def test_cost_per_100km_computed_when_efficiency_given(self):
        req = ChargingCostRequest(
            battery_capacity_kwh=40.0,
            current_soc_percent=20.0,
            target_soc_percent=80.0,
            tariff_per_kwh=10.0,
            efficiency_km_per_kwh=6.0,
        )
        result = calculate_charging_cost(req)
        assert result.cost_per_100_km is not None
        # cost per 100 km = (10 / 6) * 100 ≈ 166.67
        assert abs(result.cost_per_100_km - (10.0 / 6.0 * 100)) < 0.1

    def test_cost_per_100km_none_without_efficiency(self):
        req = ChargingCostRequest(
            battery_capacity_kwh=40.0,
            current_soc_percent=20.0,
            target_soc_percent=80.0,
            tariff_per_kwh=10.0,
        )
        result = calculate_charging_cost(req)
        assert result.cost_per_100_km is None

    def test_custom_currency_symbol(self):
        req = ChargingCostRequest(
            battery_capacity_kwh=40.0,
            current_soc_percent=20.0,
            target_soc_percent=80.0,
            tariff_per_kwh=0.30,
            currency_symbol="$",
        )
        result = calculate_charging_cost(req)
        assert result.currency_symbol == "$"


# ---------------------------------------------------------------------------
# Range estimation tests
# ---------------------------------------------------------------------------

class TestRangeEstimation:
    def test_basic_range(self):
        req = RangeRequest(
            battery_capacity_kwh=50.0,
            current_soc_percent=80.0,
            efficiency_km_per_kwh=6.0,
        )
        result = calculate_range(req)
        # remaining = 50 * 0.8 = 40 kWh; range = 40 * 6 = 240 km
        assert abs(result.remaining_energy_kwh - 40.0) < 0.01
        assert abs(result.estimated_range_km - 240.0) < 0.1

    def test_zero_soc_gives_zero_range(self):
        req = RangeRequest(
            battery_capacity_kwh=50.0,
            current_soc_percent=0.0,
            efficiency_km_per_kwh=6.0,
        )
        result = calculate_range(req)
        assert result.remaining_energy_kwh == 0.0
        assert result.estimated_range_km == 0.0

    def test_full_soc_gives_max_range(self):
        req = RangeRequest(
            battery_capacity_kwh=50.0,
            current_soc_percent=100.0,
            efficiency_km_per_kwh=6.0,
        )
        result = calculate_range(req)
        assert abs(result.estimated_range_km - 300.0) < 0.1

    def test_disclaimer_present(self):
        req = RangeRequest(
            battery_capacity_kwh=50.0,
            current_soc_percent=50.0,
            efficiency_km_per_kwh=6.0,
        )
        result = calculate_range(req)
        assert len(result.disclaimer) > 20


# ---------------------------------------------------------------------------
# Recommendation tests
# ---------------------------------------------------------------------------

class TestRecommendation:
    def test_low_soc_triggers_charge_now(self):
        req = RecommendationRequest(current_soc_percent=15.0, target_soc_percent=80.0)
        result = recommend_charging(req)
        assert result.tier == "charge_now"
        assert result.urgency_level == 3

    def test_mid_soc_optional(self):
        req = RecommendationRequest(current_soc_percent=55.0, target_soc_percent=80.0)
        result = recommend_charging(req)
        assert result.tier == "optional"
        assert result.urgency_level == 1

    def test_high_soc_not_necessary(self):
        req = RecommendationRequest(current_soc_percent=90.0, target_soc_percent=100.0)
        result = recommend_charging(req)
        assert result.tier == "not_necessary"

    def test_disclaimer_present(self):
        req = RecommendationRequest(current_soc_percent=50.0, target_soc_percent=80.0)
        result = recommend_charging(req)
        assert len(result.disclaimer) > 10


# ---------------------------------------------------------------------------
# Trip estimation tests
# ---------------------------------------------------------------------------

class TestTripEstimation:
    def test_with_explicit_distance(self):
        req = TripEstimateRequest(
            origin="Chennai",
            destination="Bengaluru",
            current_soc_percent=80.0,
            battery_capacity_kwh=40.0,
            efficiency_km_per_kwh=6.0,
            desired_arrival_soc_percent=20.0,
            trip_distance_km=350.0,
        )
        result = estimate_trip(req)
        assert result.estimated_distance_km == 350.0
        # energy required = 350 / 6 ≈ 58.33 kWh — exceeds 40 kWh battery
        assert result.energy_required_kwh > 0

    def test_heuristic_used_without_distance(self):
        req = TripEstimateRequest(
            origin="CityA",
            destination="CityB",
            current_soc_percent=80.0,
            battery_capacity_kwh=40.0,
            efficiency_km_per_kwh=6.0,
            desired_arrival_soc_percent=20.0,
        )
        result = estimate_trip(req)
        assert result.estimated_distance_km > 0
        assert "heuristic" in result.disclaimer.lower()

    def test_short_trip_no_charging_needed(self):
        req = TripEstimateRequest(
            origin="CityA",
            destination="CityB",
            current_soc_percent=90.0,
            battery_capacity_kwh=60.0,
            efficiency_km_per_kwh=6.0,
            desired_arrival_soc_percent=10.0,
            trip_distance_km=50.0,
        )
        result = estimate_trip(req)
        assert not result.charging_required
        assert result.recommended_charge_kwh == 0.0

    def test_long_trip_charging_needed(self):
        req = TripEstimateRequest(
            origin="Delhi",
            destination="Mumbai",
            current_soc_percent=50.0,
            battery_capacity_kwh=40.0,
            efficiency_km_per_kwh=5.0,
            desired_arrival_soc_percent=20.0,
            trip_distance_km=1400.0,
        )
        result = estimate_trip(req)
        assert result.charging_required
        assert result.recommended_charge_kwh > 0
        assert result.suggested_charging_stop is not None


# ---------------------------------------------------------------------------
# Validation edge-case tests
# ---------------------------------------------------------------------------

class TestValidation:
    def test_charging_time_negative_capacity_rejected(self):
        with pytest.raises(Exception):
            ChargingTimeRequest(
                battery_capacity_kwh=-10.0,
                current_soc_percent=20.0,
                target_soc_percent=80.0,
                charger_power_kw=11.0,
            )

    def test_charging_time_soc_over_100_rejected(self):
        with pytest.raises(Exception):
            ChargingTimeRequest(
                battery_capacity_kwh=40.0,
                current_soc_percent=20.0,
                target_soc_percent=110.0,
                charger_power_kw=11.0,
            )

    def test_range_efficiency_out_of_bounds_rejected(self):
        with pytest.raises(Exception):
            RangeRequest(
                battery_capacity_kwh=40.0,
                current_soc_percent=50.0,
                efficiency_km_per_kwh=0.1,  # Below 0.5 minimum
            )
