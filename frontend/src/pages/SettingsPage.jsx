import { useState, useEffect } from 'react';
import { Settings, Server, Key, Globe, CheckCircle, XCircle } from 'lucide-react';
import { healthCheck } from '../services/api.js';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  async function checkHealth() {
    setHealthLoading(true); setHealthError(null);
    try {
      const data = await healthCheck();
      setHealth(data);
    } catch (err) {
      setHealthError(err?.message || 'Backend unreachable');
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }

  useEffect(() => { checkHealth(); }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Settings size={22} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-accent)' }} />Settings & Status</h1>
        <p>View connection status and configuration information.</p>
      </div>

      {/* Backend status */}
      <div className="card" style={{ maxWidth:580 }}>
        <div className="card-title"><Server size={18} /> Backend Connection</div>

        <div className="stat-row">
          <span className="stat-row-label"><Globe size={13} style={{ display:'inline', marginRight:4 }} />API Base URL</span>
          <span className="stat-row-value" style={{ fontSize:'0.8rem', fontFamily:'monospace', wordBreak:'break-all' }}>{apiBase}</span>
        </div>

        {health ? (
          <>
            <div className="stat-row">
              <span className="stat-row-label">Status</span>
              <span className="badge badge-success"><CheckCircle size={11} /> {health.status}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label">API Version</span>
              <span className="stat-row-value">{health.version}</span>
            </div>
            <div className="stat-row">
              <span className="stat-row-label"><Key size={13} style={{ display:'inline', marginRight:4 }} />Gemini AI Key</span>
              <span className={`badge ${health.gemini_configured ? 'badge-success' : 'badge-error'}`}>
                {health.gemini_configured
                  ? <><CheckCircle size={11} /> Configured</>
                  : <><XCircle size={11} /> Not configured</>
                }
              </span>
            </div>
            {!health.gemini_configured && (
              <div className="alert alert-warning" style={{ marginTop:12 }}>
                <span>⚠️</span>
                <span>Set <code>GEMINI_API_KEY</code> and <code>GEMINI_MODEL</code> in your backend environment variables to enable AI chat. The calculators and trip planner work without an API key.</span>
              </div>
            )}
          </>
        ) : healthError ? (
          <div className="alert alert-error" style={{ marginTop:12 }}>
            <XCircle size={14} />
            <div>
              <div><strong>Backend unreachable</strong></div>
              <div style={{ fontSize:'0.8rem' }}>{healthError}</div>
              <div style={{ fontSize:'0.78rem', marginTop:4 }}>
                Make sure the FastAPI server is running at <code>{apiBase}</code> and CORS is configured correctly.
              </div>
            </div>
          </div>
        ) : null}

        <button className="btn btn-secondary btn-sm" onClick={checkHealth} disabled={healthLoading} style={{ marginTop:14 }}>
          {healthLoading ? 'Checking…' : '↻ Re-check Connection'}
        </button>
      </div>

      {/* Config info */}
      <div className="card" style={{ maxWidth:580 }}>
        <div className="card-title" style={{ fontSize:'0.85rem' }}>Configuration Guide</div>
        <div style={{ fontSize:'0.83rem', color:'var(--color-text-secondary)', lineHeight:1.7 }}>
          <p><strong>Development:</strong> Set <code>VITE_API_BASE_URL=http://localhost:8000</code> in <code>frontend/.env</code></p>
          <p style={{ marginTop:8 }}><strong>Production:</strong> Set <code>VITE_API_BASE_URL</code> to your Render backend URL at build time.</p>
          <p style={{ marginTop:8 }}><strong>Gemini API Key:</strong> Add <code>GEMINI_API_KEY</code> to Render environment variables only. Never add it to frontend files.</p>
          <p style={{ marginTop:8 }}>See <code>README.md</code> for full deployment instructions.</p>
        </div>
      </div>
    </div>
  );
}
