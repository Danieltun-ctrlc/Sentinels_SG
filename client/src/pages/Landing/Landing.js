import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="landing__hero">
        {/* Grid background */}
        <div className="landing__grid-bg"></div>

        {/* Scanline overlay */}
        <div className="landing__scanlines"></div>

        {/* Corner decorations */}
        <div className="landing__corner landing__corner--tl"></div>
        <div className="landing__corner landing__corner--tr"></div>
        <div className="landing__corner landing__corner--bl"></div>
        <div className="landing__corner landing__corner--br"></div>

        {/* Logo */}
        <div className="landing__logo-container">
          <img src="/assets/logo/logo.png" alt="Sentinel SG" className="landing__logo-img" />
        </div>

        {/* Motto */}
        <div className="landing__motto-container">
          <span className="landing__motto-bracket">[</span>
          <p className="landing__motto">TRAIN THE REFLEX. PROTECT THE COMMUNITY.</p>
          <span className="landing__motto-bracket">]</span>
        </div>

        {/* Status bar */}
        <div className="landing__status-bar">
          <span className="landing__status-item">◆ SYSTEM ONLINE</span>
          <span className="landing__status-sep">|</span>
          <span className="landing__status-item">SINGAPORE SECTOR</span>
          <span className="landing__status-sep">|</span>
          <span className="landing__status-item">CODE_EXP 2026</span>
        </div>

        {/* CTA Buttons */}
        <div className="landing__cta">
          <Link to="/signup" className="landing__btn landing__btn--primary">[ JOIN PROGRAM ]</Link>
          <Link to="/login" className="landing__btn landing__btn--secondary">[ LOG IN ]</Link>
        </div>
      </section>

      {/* What's Inside Section */}
      <section className="landing__features">
        <div className="landing__features-header">
          <span className="landing__features-line"></span>
          <h3 className="landing__features-title">WHAT'S INSIDE</h3>
          <span className="landing__features-line"></span>
        </div>

        <div className="landing__features-grid">
          <Link to="/game" className="landing__feature-card landing__feature-card--game">
            <div className="landing__feature-top">
              <span className="landing__feature-tag">01</span>
              <span className="landing__feature-dot"></span>
            </div>
            <div className="landing__feature-icon">⚔️</div>
            <h4 className="landing__feature-name">THE GAME</h4>
            <p className="landing__feature-desc">Pokémon-style battles. Train the reflex.</p>
          </Link>

          <Link to="/threats" className="landing__feature-card landing__feature-card--threats">
            <div className="landing__feature-top">
              <span className="landing__feature-tag">02</span>
              <span className="landing__feature-dot"></span>
            </div>
            <div className="landing__feature-icon">📡</div>
            <h4 className="landing__feature-name">THREAT BRIEFING</h4>
            <p className="landing__feature-desc">Live Singapore scam intelligence.</p>
          </Link>

          <Link to="/factcheck" className="landing__feature-card landing__feature-card--factcheck">
            <div className="landing__feature-top">
              <span className="landing__feature-tag">03</span>
              <span className="landing__feature-dot"></span>
            </div>
            <div className="landing__feature-icon">🔍</div>
            <h4 className="landing__feature-name">FACT-CHECKER</h4>
            <p className="landing__feature-desc">AI scam analyser when a threat lands.</p>
          </Link>
        </div>

        <p className="landing__sources">Data sources: SPF · ScamShield · CSA · MAS · IMDA</p>
      </section>
    </div>
  );
}
