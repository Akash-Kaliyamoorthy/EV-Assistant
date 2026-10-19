import { useState } from 'react';
import { User, Save, RotateCcw, CheckCircle } from 'lucide-react';

const CONNECTOR_TYPES = ['CCS2', 'CHAdeMO', 'Type 2 (AC)', 'GB/T', 'Tesla (NACS)'];

export default function ProfilePage({ profile, onSave, onReset }) {
  const [form, setForm] = useState({ ...profile });
  const [saved, setSaved] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function handleSave(e) {
    e.preventDefault();
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    if (window.confirm('Clear all EV profile data?')) {
      onReset();
      setForm({});
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><User size={22} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-accent)' }} />EV Profile</h1>
        <p>Save your vehicle details for personalised calculations and AI answers. Stored locally on your device only.</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-title"><User size={18} /> Vehicle Information</div>
        <form onSubmit={handleSave} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="p-make">Vehicle Make</label>
              <input id="p-make" type="text" className="form-input" placeholder="e.g. Tata, MG, Hyundai"
                value={form.make || ''} onChange={e => set('make', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-model">Vehicle Model</label>
              <input id="p-model" type="text" className="form-input" placeholder="e.g. Nexon EV, ZS EV"
                value={form.model || ''} onChange={e => set('model', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-capacity">Battery Capacity (kWh)</label>
              <input id="p-capacity" type="number" className="form-input" min="1" max="200" step="0.1"
                placeholder="e.g. 40.5" value={form.battery_capacity_kwh || ''}
                onChange={e => set('battery_capacity_kwh', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-efficiency">Efficiency (km/kWh)</label>
              <input id="p-efficiency" type="number" className="form-input" min="0.5" max="20" step="0.1"
                placeholder="e.g. 6.5" value={form.efficiency_km_per_kwh || ''}
                onChange={e => set('efficiency_km_per_kwh', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-soc">Current Battery (%)</label>
              <input id="p-soc" type="number" className="form-input" min="0" max="100"
                placeholder="e.g. 75" value={form.current_soc_percent || ''}
                onChange={e => set('current_soc_percent', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-target">Default Target Battery (%)</label>
              <input id="p-target" type="number" className="form-input" min="1" max="100"
                placeholder="e.g. 80" value={form.target_soc_percent || ''}
                onChange={e => set('target_soc_percent', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-connector">Connector Type</label>
              <select id="p-connector" className="form-select"
                value={form.connector_type || ''} onChange={e => set('connector_type', e.target.value)}>
                <option value="">Select connector…</option>
                {CONNECTOR_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-tariff">Home Tariff (₹/kWh)</label>
              <input id="p-tariff" type="number" className="form-input" min="0" step="0.01"
                placeholder="e.g. 8.5" value={form.home_tariff_inr_per_kwh || ''}
                onChange={e => set('home_tariff_inr_per_kwh', e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label className="form-label" htmlFor="p-charger-power">Preferred Charger Power (kW)</label>
              <input id="p-charger-power" type="number" className="form-input" min="0" max="500" step="0.1"
                placeholder="e.g. 11 (home AC) or 50 (DC fast)" value={form.preferred_charger_power_kw || ''}
                onChange={e => set('preferred_charger_power_kw', e.target.value)} />
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button type="submit" id="btn-save-profile" className="btn btn-primary">
              {saved
                ? <><CheckCircle size={16} /> Saved!</>
                : <><Save size={16} /> Save Profile</>
              }
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={handleReset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {saved && (
            <div className="alert alert-success" style={{ marginTop:12 }}>
              <CheckCircle size={14} />
              <span>Profile saved to your browser's local storage. It will be used automatically in calculators and AI chat.</span>
            </div>
          )}
        </form>
      </div>

      <div className="card" style={{ maxWidth:640 }}>
        <div className="card-title" style={{ fontSize:'0.85rem' }}>Privacy Note</div>
        <p style={{ fontSize:'0.82rem', color:'var(--color-text-secondary)', lineHeight:1.6 }}>
          Your EV profile is stored only in your browser's <strong>localStorage</strong>.
          It is never sent to our servers unless you actively use a calculator or chat feature.
          No account or sign-in is required.
        </p>
      </div>
    </div>
  );
}
