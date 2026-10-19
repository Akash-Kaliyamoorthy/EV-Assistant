"""
Tests for the chat endpoint.
Gemini API is mocked — no real API key or network required.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app

client = TestClient(app)

MOCK_REPLY = "This is a mocked AI response about EV charging."


@pytest.fixture
def mock_gemini():
    """Patch the Gemini service so no real API call is made."""
    with patch("app.routes.chat.gemini_service.is_gemini_configured", return_value=True), \
         patch(
             "app.routes.chat.gemini_service.chat_with_gemini",
             new_callable=AsyncMock,
             return_value={"reply": MOCK_REPLY, "model_used": "gemini-mock"},
         ):
        yield


def test_chat_returns_reply(mock_gemini):
    response = client.post(
        "/api/chat",
        json={"message": "How long will it take to charge?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == MOCK_REPLY


def test_chat_empty_message_rejected():
    response = client.post(
        "/api/chat",
        json={"message": ""},
    )
    assert response.status_code == 422  # Pydantic validation error


def test_chat_whitespace_only_rejected():
    response = client.post(
        "/api/chat",
        json={"message": "   "},
    )
    assert response.status_code == 422


def test_chat_without_gemini_key_returns_503():
    with patch("app.routes.chat.gemini_service.is_gemini_configured", return_value=False):
        response = client.post(
            "/api/chat",
            json={"message": "Hello"},
        )
    assert response.status_code == 503


def test_chat_with_vehicle_profile(mock_gemini):
    response = client.post(
        "/api/chat",
        json={
            "message": "What is my estimated range?",
            "vehicle_profile": {
                "make": "Tata",
                "model": "Nexon EV",
                "battery_capacity_kwh": 30.2,
                "current_soc_percent": 60.0,
                "efficiency_km_per_kwh": 6.5,
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data


def test_chat_with_history(mock_gemini):
    response = client.post(
        "/api/chat",
        json={
            "message": "Tell me more",
            "conversation_history": [
                {"role": "user", "content": "How do I charge faster?"},
                {"role": "model", "content": "Use a DC fast charger."},
            ],
        },
    )
    assert response.status_code == 200
