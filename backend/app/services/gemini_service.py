"""
Gemini API service — wraps the google-genai SDK.

Uses the current google-genai SDK (not the deprecated google-generativeai package).
Client initialization reads GEMINI_API_KEY from environment automatically.
"""
from __future__ import annotations

import logging
import os
from typing import Any, Optional

from google import genai
from google.genai import types

from app.utils.prompts import EV_ASSISTANT_SYSTEM_INSTRUCTION, build_chat_prompt

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini client — initialized once at import time (lazy-safe via property)
# ---------------------------------------------------------------------------

_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY environment variable is not set. "
                "Set it in your .env file or Render environment variables."
            )
        _client = genai.Client(api_key=api_key)
    return _client


def _get_model() -> str:
    return os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")


# ---------------------------------------------------------------------------
# Chat — non-streaming, supports conversation history
# ---------------------------------------------------------------------------

async def chat_with_gemini(
    user_message: str,
    conversation_history: list[dict[str, str]],
    vehicle_profile: Optional[dict[str, Any]] = None,
    calculation_context: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Send a message to Gemini with conversation history and return the reply.

    Args:
        user_message: The user's current message text.
        conversation_history: List of {"role": "user"|"model", "content": "..."} dicts.
        vehicle_profile: Optional saved EV profile dict to include as context.
        calculation_context: Optional pre-computed numeric results to include in the prompt.

    Returns:
        dict with keys: reply (str), model_used (str)
    """
    client = _get_client()
    model = _get_model()

    # Build conversation history for the SDK
    history: list[types.Content] = []
    for turn in conversation_history:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role in ("user", "model") and content:
            history.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=content)],
                )
            )

    # Build the enriched user prompt (includes profile + calculation context)
    enriched_message = build_chat_prompt(user_message, vehicle_profile, calculation_context)

    try:
        chat = client.chats.create(
            model=model,
            history=history,
            config=types.GenerateContentConfig(
                system_instruction=EV_ASSISTANT_SYSTEM_INSTRUCTION,
                temperature=0.7,
                max_output_tokens=2048,
            ),
        )

        response = chat.send_message(enriched_message)
        reply_text = response.text or ""

        return {
            "reply": reply_text,
            "model_used": model,
        }

    except Exception as exc:
        # Log error detail server-side, return generic message to client
        logger.error("Gemini API error: %s", exc, exc_info=True)
        raise RuntimeError(
            "The AI assistant is temporarily unavailable. Please try again in a moment."
        ) from exc


def is_gemini_configured() -> bool:
    """Return True if the GEMINI_API_KEY environment variable is set (non-empty)."""
    return bool(os.environ.get("GEMINI_API_KEY", "").strip())
