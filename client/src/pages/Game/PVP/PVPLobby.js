import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function PVPLobby() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px' }}>
      <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '16px', color: 'var(--color-magenta)', marginBottom: '24px', textShadow: '0 0 8px rgba(255,46,99,0.4)' }}>
        ⚔ PURPLE TEAM DRILL
      </h2>

      <p style={{ color: 'var(--color-text)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
        Test your squad against other Sentinels. Pick 2 Defenders and 2 Attackers, then battle in alternating rounds. First to 3 wins takes the match.
      </p>

      <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>YOUR STATS</p>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--color-gold)' }}>
              {user?.awareness_score?.toLocaleString() || 0}
            </span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '4px' }}>AWARENESS</p>
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', color: 'var(--color-cyan)' }}>
              {user?.tier || 'Recruit'}
            </span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '4px' }}>TIER</p>
          </div>
        </div>
      </div>

      <Link
        to="/game/pvp/squad"
        style={{
          display: 'block',
          textAlign: 'center',
          fontFamily: 'var(--font-header)',
          fontSize: '12px',
          padding: '16px 32px',
          background: 'var(--color-magenta)',
          color: '#fff',
          textDecoration: 'none',
          letterSpacing: '2px',
          border: '2px solid var(--color-magenta)',
          transition: 'all 0.2s ease',
        }}
      >
        BUILD SQUAD & FIND MATCH
      </Link>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '16px', textAlign: 'center' }}>
        Win: +150 Awareness · Loss: +25 Awareness
      </p>
    </div>
  );
}
