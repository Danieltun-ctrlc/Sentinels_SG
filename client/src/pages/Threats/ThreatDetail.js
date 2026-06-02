import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import './ThreatDetail.css';

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

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ThreatDetail() {
  const { id } = useParams();
  const [threat, setThreat] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchThreat() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/threats/${id}`);
        setThreat(res.data.threat);
      } catch (err) {
        setError('Failed to load threat details.');
      } finally {
        setLoading(false);
      }
    }
    fetchThreat();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/threats/${id}/related`)
      .then(res => setRelated(res.data.related || []))
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="threat-detail-page animate-fade-in">
        <div className="threat-detail-loading">⏳ Loading threat intelligence...</div>
      </div>
    );
  }

  if (error || !threat) {
    return (
      <div className="threat-detail-page animate-fade-in">
        <Link to="/threats" className="threat-back-link">← Back to Threats</Link>
        <div className="threat-detail-error">⚠️ {error || 'Threat not found.'}</div>
      </div>
    );
  }

  const familyClass = (threat.family || '').toLowerCase();
  const prevalenceClass = (threat.prevalence || '').toLowerCase();

  return (
    <div className="threat-detail-page animate-fade-in">
      {/* Back Link */}
      <Link to="/threats" className="threat-back-link">← Back to Threats</Link>

      {/* Header */}
      <header className="threat-detail-header">
        <div className="threat-detail-badges">
          {threat.family && (
            <span className={`badge badge-family ${familyClass}`}>{threat.family}</span>
          )}
          {threat.prevalence && (
            <span className={`badge badge-prevalence ${prevalenceClass}`}>{threat.prevalence}</span>
          )}
          {threat.category && (
            <span className="badge badge-category">{threat.category}</span>
          )}
        </div>
        <h1 className="threat-detail-name">{threat.name}</h1>
        <p className="threat-detail-description">{threat.description}</p>
      </header>

      {/* Stats Row */}
      <div className="threat-detail-stats">
        <div className="detail-stat">
          <div className="detail-stat-value">{formatNumber(threat.victimCount || threat.victims)}</div>
          <div className="detail-stat-label">Victims</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-value">{formatCurrency(threat.totalLoss || threat.loss)}</div>
          <div className="detail-stat-label">Total Losses</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-value">{formatDate(threat.firstReported || threat.dateReported)}</div>
          <div className="detail-stat-label">First Reported</div>
        </div>
      </div>

      {/* Red Flags */}
      {threat.redFlags && threat.redFlags.length > 0 && (
        <section className="threat-section">
          <h2 className="threat-section-title">🚩 RED FLAGS</h2>
          <ul className="red-flags-list">
            {threat.redFlags.map((flag, i) => (
              <li key={i}>
                <span className="red-flag-icon">🚩</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Prevention Tips */}
      {threat.preventionTips && threat.preventionTips.length > 0 && (
        <section className="threat-section">
          <h2 className="threat-section-title">✅ PREVENTION TIPS</h2>
          <ul className="prevention-list">
            {threat.preventionTips.map((tip, i) => (
              <li key={i}>
                <span className="tip-number">✓{i + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sample Messages */}
      {threat.sampleTexts && threat.sampleTexts.length > 0 && (
        <section className="threat-section">
          <h2 className="threat-section-title">💬 SAMPLE MESSAGES</h2>
          <div className="sample-messages">
            {threat.sampleTexts.map((text, i) => (
              <div key={i} className="sample-message-card">
                {text}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sources */}
      {threat.sources && threat.sources.length > 0 && (
        <section className="threat-section">
          <h2 className="threat-section-title">📎 SOURCES</h2>
          <ul className="sources-list">
            {threat.sources.map((source, i) => (
              <li key={i}>
                <div className="source-org">{source.organization || source.name || 'Source'}</div>
                {source.url && (
                  <a
                    href={source.url}
                    className="source-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.url}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reporting */}
      <section className="threat-section">
        <h2 className="threat-section-title">📞 REPORT THIS THREAT</h2>
        <div className="reporting-buttons">
          <a
            href="https://www.scamshield.org.sg"
            className="report-btn scamshield"
            target="_blank"
            rel="noopener noreferrer"
          >
            🛡️ Report on ScamShield
          </a>
          <a
            href="tel:1799"
            className="report-btn hotline"
          >
            📞 Call Anti-Scam Hotline (1799)
          </a>
        </div>
      </section>

      {/* Related Threats */}
      {related.length > 0 && (
        <section className="threat-section">
          <h2 className="threat-section-title">🔗 RELATED THREATS</h2>
          <div className="related-threats-grid">
            {related.slice(0, 5).map(r => (
              <Link
                to={`/threats/${r._id || r.id}`}
                key={r._id || r.id}
                className={`related-threat-card family-${(r.family || '').toLowerCase()}`}
              >
                <div className="related-threat-name">{r.name}</div>
                <div className="related-threat-meta">
                  {r.prevalence && (
                    <span className={`prevalence-badge ${(r.prevalence || '').toLowerCase()}`}>
                      {r.prevalence}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
