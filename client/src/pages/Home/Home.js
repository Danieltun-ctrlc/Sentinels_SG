import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      {/* Top Bar */}
      <div className="home__topbar">
        <div className="home__topbar-left">
          <div className="home__avatar">{(user?.display_name || user?.username || 'S')[0].toUpperCase()}</div>
          <div className="home__user-info">
            <span className="home__username">{user?.display_name || user?.username}</span>
            <span className="home__user-tier">{user?.tier || 'Recruit'} · Tier 1</span>
          </div>
        </div>
        <div className="home__topbar-right">
          <span className="home__awareness-badge">★ AWARENESS {user?.awareness_score?.toLocaleString() || 0}</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="home__header">
        <h2 className="home__page-title">› DASHBOARD</h2>
        <div className="home__header-stats">
          <span className="home__stat-pill">TAP: {user?.available_tap || 0}</span>
        </div>
      </div>

      {/* Three Pillars */}
      <div className="home__pillars">
        <Link to="/game" className="home__pillar home__pillar--game">
          <span className="home__pillar-tag">01</span>
          <div className="home__pillar-icon"><img src="/assets/ui/threat_arena.png" alt="Threat Arena" className="home__pillar-img" /></div>
          <h4 className="home__pillar-name">THE THREAT ARENA</h4>
          <p className="home__pillar-desc">Turn-based creature battler. Defend against cyber threats using your squad.</p>
          <span className="home__pillar-cta">ENTER ARENA →</span>
        </Link>

        <Link to="/threats" className="home__pillar home__pillar--threats">
          <span className="home__pillar-tag">02</span>
          <div className="home__pillar-icon"><img src="/assets/ui/threat_briefing.png" alt="Threat Briefing" className="home__pillar-img" /></div>
          <h4 className="home__pillar-name">THREAT BRIEFING</h4>
          <p className="home__pillar-desc">Live Singapore scam intelligence from SPF, ScamShield & CSA.</p>
          <span className="home__pillar-cta">VIEW INTEL →</span>
        </Link>

        <Link to="/factcheck" className="home__pillar home__pillar--factcheck">
          <span className="home__pillar-tag">03</span>
          <div className="home__pillar-icon"><img src="/assets/ui/ai_factchecker.png" alt="AI Fact-Checker" className="home__pillar-img" /></div>
          <h4 className="home__pillar-name">AI FACT-CHECKER</h4>
          <p className="home__pillar-desc">Dual-agent AI analysis for suspicious content. Source-cited verdicts.</p>
          <span className="home__pillar-cta">SCAN NOW →</span>
        </Link>
      </div>
    </div>
  );
}
