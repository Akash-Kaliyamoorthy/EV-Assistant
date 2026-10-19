import { useState } from 'react';
import { Route, Zap, Info, AlertTriangle } from 'lucide-react';
import { estimateTrip } from '../services/api.js';
import { fmtNumber } from '../utils/formatting.js';

export default function TripPage({ apiProfile }) {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    current_soc_percent: apiProfile?.current_soc_percent || '',
    battery_capacity_kwh: apiProfile?.battery_capacity_kwh || '',
    efficiency_km_per_kwh: apiProfile?.efficiency_km_per_kwh || '',
    desired_arrival_soc_percent: 20,
    trip_distance_km: '',
    charger_power_kw: apiProfile?.preferred_charger_power_kw || 50,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setResult(null); setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const payload = {
        origin: form.origin,
        destination: form.destination,
        current_soc_percent: parseFloat(form.current_soc_percent),
        battery_capacity_kwh: parseFloat(form.battery_capacity_kwh),
        efficiency_km_per_kwh: parseFloat(form.efficiency_km_per_kwh),
        desired_arrival_soc_percent: parseFloat(form.desired_arrival_soc_percent),
        charger_power_kw: parseFloat(form.charger_power_kw) || 50,
      };
      if (form.trip_distance_km) payload.trip_distance_km = parseFloat(form.trip_distance_km);
      const data = await estimateTrip(payload);
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Trip estimation failed. Check your inputs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Route size={22} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-accent)' }} />Trip Charging Planner</h1>
        <p>Estimate whether you need to charge on your journey and how much.</p>
      </div>

      <div className="alert alert-info">
        <Info size={15} style={{ flexShrink: 0 }} />
        <span>This planner uses user-supplied distances (or a rough heuristic). It is an estimate, not a live navigation route. Use ABRP or Google Maps EV routing for real turn-by-turn guidance.</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        <div className="card">
          <div className="card-title"><Route size={18} /> Trip Details</div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="trip-origin">Starting Location *</label>
                <input id="trip-origin" type="text" className="form-input" required
                  placeholder="e.g. Chennai" value={form.origin}
                  onChange={e => set('origin', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-dest">Destination *</label>
                <input id="trip-dest" type="text" className="form-input" required
                  placeholder="e.g. Bengaluru" value={form.destination}
                  onChange={e => set('destination', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-dist">Trip Distance (km) — optional</label>
                <input id="trip-dist" type="number" className="form-input" min="1"
                  placeholder="Leave blank to use estimate" value={form.trip_distance_km}
                  onChange={e => set('trip_distance_km', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-capacity">Battery Capacity (kWh) *</label>
                <input id="trip-capacity" type="number" className="form-input" required min="1" max="200" step="0.1"
                  placeholder="e.g. 40.5" value={form.battery_capacity_kwh}
                  onChange={e => set('battery_capacity_kwh', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-soc">Current Battery (%) *</label>
                <input id="trip-soc" type="number" className="form-input" required min="0" max="100"
                  placeholder="e.g. 75" value={form.current_soc_percent}
                  onChange={e => set('current_soc_percent', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-efficiency">Efficiency (km/kWh) *</label>
                <input id="trip-efficiency" type="number" className="form-input" required min="0.5" max="20" step="0.1"
                  placeholder="e.g. 6.5" value={form.efficiency_km_per_kwh}
                  onChange={e => set('efficiency_km_per_kwh', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-arrival-soc">
                  Desired Arrival SOC — {Math.round(form.desired_arrival_soc_percent)}%
                </label>
                <input id="trip-arrival-soc" type="range" min="5" max="80" step="5"
                  value={form.desired_arrival_soc_percent}
                  onChange={e => set('desired_arrival_soc_percent', e.target.value)}
                  style={{ width:'100%', accentColor:'var(--color-accent)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-charger">Charger Power (kW)</label>
                <input id="trip-charger" type="number" className="form-input" min="1" max="500"
                  placeholder="e.g. 50" value={form.charger_power_kw}
                  onChange={e => set('charger_power_kw', e.target.value)} />
              </div>
            </div>

            {error && <div className="error-box" style={{ marginTop:12 }}>{error}</div>}
            <button type="submit" id="btn-trip-estimate" className="btn btn-primary" style={{ marginTop:16, width:'100%' }}
              disabled={loading}>
              {loading ? 'Estimating…' : <><Zap size={16} /> Estimate Trip</>}
            </button>
          </form>
        </div>

        <div>
          {result ? (
            <div className="result-box">
              <div style={{ fontWeight:800, fontSize:'1.1rem', color:'var(--color-primary)', marginBottom:12 }}>
                {result.origin} → {result.destination}
              </div>

              <div className={`alert ${result.charging_required ? 'alert-warning' : 'alert-success'}`} style={{ marginBottom:14 }}>
                <span>{result.charging_required ? '⚡ Charging Required' : '✅ No Charging Needed'}</span>
              </div>

              <div className="result-details">
                <div className="result-detail-item">
                  <div className="result-detail-label">Estimated Distance</div>
                  <div className="result-detail-value">{fmtNumber(result.estimated_distance_km, 1)} km</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">Energy Required</div>
                  <div className="result-detail-value">{fmtNumber(result.energy_required_kwh)} kWh</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">Starting SOC</div>
                  <div className="result-detail-value">{result.starting_soc_percent}%</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">Projected Arrival SOC</div>
                  <div className="result-detail-value">{fmtNumber(result.projected_arrival_soc_percent, 1)}%</div>
                </div>
                {result.charging_required && <>
                  <div className="result-detail-item">
                    <div className="result-detail-label">Recommended Charge</div>
                    <div className="result-detail-value">{fmtNumber(result.recommended_charge_kwh)} kWh</div>
                  </div>
                  {result.estimated_charging_duration_minutes && (
                    <div className="result-detail-item">
                      <div className="result-detail-label">Charging Duration</div>
                      <div className="result-detail-value">{fmtNumber(result.estimated_charging_duration_minutes, 0)} min</div>
                    </div>
                  )}
                </>}
              </div>

              {result.suggested_charging_stop && (
                <div className="alert alert-info" style={{ marginTop:12 }}>
                  <Route size={14} />
                  <span><strong>Suggested stop:</strong> {result.suggested_charging_stop}</span>
                </div>
              )}

              <div className="result-disclaimer">⚠️ {result.disclaimer}</div>
            </div>
          ) : (
            <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:320, gap:12, textAlign:'center' }}>
              <Route size={44} color="var(--color-border-strong)" />
              <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem' }}>
                Enter your trip details to see charging requirements and stop suggestions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
