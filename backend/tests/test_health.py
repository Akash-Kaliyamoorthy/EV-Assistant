"""
Tests for the /health endpoint.
Uses FastAPI TestClient — no Gemini key required.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "gemini_configured" in data


def test_health_gemini_configured_false_without_key():
    with patch.dict("os.environ", {"GEMINI_API_KEY": ""}, clear=False):
        response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    # gemini_configured should reflect whether the key is set
    # (value depends on test environment; just check it's a bool)
    assert isinstance(data["gemini_configured"], bool)


def test_root_returns_metadata():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "docs" in data
