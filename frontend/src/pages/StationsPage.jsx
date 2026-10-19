import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Zap, Filter, Navigation } from 'lucide-react';
import { getStations, getNearbyStations } from '../services/api.js';

const SAMPLE_DATA_NOTE = '⚠️ SAMPLE STATION DATA — This is fictional demo data, NOT live/real-time charging station information.';

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle|requesting|granted|denied
  const [userCoords, setUserCoords] = useState(null);
  const [filters, setFilters] = useState({ charger_type: '', available_only: false });

  // Load all stations on mount
  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true); setError(null);
    try {
      const data = await getStations({
        charger_type: filters.charger_type || undefined,
        available_only: filters.available_only,
      });
      setStations(data.stations || []);
    } catch (err) {
      setError(err?.message || 'Failed to load stations.');
    } finally {
      setLoading(false);
    }
  }

  async function requestGeolocation() {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });
        setGeoStatus('granted');
        // Fetch nearby
        setLoading(true); setError(null);
        try {
          const data = await getNearbyStations({
            latitude, longitude, radius_km: 500,
            filters: { charger_type: filters.charger_type || undefined, available_only: filters.available_only },
          });
          setStations(data.stations || []);
        } catch (err) {
          setError(err?.message || 'Failed to load nearby stations.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setGeoStatus('denied');
        fetchAll(); // Fall back to full list
      },
      { timeout: 8000 }
    );
  }

  function toggleFilter(key, value) {
    const next = { ...filters, [key]: filters[key] === value ? '' : value };
    setFilters(next);
  }

  // Apply client-side filter
  const displayed = stations.filter(s => {
    if (filters.charger_type && s.charger_type !== filters.charger_type) return false;
    if (filters.available_only && !s.available) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><MapPin size={22} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-accent)' }} />Charging Stations</h1>
        <p>Browse sample EV charging stations. Use geolocation to sort by distance.</p>
      </div>

      {/* Sample data warning — always visible */}
      <div className="alert alert-warning">
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span>{SAMPLE_DATA_NOTE}</span>
      </div>

      {/* Geo + Filter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {geoStatus !== 'granted' && (
          <button
            id="btn-geolocation"
            className="btn btn-secondary btn-sm"
            onClick={requestGeolocation}
            disabled={geoStatus === 'requesting'}
          >
            <Navigation size={14} />
            {geoStatus === 'requesting' ? 'Getting location…' : 'Use My Location'}
          </button>
        )}
        {geoStatus === 'granted' && (
          <span className="badge badge-success"><Navigation size={11} /> Location active</span>
        )}
        {geoStatus === 'denied' && (
          <span className="badge badge-warning">Location denied — showing all</span>
        )}

        <div className="filter-bar" style={{ margin: 0, flex: 1 }}>
          <Filter size={14} color="var(--color-text-muted)" />
          {['AC', 'DC'].map(type => (
            <button key={type} id={`filter-${type}`}
              className={`filter-btn ${filters.charger_type === type ? 'active' : ''}`}
              onClick={() => toggleFilter('charger_type', type)}>
              {type} Charger
            </button>
          ))}
          <button id="filter-available"
            className={`filter-btn ${filters.available_only ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, available_only: !f.available_only }))}>
            Available Only
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--color-text-muted)' }}>
          <div className="loading-spinner" /> Loading stations…
        </div>
      )}
      {error && <div className="error-box">{error}</div>}

      {!loading && (
        <>
          <p style={{ fontSize:'0.8rem', color:'var(--color-text-muted)' }}>
            Showing {displayed.length} station{displayed.length !== 1 ? 's' : ''}
            {userCoords ? ' sorted by distance' : ''}
          </p>
          <div className="station-grid">
            {displayed.map(station => (
              <StationCard key={station.id} station={station} />
            ))}
            {displayed.length === 0 && !loading && (
              <p style={{ color:'var(--color-text-muted)', gridColumn:'1/-1', textAlign:'center', padding:40 }}>
                No stations match your filters.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StationCard({ station }) {
  return (
    <div className={`station-card ${station.available ? 'available' : 'unavailable'}`}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div className="station-name">{station.name}</div>
        <span className="station-demo-badge"><AlertTriangle size={10} /> Demo</span>
      </div>
      <div className="station-address">
        <MapPin size={11} style={{ display:'inline', marginRight:3 }} />
        {station.address || station.city}
        {station.distance_km != null && ` · ${station.distance_km.toFixed(1)} km`}
      </div>

      <div className="station-tags">
        <span className={`station-tag ${station.charger_type === 'DC' ? 'dc' : ''}`}>
          {station.charger_type}
        </span>
        <span className="station-tag">{station.connector_type}</span>
        <span className={`station-tag ${station.available ? 'available-tag' : 'unavailable-tag'}`}>
          {station.available ? '✓ Available' : '✗ Occupied'}
        </span>
      </div>

      <div className="station-meta">
        <span className="station-power"><Zap size={12} style={{ display:'inline' }} /> {station.power_kw} kW</span>
        {station.price_per_kwh_inr && <span>₹{station.price_per_kwh_inr}/kWh</span>}
        <span>{station.hours}</span>
      </div>
    </div>
  );
}
