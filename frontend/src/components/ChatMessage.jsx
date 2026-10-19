import { timeAgo } from '../utils/formatting';
import { fmtNumber } from '../utils/formatting';

/** Renders a single chat message bubble */
export default function ChatMessage({ message }) {
  const { role, content, calcContext, timestamp } = message;
  const isAI = role === 'model' || role === 'assistant';

  return (
    <div className={`chat-message ${isAI ? 'ai' : 'user'}`}>
      <div className={`msg-avatar ${isAI ? 'ai' : 'user'}`} aria-hidden="true">
        {isAI ? '⚡' : 'You'}
      </div>
      <div style={{ maxWidth: '75%' }}>
        <div className="msg-bubble">
          {/* Render message text preserving line breaks */}
          {content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < content.split('\n').length - 1 && <br />}
            </span>
          ))}

          {/* Inline calculation result card (if AI message has calc context) */}
          {isAI && calcContext && <CalcContextCard ctx={calcContext} />}
        </div>
        <div className="msg-time">{timestamp ? timeAgo(timestamp) : ''}</div>
      </div>
    </div>
  );
}

function CalcContextCard({ ctx }) {
  if (!ctx || !ctx.calculation_type) return null;

  const type = ctx.calculation_type;

  if (type === 'charging_time' && ctx.charging_time) {
    const d = ctx.charging_time;
    return (
      <div className="calc-result-card">
        <div className="calc-result-title">⚡ Charging Time Estimate</div>
        <div className="calc-result-grid">
          <Item label="Estimated Time" value={`${fmtNumber(d.estimated_time_hours, 2)} hrs (${fmtNumber(d.estimated_time_minutes, 0)} min)`} />
          <Item label="Energy Required" value={`${fmtNumber(d.energy_required_kwh)} kWh`} />
          <Item label="SOC Gain" value={`+${fmtNumber(d.soc_gain_percent, 1)}%`} />
          <Item label="Efficiency Factor" value={fmtNumber(d.efficiency_factor, 2)} />
        </div>
      </div>
    );
  }

  if (type === 'charging_cost' && ctx.charging_cost) {
    const d = ctx.charging_cost;
    return (
      <div className="calc-result-card">
        <div className="calc-result-title">💰 Charging Cost Estimate</div>
        <div className="calc-result-grid">
          <Item label="Total Cost" value={`${d.currency_symbol}${fmtNumber(d.total_cost)}`} />
          <Item label="Energy Required" value={`${fmtNumber(d.energy_required_kwh)} kWh`} />
          <Item label="Per 10% SOC" value={`${d.currency_symbol}${fmtNumber(d.cost_per_10_percent_soc)}`} />
          {d.cost_per_100_km && <Item label="Per 100 km" value={`${d.currency_symbol}${fmtNumber(d.cost_per_100_km)}`} />}
        </div>
      </div>
    );
  }

  if (type === 'range' && ctx.range_estimate) {
    const d = ctx.range_estimate;
    return (
      <div className="calc-result-card">
        <div className="calc-result-title">🛣️ Range Estimate</div>
        <div className="calc-result-grid">
          <Item label="Estimated Range" value={`${fmtNumber(d.estimated_range_km, 1)} km`} />
          <Item label="Remaining Energy" value={`${fmtNumber(d.remaining_energy_kwh)} kWh`} />
          <Item label="Current SOC" value={`${fmtNumber(d.current_soc_percent, 0)}%`} />
        </div>
      </div>
    );
  }

  return null;
}

function Item({ label, value }) {
  return (
    <div className="calc-result-item">
      <div className="calc-result-label">{label}</div>
      <div className="calc-result-value">{value}</div>
    </div>
  );
}
