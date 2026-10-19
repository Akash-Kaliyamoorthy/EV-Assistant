import { Zap, BatteryMedium, Route, MapPin } from 'lucide-react';
import { fmtNumber } from '../utils/formatting';

/** Right-side panel showing EV snapshot from saved profile */
export default function RightPanel({ profile }) {
  const soc = parseFloat(profile?.current_soc_percent) || null;
  const capacity = parseFloat(profile?.battery_capacity_kwh) || null;
  const efficiency = parseFloat(profile?.efficiency_km_per_kwh) || null;
  const hasProfile = !!(profile?.make || capacity);

  const estimatedRange = soc != null && capacity != null && efficiency != null
    ? Math.round((capacity * soc / 100) * efficiency)
    : null;

  const socLevel = soc != null
    ? soc <= 20 ? 'low' : soc <= 50 ? 'medium' : 'high'
    : 'high';

  return (
    <aside className="right-panel" aria-label="EV status panel">
      {/* Vehicle header */}
      <div className="panel-card">
        <div className="panel-card-title">Your EV</div>
        {hasProfile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Zap size={20} color="#06b6d4" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                {profile.make || 'My EV'} {profile.model || ''}
              </div>
              {profile.connector_type && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {profile.connector_type} Connector
                </div>
              )}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            Set up your EV Profile for personalised estimates.
          </p>
        )}
      </div>

      {/* Battery status */}
      {soc != null && (
        <div className="panel-card">
          <div className="panel-card-title">Battery Status</div>
          <div className="battery-display">
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>State of Charge</div>
              <div className="battery-soc-text">{Math.round(soc)}%</div>
            </div>
            <div className="battery-bar-wrapper" role="progressbar" aria-valuenow={soc} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`battery-bar-fill ${socLevel}`}
                style={{ width: `${soc}%` }}
              />
            </div>
            {capacity && (
              <div className="battery-soc-sub">{fmtNumber(capacity * soc / 100)} / {capacity} kWh</div>
            )}
          </div>
        </div>
      )}

      {/* Quick stats */}
      {hasProfile && (
        <div className="panel-card">
          <div className="panel-card-title">Quick Stats</div>
          {estimatedRange != null && (
            <div className="stat-row">
              <span className="stat-row-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Route size={13} /> Est. Range
              </span>
              <span className="stat-row-value">{estimatedRange} km</span>
            </div>
          )}
          {capacity && (
            <div className="stat-row">
              <span className="stat-row-label">Battery</span>
              <span className="stat-row-value">{capacity} kWh</span>
            </div>
          )}
          {efficiency && (
            <div className="stat-row">
              <span className="stat-row-label">Efficiency</span>
              <span className="stat-row-value">{efficiency} km/kWh</span>
            </div>
          )}
          {profile?.home_tariff_inr_per_kwh && (
            <div className="stat-row">
              <span className="stat-row-label">Home Tariff</span>
              <span className="stat-row-value">₹{profile.home_tariff_inr_per_kwh}/kWh</span>
            </div>
          )}
          {profile?.preferred_charger_power_kw && (
            <div className="stat-row">
              <span className="stat-row-label">Charger Power</span>
              <span className="stat-row-value">{profile.preferred_charger_power_kw} kW</span>
            </div>
          )}
        </div>
      )}

      {/* Charging status hint */}
      {soc != null && soc <= 20 && (
        <div className="alert alert-error" style={{ borderRadius: 'var(--radius-lg)' }}>
          <span>🔴</span>
          <span>Battery low! Consider charging soon to avoid range anxiety.</span>
        </div>
      )}
      {soc != null && soc > 20 && soc <= 40 && (
        <div className="alert alert-warning" style={{ borderRadius: 'var(--radius-lg)' }}>
          <span>🟡</span>
          <span>Battery moderately low. Plan your next charge.</span>
        </div>
      )}
    </aside>
  );
}
