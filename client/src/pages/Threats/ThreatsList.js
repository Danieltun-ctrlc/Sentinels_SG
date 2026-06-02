import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './ThreatsList.css';

const FAMILIES = [
  { key: '', label: 'All' },
  { key: 'phantom', label: 'Phantom' },
  { key: 'illusion', label: 'Illusion' },
  { key: 'toxic', label: 'Toxic' },
  { key: 'coercion', label: 'Coercion' },
];

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending' },
  { value: 'recent', label: 'Recent' },
  { value: 'victims', label: 'Most Victims' },
  { value: 'losses', label: 'Highest Losses' },
];

function formatNumber(num) {
  if (!num && num !== 0) return '—';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function ThreatsList() {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [family, setFamily] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('trending');

  // Fetch stats
  useEffect(() => {
    api.get('/threats/stats')
      .then(res => setStats(res.data.stats))
      .catch(() => {});
  }, []);

  // Fetch threats with filters
  const fetchThreats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { sort, limit: 20 };
      if (family) params.family = family;
      if (search) params.q = search;
      const res = await api.get('/threats', { params });
      setThreats(res.data.threats || []);
    } catch (err) {
      setError('Failed to load threats. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [family, search, sort]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="threats-page animate-fade-in">
      {/* Header */}
      <header className="threats-header">
        <h1>🚨 TRENDING THREATS IN SINGAPORE</h1>
        <p className="subtitle">Real-time scam intelligence from the Singapore Threat Landscape</p>
      </header>

      {/* Stats Strip */}
      {stats && (
        <div className="threats-stats-strip">
          <div className="stat-card">
            <div className="stat-value">{formatNumber(stats.totalThreats)}</div>
            <div className="stat-label">Total Threats</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatNumber(stats.totalVictims)}</div>
            <div className="stat-label">Total Victims</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalLoss?.display || formatCurrency(stats.totalLoss?.value || 0)}</div>
            <div className="stat-label">Total Losses</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.byFamily ? stats.byFamily.length : '—'}</div>
            <div className="stat-label">Families</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="threats-controls">
        <input
          type="text"
          className="threats-search"
          placeholder="🔍 Search threats..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search threats"
        />

        <div className="filter-pills">
          {FAMILIES.map(f => (
            <button
              key={f.key}
              className={`filter-pill ${f.key ? `family-${f.key}` : ''} ${family === f.key ? 'active' : ''}`}
              onClick={() => setFamily(f.key)}
              aria-pressed={family === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          className="sort-dropdown"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort threats"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading && <div className="threats-loading">⏳ Loading threat intelligence...</div>}
      {error && <div className="threats-error">⚠️ {error}</div>}

      {!loading && !error && (
        <div className="threats-grid">
          {threats.map((threat, index) => (
            <Link
              to={`/threats/${threat._id || threat.id}`}
              key={threat._id || threat.id}
              className={`threat-card family-${(threat.family || '').toLowerCase()}`}
            >
              <div className="threat-card-header">
                <span className="rank-badge">#{index + 1}</span>
                <span className="threat-card-name">{threat.name}</span>
                <span className={`prevalence-badge ${(threat.prevalence || '').toLowerCase()}`}>
                  {threat.prevalence}
                </span>
              </div>

              <p className="threat-card-desc">
                {threat.description || threat.shortDescription || 'No description available.'}
              </p>

              <div className="threat-card-stats">
                <span>👥 <span className="value">{formatNumber(threat.victimCount || threat.victims)}</span></span>
                <span>💰 <span className="value">{formatCurrency(threat.totalLoss || threat.loss)}</span></span>
              </div>

              <span className="threat-card-link">View Details →</span>
            </Link>
          ))}

          {threats.length === 0 && (
            <div className="threats-loading">No threats found matching your criteria.</div>
          )}
        </div>
      )}
    </div>
  );
}
