import { useState } from 'react';
import { DollarSign, Zap, IndianRupee } from 'lucide-react';
import { calculateChargingCost } from '../services/api.js';
import { fmtNumber } from '../utils/formatting.js';

export default function CostPage({ apiProfile }) {
  const [form, setForm] = useState({
    battery_capacity_kwh: apiProfile?.battery_capacity_kwh || '',
    current_soc_percent: apiProfile?.current_soc_percent || '',
    target_soc_percent: apiProfile?.target_soc_percent || 80,
    tariff_per_kwh: apiProfile?.home_tariff_inr_per_kwh || '',
    efficiency_factor: 0.9,
    efficiency_km_per_kwh: apiProfile?.efficiency_km_per_kwh || '',
    currency_symbol: '₹',
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
        battery_capacity_kwh: parseFloat(form.battery_capacity_kwh),
        current_soc_percent: parseFloat(form.current_soc_percent),
        target_soc_percent: parseFloat(form.target_soc_percent),
        tariff_per_kwh: parseFloat(form.tariff_per_kwh),
        efficiency_factor: parseFloat(form.efficiency_factor),
        efficiency_km_per_kwh: form.efficiency_km_per_kwh ? parseFloat(form.efficiency_km_per_kwh) : undefined,
        currency_symbol: form.currency_symbol,
      };
      const data = await calculateChargingCost(payload);
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
        <h1><DollarSign size={22} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-accent)' }} />Charging Cost Calculator</h1>
        <p>Estimate how much it will cost to charge your EV based on your electricity tariff.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-title"><DollarSign size={18} /> Enter Details</div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="cc-capacity">Battery Capacity (kWh) *</label>
                <input id="cc-capacity" type="number" className="form-input" required min="1" max="200" step="0.1"
                  placeholder="e.g. 40.5" value={form.battery_capacity_kwh}
                  onChange={e => set('battery_capacity_kwh', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cc-tariff">Electricity Tariff (per kWh) *</label>
                <input id="cc-tariff" type="number" className="form-input" required min="0.01" step="0.01"
                  placeholder="e.g. 8.5 (₹/kWh)" value={form.tariff_per_kwh}
                  onChange={e => set('tariff_per_kwh', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cc-current">Current Battery (%) *</label>
                <input id="cc-current" type="number" className="form-input" required min="0" max="100"
                  placeholder="e.g. 20" value={form.current_soc_percent}
                  onChange={e => set('current_soc_percent', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cc-target">Target Battery (%) *</label>
                <input id="cc-target" type="number" className="form-input" required min="1" max="100"
                  placeholder="e.g. 80" value={form.target_soc_percent}
                  onChange={e => set('target_soc_percent', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cc-efficiency-km">Efficiency (km/kWh, optional)</label>
                <input id="cc-efficiency-km" type="number" className="form-input" min="0.5" max="20" step="0.1"
                  placeholder="e.g. 6.5" value={form.efficiency_km_per_kwh}
                  onChange={e => set('efficiency_km_per_kwh', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cc-currency">Currency Symbol</label>
                <select id="cc-currency" className="form-select" value={form.currency_symbol}
                  onChange={e => set('currency_symbol', e.target.value)}>
                  <option value="₹">₹ Indian Rupee</option>
                  <option value="$">$ US Dollar</option>
                  <option value="€">€ Euro</option>
                  <option value="£">£ British Pound</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label className="form-label" htmlFor="cc-eff">
                  Charging Efficiency ({Math.round(parseFloat(form.efficiency_factor || 0.9) * 100)}%)
                </label>
                <input id="cc-eff" type="range" min="0.5" max="1.0" step="0.01"
                  value={form.efficiency_factor}
                  onChange={e => set('efficiency_factor', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              </div>
            </div>

            {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}

            <button type="submit" id="btn-calc-cost" className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}
              disabled={loading}>
              {loading ? 'Calculating…' : <><Zap size={16} /> Calculate Cost</>}
            </button>
          </form>
        </div>

        <div>
          {result ? (
            <div className="result-box">
              <div className="result-primary-label">Total Charging Cost</div>
              <div className="result-primary">{result.currency_symbol}{fmtNumber(result.total_cost)}</div>
              <div className="result-details">
                <div className="result-detail-item">
                  <div className="result-detail-label">Energy Required</div>
                  <div className="result-detail-value">{fmtNumber(result.energy_required_kwh)} kWh</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">Energy Delivered (inc. losses)</div>
                  <div className="result-detail-value">{fmtNumber(result.energy_delivered_kwh)} kWh</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">Per 10% SOC</div>
                  <div className="result-detail-value">{result.currency_symbol}{fmtNumber(result.cost_per_10_percent_soc)}</div>
                </div>
                <div className="result-detail-item">
                  <div className="result-detail-label">SOC Gain</div>
                  <div className="result-detail-value">+{fmtNumber(result.soc_gain_percent, 1)}%</div>
                </div>
                {result.cost_per_100_km && (
                  <div className="result-detail-item" style={{ gridColumn: '1/-1' }}>
                    <div className="result-detail-label">Cost per 100 km</div>
                    <div className="result-detail-value">{result.currency_symbol}{fmtNumber(result.cost_per_100_km)}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:260, gap:12, textAlign:'center' }}>
              <IndianRupee size={40} color="var(--color-border-strong)" />
              <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem' }}>
                Enter your battery details and tariff to estimate charging cost.
              </p>
            </div>
          )}

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title" style={{ fontSize:'0.85rem' }}>Typical Indian Tariffs (₹/kWh)</div>
            {[
              ['Home (domestic)', '₹5 – ₹10'],
              ['Public AC Charger', '₹8 – ₹15'],
              ['Public DC Fast Charger', '₹12 – ₹20'],
              ['Commercial Rate', '₹8 – ₹14'],
            ].map(([type, rate]) => (
              <div key={type} className="stat-row">
                <span className="stat-row-label">{type}</span>
                <span className="stat-row-value">{rate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
