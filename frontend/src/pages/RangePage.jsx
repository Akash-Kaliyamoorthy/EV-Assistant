import { useState } from 'react';
import { BatteryCharging, Zap, Route } from 'lucide-react';
import { calculateRange } from '../services/api.js';
import { fmtNumber } from '../utils/formatting.js';

export default function RangePage({ apiProfile }) {
  const [form, setForm] = useState({
    battery_capacity_kwh: apiProfile?.battery_capacity_kwh || '',
    current_soc_percent: apiProfile?.current_soc_percent || '',
    efficiency_km_per_kwh: apiProfile?.efficiency_km_per_kwh || '',
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
      const data = await calculateRange({
        battery_capacity_kwh: parseFloat(form.battery_capacity_kwh),
        current_soc_percent: parseFloat(form.current_soc_percent),
        efficiency_km_per_kwh: parseFloat(form.efficiency_km_per_kwh),
      });
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Calculation failed.');
    } finally {
      setLoading(false);
    }
  }

  const soc = parseFloat(form.current_soc_percent) || 0;
  const socLevel = soc <= 20 ? 'low' : soc <= 50 ? 'medium' : 'high';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><BatteryCharging size={22} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-accent)' }} />Range Estimator</h1>
        <p>Estimate how far you can drive with your current battery charge.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-title"><BatteryCharging size={18} /> Enter Details</div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="rng-capacity">Battery Capacity (kWh) *</label>
                <input id="rng-capacity" type="number" className="form-input" required min="1" max="200" step="0.1"
                  placeholder="e.g. 40.5" value={form.battery_capacity_kwh}
                  onChange={e => set('battery_capacity_kwh', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="rng-efficiency">Efficiency (km/kWh) *</label>
                <input id="rng-efficiency" type="number" className="form-input" required min="0.5" max="20" step="0.1"
                  placeholder="e.g. 6.5" value={form.efficiency_km_per_kwh}
                  onChange={e => set('efficiency_km_per_kwh', e.target.value)} />
              </div>
              <div className="form-group full-width">
                <label className="form-label" htmlFor="rng-soc">
                  Current Battery Level — {Math.round(soc)}%
                </label>
                <input id="rng-soc" type="range" min="0" max="100" step="1"
                  value={form.current_soc_percent || 0}
                  onChange={e => set('current_soc_percent', e.target.value)}
                  style={{ width: '100%', accentColor: soc <= 20 ? 'var(--color-error)' : soc <= 50 ? 'var(--color-warning)' : 'var(--color-accent)' }} />
                <div className="battery-bar-wrapper" style={{ marginTop: 6 }}>
                  <div className={`battery-bar-fill ${socLevel}`} style={{ width: `${soc}%` }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--color-text-muted)', marginTop: 4 }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            </div>

            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}

            <button type="submit" id="btn-calc-range" className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}
              disabled={loading}>
              {loading ? 'Calculating…' : <><Zap size={16} /> Estimate Range</>}
            </button>
          </form>
        </div>

        <div>
          {result ? (
            <div className="result-box">
              <div className="result-primary-label">Estimated Range</div>
              <div className="result-primary">{fmtNumber(result.estimated_range_km, 1)} km</div>
              <div className="result-details">
                <div className="result-detail-item">
                  <div className="result-detail-label">Remaining Energy</div>
                  <div className="result-detail-value">{fmtNumber(result.remaining_energy_kwh)} kWh</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">Current SOC</div>
                  <div className="result-detail-value">{fmtNumber(result.current_soc_percent, 0)}%</div>
                </div>
              </div>
              <div className="result-disclaimer">⚠️ {result.disclaimer}</div>
            </div>
          ) : (
            <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:240, gap:12, textAlign:'center' }}>
              <Route size={40} color="var(--color-border-strong)" />
              <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem' }}>
                Move the SOC slider and click Estimate Range.
              </p>
            </div>
          )}

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title" style={{ fontSize:'0.85rem' }}>Typical EV Efficiency (India)</div>
            {[
              ['Tata Nexon EV (Standard)', '~6.5 km/kWh'],
              ['Tata Nexon EV (Max)', '~6.2 km/kWh'],
              ['MG ZS EV', '~6.0 km/kWh'],
              ['Hyundai Kona Electric', '~6.8 km/kWh'],
              ['Kia EV6 (GT)', '~5.5 km/kWh'],
            ].map(([name, eff]) => (
              <div key={name} className="stat-row">
                <span className="stat-row-label">{name}</span>
                <span className="stat-row-value">{eff}</span>
              </div>
            ))}
            <p style={{ fontSize:'0.72rem', color:'var(--color-text-muted)', marginTop:8 }}>
              Approximate figures. Check your vehicle manual for official specifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
