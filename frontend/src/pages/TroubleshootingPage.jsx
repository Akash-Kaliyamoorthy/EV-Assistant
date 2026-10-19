import { useState } from 'react';
import { Wrench, ChevronLeft, AlertTriangle, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';

const ISSUES = [
  {
    id: 'not-charging',
    title: 'Not Charging At All',
    desc: 'EV plugged in but shows no charging activity',
    icon: '🔌',
    causes: [
      'Faulty or incompatible charging cable/connector',
      'Tripped circuit breaker or blown fuse at the power source',
      'Charge port door not fully open or debris in port',
      'Vehicle software/BMS has paused charging (scheduled charging or battery protection mode)',
      'Charger station offline or communication error',
    ],
    checks: [
      'Try a different charging cable or station',
      'Check the circuit breaker panel and reset any tripped breakers',
      'Inspect the charge port for visible debris or moisture (do not insert anything metallic)',
      'Check the vehicle app or instrument cluster for error codes or scheduled charging settings',
      'Restart the vehicle and try plugging in again',
    ],
    do_not: [
      'Do NOT attempt to open or service the charge port electronics yourself',
      'Do NOT use a damaged cable with exposed wires',
      'Do NOT force the connector if it does not click in naturally',
    ],
    professional: 'If the issue persists across multiple chargers and cables, take your vehicle to an authorised service centre. This may indicate a charge port or BMS fault.',
  },
  {
    id: 'slow-charging',
    title: 'Charging Very Slowly',
    desc: 'Charging is working but much slower than expected',
    icon: '🐢',
    causes: [
      'Ambient temperature (very hot or cold weather reduces charging rate)',
      'Battery is near 80–100% SOC (intentional taper by BMS)',
      'Charger station is throttling due to grid load or shared capacity',
      'Vehicle BMS limiting charge rate due to battery temperature',
      'Incorrect charging mode (AC instead of DC)',
    ],
    checks: [
      'Pre-condition the battery using the vehicle app in cold weather',
      'Check if the charger is shared with other vehicles',
      'Verify you are using the correct connector type for maximum speed',
      'Check the current charging rate shown on the vehicle dashboard',
      'Allow the battery to cool down if it is very warm from recent fast driving',
    ],
    do_not: [
      'Do NOT attempt to bypass the BMS charging limits',
      'Do NOT open the battery or power electronics',
    ],
    professional: 'If charging is consistently much slower than the rated speed even with a compatible charger and moderate SOC, have the charge port and BMS inspected by a technician.',
  },
  {
    id: 'stopped-mid',
    title: 'Charging Stopped Midway',
    desc: 'Charging started but stopped before reaching target',
    icon: '⏹️',
    causes: [
      'Reached a configured charge limit (e.g. scheduled to stop at 80%)',
      'Power outage or charger session timeout',
      'Battery overheated and BMS paused charging as a safety measure',
      'Poor connector contact causing intermittent connection',
      'Charger network error or payment failure',
    ],
    checks: [
      'Check the charge limit settings in the vehicle app',
      'Verify the charger station is still powered and not showing an error',
      'Look for any heat-related warnings on the vehicle dashboard',
      'Re-seat the connector firmly',
      'Check the charging network app for session status',
    ],
    do_not: [
      'Do NOT repeatedly plug/unplug rapidly — this can stress the charge port',
      'Do NOT dismiss thermal warnings from the vehicle',
    ],
    professional: 'Frequent unexpected stops suggest a possible connector issue or BMS fault. Contact your service centre.',
  },
  {
    id: 'connector-issue',
    title: 'Connector Not Detected',
    desc: 'Plugging in produces no response or lock click',
    icon: '🔗',
    causes: [
      'Incompatible connector type (e.g. CCS2 vs CHAdeMO vs Type 2)',
      'Debris or corrosion in the charge port',
      'Damaged connector pins on the cable or vehicle port',
      'Vehicle is not in "ready to charge" state (door open, not in Park)',
    ],
    checks: [
      "Confirm the connector type matches your vehicle's charge port",
      'Inspect the port visually under good light for debris or bent pins',
      'Ensure the vehicle is in Park with all doors closed (some vehicles require this)',
      'Try a different cable of the same type',
    ],
    do_not: [
      'Do NOT use metal objects to clear debris from the charge port',
      'Do NOT force a mismatched connector',
    ],
    professional: 'Bent or corroded pins inside the charge port require professional inspection. Do not attempt to straighten pins yourself.',
  },
  {
    id: 'ac-dc',
    title: 'AC vs DC Confusion',
    desc: 'Understanding why fast charging does not work',
    icon: '⚡',
    causes: [
      'AC chargers are converted to DC inside the vehicle (onboard charger limits the speed)',
      'DC fast chargers bypass the onboard charger and charge the battery directly at higher rates',
      'Vehicle may have a lower onboard charger capacity limiting AC speed',
      'DC charging may not be supported by the vehicle or may require a specific connector',
    ],
    checks: [
      'Check your vehicle spec sheet for maximum AC and DC charging rates',
      'Verify the charger power rating matches what you expect',
      'For DC fast charging, confirm your vehicle supports the specific protocol (CCS2, CHAdeMO)',
    ],
    do_not: [
      'Do NOT modify any charging hardware or adapters to force higher power input',
    ],
    professional: 'If your vehicle is not accepting DC fast charging despite having the correct connector, have the DC charging system inspected.',
  },
  {
    id: 'interrupted',
    title: 'Charging Frequently Interrupted',
    desc: 'Connection drops repeatedly during charging',
    icon: '⚠️',
    causes: [
      'Loose charge port or cable connector causing intermittent contact',
      'Vehicle or charger overheating and throttling/stopping',
      'Unstable power supply at the charging location',
      'Charge port locking mechanism failure',
    ],
    checks: [
      'Try a different cable and different charging station',
      'Check for loose fit when the connector is inserted',
      'Ensure the charging environment is not excessively hot',
      'Monitor the vehicle app for temperature or error alerts',
    ],
    do_not: [
      'Do NOT charge outdoors during heavy rain if the charge port area is damaged',
      'Do NOT ignore repeated thermal warnings',
    ],
    professional: 'Intermittent connection issues that persist across multiple chargers strongly suggest a charge port hardware fault. Do not delay servicing this.',
  },
];

export default function TroubleshootingPage() {
  const [selected, setSelected] = useState(null);

  const issue = ISSUES.find(i => i.id === selected);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Wrench size={22} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-accent)' }} />Charging Troubleshooting</h1>
        <p>Guided help for common EV charging problems. Select an issue to get started.</p>
      </div>

      <div className="alert alert-error">
        <ShieldAlert size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Safety First:</strong> EV batteries operate at 400V–800V. Never open the battery pack, power electronics, or high-voltage components yourself. Always consult an authorised EV technician for hardware faults.
        </span>
      </div>

      {!issue ? (
        <div className="trouble-grid">
          {ISSUES.map(item => (
            <button
              key={item.id}
              id={`trouble-${item.id}`}
              className="trouble-card"
              onClick={() => setSelected(item.id)}
              aria-label={`Troubleshoot: ${item.title}`}
            >
              <div className="trouble-card-icon" style={{ fontSize:'1.6rem' }}>{item.icon}</div>
              <div className="trouble-card-title">{item.title}</div>
              <div className="trouble-card-desc">{item.desc}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="trouble-detail">
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginBottom:16 }}>
            <ChevronLeft size={14} /> Back to issues
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <span style={{ fontSize:'2rem' }}>{issue.icon}</span>
            <div className="trouble-detail-title">{issue.title}</div>
          </div>

          <div className="trouble-section">
            <div className="trouble-section-label">Likely Causes</div>
            <div className="trouble-list">
              {issue.causes.map((c, i) => <div key={i} className="trouble-list-item">{c}</div>)}
            </div>
          </div>

          <div className="trouble-section">
            <div className="trouble-section-label" style={{ color:'var(--color-success)' }}>
              <CheckCircle size={13} style={{ display:'inline', marginRight:4 }} />
              Safe checks you can do
            </div>
            <div className="trouble-list">
              {issue.checks.map((c, i) => <div key={i} className="trouble-list-item">{c}</div>)}
            </div>
          </div>

          <div className="trouble-section">
            <div className="trouble-section-label" style={{ color:'var(--color-warning)' }}>
              <XCircle size={13} style={{ display:'inline', marginRight:4 }} />
              Do NOT do these
            </div>
            <div className="trouble-list">
              {issue.do_not.map((d, i) => (
                <div key={i} className="trouble-list-item" style={{ color:'#92400e' }}>{d}</div>
              ))}
            </div>
          </div>

          <div className="trouble-safety">
            <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
              <ShieldAlert size={16} color="var(--color-error)" style={{ flexShrink:0, marginTop:2 }} />
              <div>
                <div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--color-error)', marginBottom:4 }}>
                  When to go to a professional
                </div>
                <div style={{ fontSize:'0.83rem', color:'#7f1d1d', lineHeight:1.5 }}>
                  {issue.professional}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
