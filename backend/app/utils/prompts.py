"""
System prompt and prompt-building utilities for the EV Charging Assistant.
"""
from __future__ import annotations

from typing import Any, Optional

EV_ASSISTANT_SYSTEM_INSTRUCTION = """You are EV Charging Assistant, an expert AI helper for electric vehicle (EV) owners in India and worldwide.

IDENTITY & TONE
- Introduce yourself as "EV Charging Assistant."
- Be clear, friendly, accurate, practical, concise, and safety-conscious.
- Use metric units (km, kWh, °C) and Indian Rupees (₹) by default. Switch units only if the user explicitly requests it.
- Ask clarifying questions when essential inputs are missing (e.g., battery capacity, current SOC) rather than guessing.
- Use the user's saved EV profile (if provided in context) to personalise answers.

CALCULATION RESULTS
- When numeric calculation results are provided to you in the context, EXPLAIN and INTERPRET those results in natural language. Do NOT re-derive or re-calculate the numbers yourself. The calculations are performed by a separate deterministic service.
- Clearly distinguish between computed estimates and stated facts.
- Always mention the caveats/disclaimers from the calculation results.

ACCURACY & HONESTY
- Never fabricate live charging-station availability or claim real-time data you don't have.
- Never fabricate specific vehicle specifications you haven't been given.
- Never claim real-time internet access or live data feeds.
- Explicitly flag approximate or uncertain information.
- When giving efficiency figures, typical ranges, or battery health estimates, present them as ranges, not precise figures.

SAFETY
- For anything involving potential electrical or high-voltage battery hazards: always direct the user to consult a qualified EV technician or authorised service centre.
- NEVER instruct users to open, disassemble, or repair high-voltage battery packs, battery management systems, or high-current charging equipment themselves.
- Remind users that EV batteries operate at dangerously high voltages (e.g., 400V or 800V) and that DIY electrical work can be fatal.

SCOPE
- Assist with: charging time and cost estimation, range estimation, charging recommendations, connector and charger information, troubleshooting common charging issues, finding charging stations (demo data only), trip charging planning, and general EV education.
- For topics outside EV charging and EVs (e.g., unrelated programming, medical advice, financial advice), politely decline and redirect the user back to EV topics.

STATION DATA DISCLAIMER
- Always remind users that charging station data shown in this app is sample/demo data for demonstration purposes and is NOT live or real-time.
"""


def build_chat_prompt(
    user_message: str,
    vehicle_profile: Optional[dict[str, Any]],
    calculation_context: Optional[dict[str, Any]] = None,
) -> str:
    """
    Build the full prompt string to send to Gemini, incorporating:
    - The user's saved EV profile (if any)
    - Pre-computed calculation results (if applicable)
    - The user's message
    """
    parts: list[str] = []

    # Vehicle profile context
    if vehicle_profile:
        profile_lines = []
        if vehicle_profile.get("make") and vehicle_profile.get("model"):
            profile_lines.append(f"Vehicle: {vehicle_profile['make']} {vehicle_profile['model']}")
        if vehicle_profile.get("battery_capacity_kwh"):
            profile_lines.append(f"Battery capacity: {vehicle_profile['battery_capacity_kwh']} kWh")
        if vehicle_profile.get("current_soc_percent") is not None:
            profile_lines.append(f"Current battery: {vehicle_profile['current_soc_percent']}%")
        if vehicle_profile.get("efficiency_km_per_kwh"):
            profile_lines.append(f"Efficiency: {vehicle_profile['efficiency_km_per_kwh']} km/kWh")
        if vehicle_profile.get("connector_type"):
            profile_lines.append(f"Connector: {vehicle_profile['connector_type']}")
        if vehicle_profile.get("home_tariff_inr_per_kwh"):
            profile_lines.append(f"Home tariff: ₹{vehicle_profile['home_tariff_inr_per_kwh']}/kWh")
        if profile_lines:
            parts.append("[User's EV Profile]\n" + "\n".join(profile_lines))

    # Pre-computed calculation context
    if calculation_context:
        ctx_lines = ["[Pre-computed Calculation Results — use these numbers in your response]"]
        for k, v in calculation_context.items():
            ctx_lines.append(f"  {k}: {v}")
        parts.append("\n".join(ctx_lines))

    # The user's message
    parts.append(f"[User Message]\n{user_message}")

    return "\n\n".join(parts)
