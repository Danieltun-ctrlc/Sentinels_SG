import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './GameHome.css';

export default function GameHome() {
  const { user } = useAuth();

  return (
    <div className="game-home">
      {/* Top Bar */}
      <div className="game-home__topbar">
        <div className="game-home__topbar-left">
          <div className="game-home__avatar">
            {(user?.display_name || user?.username || 'S')[0].toUpperCase()}
          </div>
          <div className="game-home__user-info">
            <span className="game-home__username">{user?.display_name || user?.username}</span>
            <span className="game-home__tier">{user?.tier || 'Recruit'} · Tier 1</span>
          </div>
        </div>
        <div className="game-home__topbar-right">
          <span className="game-home__awareness">★ AWARENESS {user?.awareness_score?.toLocaleString() || 0}</span>
        </div>
      </div>

      {/* Header Row */}
      <div className="game-home__header">
        <h2 className="game-home__title">› HOME</h2>
        <Link to="/game/pvp/leaderboard" className="game-home__lb-btn">LeaderBoard</Link>
      </div>

      {/* Mode Cards */}
      <div className="game-home__modes">
        <Link to="/game/campaign" className="game-home__mode game-home__mode--pve">
          <span className="game-home__mode-badge game-home__mode-badge--cyan">CAMPAIGN</span>
          <div className="game-home__mode-center">
            <h3 className="game-home__mode-big">PVE</h3>
            <div className="game-home__mode-sub">
              <span>STORY MODE</span>
              <span className="game-home__mode-arrow">►</span>
            </div>
          </div>
          <p className="game-home__mode-desc">Battle the Threat Syndicate. Unlock new moves, creatures, and Certifications.</p>
        </Link>

        <Link to="/game/pvp" className="game-home__mode game-home__mode--pvp">
          <span className="game-home__mode-badge game-home__mode-badge--magenta">RANKED</span>
          <div className="game-home__mode-center">
            <h3 className="game-home__mode-big">PVP</h3>
            <div className="game-home__mode-sub">
              <span className="game-home__mode-rank">CURRENT · {user?.tier || 'RECRUIT'}</span>
              <span>PURPLE TEAM DRILL</span>
              <span className="game-home__mode-arrow">►</span>
            </div>
          </div>
          <p className="game-home__mode-desc">Compete in two-phase battles. Climb ranks, earn the Architect tier.</p>
        </Link>
      </div>

      {/* Bottom Grid */}
      <div className="game-home__grid">
        <Link to="/game/codex" className="game-home__card">
          <img src="/assets/ui/codex.png" alt="Codex" className="game-home__card-img" />
          <h4 className="game-home__card-name">CODEX</h4>
          <p className="game-home__card-desc">Creature lore, scam case studies, threat intel.</p>
          <span className="game-home__card-stat">47 / 128 entries</span>
        </Link>

        <Link to="/game/training" className="game-home__card">
          <img src="/assets/ui/training_modules.png" alt="Training" className="game-home__card-img" />
          <h4 className="game-home__card-name">TRAINING MODULES</h4>
          <p className="game-home__card-desc">Earn TAP through cybersecurity drills and case studies.</p>
          <span className="game-home__card-stat">12 modules available</span>
        </Link>

        <Link to="/game/dictionary" className="game-home__card">
          <img src="/assets/ui/dictionary.png" alt="Dictionary" className="game-home__card-img" />
          <h4 className="game-home__card-name">DICTIONARY</h4>
          <p className="game-home__card-desc">Move effects, abilities, status conditions, type chart.</p>
        </Link>

        <Link to="/game/tap" className="game-home__card">
          <img src="/assets/ui/tap_allocation.png" alt="TAP" className="game-home__card-img" />
          <h4 className="game-home__card-name">TAP ALLOC</h4>
          <p className="game-home__card-desc">Spend training points to optimize your squad.</p>
        </Link>

        <Link to="/game/customisation" className="game-home__card">
          <img src="/assets/ui/customisation.png" alt="Customise" className="game-home__card-img" />
          <h4 className="game-home__card-name">CUSTOMISE</h4>
          <p className="game-home__card-desc">Spend Awareness Points on cosmetics and prestige items.</p>
          <span className="game-home__card-stat">⚡ {user?.awareness_score?.toLocaleString() || 0} pts</span>
        </Link>
      </div>
    </div>
  );
}
