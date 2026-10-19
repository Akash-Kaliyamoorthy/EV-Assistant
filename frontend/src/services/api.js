/**
 * API service — all backend calls go through this module.
 * Base URL is read from VITE_API_BASE_URL (never hardcoded).
 * Development: http://localhost:8000
 * Production: your Render backend URL
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let errorDetail;
    try {
      errorDetail = await res.json();
    } catch {
      errorDetail = { message: `HTTP ${res.status}` };
    }
    throw {
      status: res.status,
      message:
        errorDetail?.detail?.message ||
        errorDetail?.message ||
        `Request failed with status ${res.status}`,
      detail: errorDetail,
    };
  }

  return res.json();
}

// ── Health ──────────────────────────────────────────────────────────────────

export const healthCheck = () => request('/health');

// ── Chat ─────────────────────────────────────────────────────────────────────

export const sendChatMessage = ({ message, conversation_history = [], vehicle_profile = null }) =>
  request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_history, vehicle_profile }),
  });

// ── Calculators ──────────────────────────────────────────────────────────────

export const calculateChargingTime = (data) =>
  request('/api/calculate/charging-time', { method: 'POST', body: JSON.stringify(data) });

export const calculateChargingCost = (data) =>
  request('/api/calculate/charging-cost', { method: 'POST', body: JSON.stringify(data) });

export const calculateRange = (data) =>
  request('/api/calculate/range', { method: 'POST', body: JSON.stringify(data) });

export const getRecommendation = (data) =>
  request('/api/recommend/charging', { method: 'POST', body: JSON.stringify(data) });

// ── Stations ─────────────────────────────────────────────────────────────────

export const getStations = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.charger_type) params.set('charger_type', filters.charger_type);
  if (filters.connector_type) params.set('connector_type', filters.connector_type);
  if (filters.available_only) params.set('available_only', 'true');
  const qs = params.toString();
  return request(`/api/stations${qs ? '?' + qs : ''}`);
};

export const getNearbyStations = (data) =>
  request('/api/stations/nearby', { method: 'POST', body: JSON.stringify(data) });

// ── Trip ──────────────────────────────────────────────────────────────────────

export const estimateTrip = (data) =>
  request('/api/trip/estimate', { method: 'POST', body: JSON.stringify(data) });
