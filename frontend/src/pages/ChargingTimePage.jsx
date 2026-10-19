import { useState } from 'react';
import { Calculator, Clock, Zap } from 'lucide-react';
import { calculateChargingTime } from '../services/api.js';
import { fmtNumber, fmtTime } from '../utils/formatting.js';

export default function ChargingTimePage({ apiProfile }) {
  const [form, setForm] = useState({
    battery_capacity_kwh: apiProfile?.battery_capacity_kwh || '',
    current_soc_percent: apiProfile?.current_soc_percent || '',
    target_soc_percent: apiProfile?.target_soc_percent || 80,
    charger_power_kw: apiProfile?.preferred_charger_power_kw || '',
    efficiency_factor: 0.9,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        battery_capacity_kwh: parseFloat(form.battery_capacity_kwh),
        current_soc_percent: parseFloat(form.current_soc_percent),
        target_soc_percent: parseFloat(form.target_soc_percent),
        charger_power_kw: parseFloat(form.charger_power_kw),
        efficiency_factor: parseFloat(form.efficiency_factor),
      };
      const data = await calculateChargingTime(payload);
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Calculation failed. Check your inputs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Calculator size={22} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-accent)' }} />Charging Time Calculator</h1>
        <p>Estimate how long it will take to charge your EV from one SOC level to another.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Form */}
        <div className="card">
          <div className="card-title"><Calculator size={18} /> Enter Details</div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="ct-capacity">Battery Capacity (kWh) *</label>
                <input id="ct-capacity" type="number" className="form-input" required min="1" max="200" step="0.1"
                  placeholder="e.g. 40.5" value={form.battery_capacity_kwh}
                  onChange={e => set('battery_capacity_kwh', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ct-charger">Charger Power (kW) *</label>
                <input id="ct-charger" type="number" className="form-input" required min="0.1" max="500" step="0.1"
                  placeholder="e.g. 11 or 50" value={form.charger_power_kw}
                  onChange={e => set('charger_power_kw', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ct-current">Current Battery (%) *</label>
                <input id="ct-current" type="number" className="form-input" required min="0" max="100" step="1"
                  placeholder="e.g. 20" value={form.current_soc_percent}
                  onChange={e => set('current_soc_percent', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ct-target">Target Battery (%) *</label>
                <input id="ct-target" type="number" className="form-input" required min="1" max="100" step="1"
                  placeholder="e.g. 80" value={form.target_soc_percent}
                  onChange={e => set('target_soc_percent', e.target.value)} />
              </div>
              <div className="form-group full-width">
                <label className="form-label" htmlFor="ct-efficiency">
                  Charging Efficiency ({Math.round(parseFloat(form.efficiency_factor || 0.9) * 100)}%)
                </label>
                <input id="ct-efficiency" type="range" min="0.5" max="1.0" step="0.01"
                  value={form.efficiency_factor}
                  onChange={e => set('efficiency_factor', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--color-text-muted)' }}>
                  <span>50% (poor)</span><span>90% (typical)</span><span>100% (ideal)</span>
                </div>
              </div>
            </div>

            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}
              disabled={loading} id="btn-calc-time">
              {loading ? 'Calculating…' : <><Zap size={16} /> Calculate Charging Time</>}
            </button>
          </form>
        </div>

        {/* Result */}
        <div>
          {result ? (
            <div className="result-box">
              <div className="result-primary-label">Estimated Charging Time</div>
              <div className="result-primary">{fmtTime(result.estimated_time_hours)}</div>
              <div className="result-details">
                <div className="result-detail-item">
                  <div className="result-detail-label">Energy Required</div>
                  <div className="result-detail-value">{fmtNumber(result.energy_required_kwh)} kWh</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">SOC Gain</div>
                  <div className="result-detail-value">+{fmtNumber(result.soc_gain_percent, 1)}%</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">Exact Minutes</div>
                  <div className="result-detail-value">{fmtNumber(result.estimated_time_minutes, 1)} min</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">Efficiency</div>
                  <div className="result-detail-value">{Math.round(result.efficiency_factor * 100)}%</div>
                </div>
              </div>
              <div className="result-disclaimer">⚠️ {result.disclaimer}</div>
            </div>
          ) : (
            <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:260, gap:12, textAlign:'center' }}>
              <Clock size={40} color="var(--color-border-strong)" />
              <p style={{ color: 'var(--color-text-muted)', fontSize:'0.875rem' }}>
                Fill in the form and click <strong>Calculate</strong> to see your charging time estimate.
              </p>
              <div className="alert alert-info" style={{ textAlign:'left', fontSize:'0.78rem' }}>
                <span>💡</span>
                <span>All arithmetic is done by our deterministic backend service — Gemini only explains the results.</span>
              </div>
            </div>
          )}

          {/* Common charger reference */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title" style={{ fontSize:'0.85rem' }}>Common Charger Powers</div>
            {[
              ['Home AC (1-phase)', '3.3 – 7.4 kW'],
              ['Home AC (3-phase)', '11 – 22 kW'],
              ['Public DC Fast', '50 – 150 kW'],
              ['Ultra-Fast DC', '150 – 350 kW'],
            ].map(([name, power]) => (
              <div key={name} className="stat-row">
                <span className="stat-row-label">{name}</span>
                <span className="stat-row-value">{power}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
