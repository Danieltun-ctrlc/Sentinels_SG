import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './FactCheckResult.css';

const VERDICT_COLORS = {
  SAFE: 'var(--color-green)',
  LOW: 'var(--color-cyan)',
  MEDIUM: 'var(--color-amber)',
  HIGH: 'var(--color-red)',
  CRITICAL: 'var(--color-magenta)',
};

function getVerdictClass(verdict) {
  if (!verdict) return 'safe';
  const upper = verdict.toUpperCase();
  if (upper.includes('CRITICAL')) return 'critical';
  if (upper.includes('HIGH')) return 'high';
  if (upper.includes('MEDIUM')) return 'medium';
  if (upper.includes('LOW')) return 'low';
  return 'safe';
}

function getVerdictColor(verdict) {
  if (!verdict) return VERDICT_COLORS.SAFE;
  const upper = verdict.toUpperCase();
  if (upper.includes('CRITICAL')) return VERDICT_COLORS.CRITICAL;
  if (upper.includes('HIGH')) return VERDICT_COLORS.HIGH;
  if (upper.includes('MEDIUM')) return VERDICT_COLORS.MEDIUM;
  if (upper.includes('LOW')) return VERDICT_COLORS.LOW;
  return VERDICT_COLORS.SAFE;
}

export default function FactCheckResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  // Redirect to upload if no result
  useEffect(() => {
    if (!result) {
      navigate('/factcheck', { replace: true });
    }
  }, [result, navigate]);

  if (!result) return null;

  const {
    verdict = 'UNKNOWN',
    confidence = 0,
    threatFamily = null,
    redFlags = [],
    reasoning = '',
    agent1 = null,
    agent2 = null,
    sources = [],
    actions = [],
    agentsAgreed = true,
  } = result;

  const verdictClass = getVerdictClass(verdict);
  const verdictColor = getVerdictColor(verdict);

  return (
    <div className="factcheck-result animate-fade-in">
      {/* Header */}
      <div className="factcheck-result__header">
        <Link to="/factcheck" className="factcheck-result__back">‹ BACK</Link>
        <h1 className="factcheck-result__page-title">ANALYSIS COMPLETE</h1>
      </div>

      {/* Verdict Banner */}
      <div className={`factcheck-result__verdict-banner factcheck-result__verdict-banner--${verdictClass}`}>
        <div className="factcheck-result__verdict-main">
          <h2 className="factcheck-result__verdict-text" style={{ color: verdictColor }}>
            {verdict.toUpperCase()}
          </h2>
          {threatFamily && (
            <span className="factcheck-result__threat-badge">{threatFamily}</span>
          )}
        </div>
        <div className="factcheck-result__confidence">
          <div className="factcheck-result__confidence-circle" style={{ '--conf-color': verdictColor }}>
            <svg viewBox="0 0 36 36" className="factcheck-result__confidence-svg">
              <path
                className="factcheck-result__confidence-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="factcheck-result__confidence-fill"
                strokeDasharray={`${confidence}, 100`}
                style={{ stroke: verdictColor }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="factcheck-result__confidence-value">{confidence}%</span>
          </div>
          <span className="factcheck-result__confidence-label">CONFIDENCE</span>
        </div>
      </div>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div className="factcheck-result__section">
          <h3 className="factcheck-result__section-title">⚠️ RED FLAGS DETECTED</h3>
          <div className="factcheck-result__flags">
            {redFlags.map((flag, idx) => (
              <div key={idx} className="factcheck-result__flag-card">
                <span className="factcheck-result__flag-icon">🚩</span>
                <span className="factcheck-result__flag-text">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Comparison */}
      {(agent1 || agent2) && (
        <div className="factcheck-result__section">
          <h3 className="factcheck-result__section-title">🤖 AGENT COMPARISON</h3>
          <div className={`factcheck-result__agents-agreement ${agentsAgreed ? 'factcheck-result__agents-agreement--agreed' : 'factcheck-result__agents-agreement--disagreed'}`}>
            {agentsAgreed ? '✓ AGENTS AGREED' : '✗ AGENTS DISAGREED'}
          </div>
          <div className="factcheck-result__agents">
            {agent1 && (
              <div className="factcheck-result__agent-card factcheck-result__agent-card--agent1">
                <div className="factcheck-result__agent-header">
                  <span className="factcheck-result__agent-badge">AGENT 1</span>
                  <span className="factcheck-result__agent-name">RAG SCOUT</span>
                </div>
                {agent1.verdict && (
                  <div className="factcheck-result__agent-verdict" style={{ color: getVerdictColor(agent1.verdict) }}>
                    {agent1.verdict.toUpperCase()}
                  </div>
                )}
                <p className="factcheck-result__agent-reasoning">{agent1.reasoning || reasoning}</p>
              </div>
            )}
            {agent2 && (
              <div className="factcheck-result__agent-card factcheck-result__agent-card--agent2">
                <div className="factcheck-result__agent-header">
                  <span className="factcheck-result__agent-badge factcheck-result__agent-badge--green">AGENT 2</span>
                  <span className="factcheck-result__agent-name">VERIFIER</span>
                </div>
                {agent2.verdict && (
                  <div className="factcheck-result__agent-verdict" style={{ color: getVerdictColor(agent2.verdict) }}>
                    {agent2.verdict.toUpperCase()}
                  </div>
                )}
                <p className="factcheck-result__agent-reasoning">{agent2.reasoning || 'Cross-verification complete.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cited Sources */}
      {sources.length > 0 && (
        <div className="factcheck-result__section">
          <h3 className="factcheck-result__section-title">📚 CITED SOURCES</h3>
          <div className="factcheck-result__sources">
            {sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="factcheck-result__source-card"
              >
                <span className="factcheck-result__source-org">{source.organization || source.name || 'Source'}</span>
                {source.url && <span className="factcheck-result__source-url">{source.url}</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* What You Should Do */}
      {actions.length > 0 && (
        <div className="factcheck-result__section">
          <h3 className="factcheck-result__section-title">✅ WHAT YOU SHOULD DO</h3>
          <div className="factcheck-result__actions">
            {actions.map((action, idx) => (
              <div key={idx} className="factcheck-result__action-item">
                <span className="factcheck-result__action-number">{idx + 1}</span>
                <span className="factcheck-result__action-text">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prevention Tips from Knowledge Base */}
      {result.preventionTips && result.preventionTips.length > 0 && (
        <div className="factcheck-result__section">
          <h3 className="factcheck-result__section-title">🛡️ PREVENTION TIPS</h3>
          <div className="factcheck-result__actions">
            {result.preventionTips.map((tip, idx) => (
              <div key={idx} className="factcheck-result__action-item" style={{ borderLeftColor: 'var(--color-green)' }}>
                <span className="factcheck-result__action-number" style={{ borderColor: 'var(--color-green)', color: 'var(--color-green)' }}>✓</span>
                <span className="factcheck-result__action-text">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Section */}
      <div className="factcheck-result__section factcheck-result__report-section">
        <h3 className="factcheck-result__section-title">🚨 REPORT THIS THREAT</h3>
        <p className="factcheck-result__report-text">
          Your report helps protect 5.9M Singaporeans from scams.
        </p>
        <div className="factcheck-result__report-buttons">
          <a
            href="https://www.scamshield.gov.sg"
            target="_blank"
            rel="noopener noreferrer"
            className="factcheck-result__report-btn factcheck-result__report-btn--primary"
          >
            Report via ScamShield
          </a>
          <a href="tel:1799" className="factcheck-result__report-btn">
            Call 1799
          </a>
        </div>
      </div>

      {/* Scan Another */}
      <div className="factcheck-result__footer">
        <button
          className="factcheck-result__scan-again-btn"
          onClick={() => navigate('/factcheck')}
        >
          🔍 SCAN ANOTHER
        </button>
      </div>
    </div>
  );
}
