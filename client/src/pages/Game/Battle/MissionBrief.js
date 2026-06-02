import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MISSIONS } from '../../../data/missions';
import { CREATURES } from '../../../data/creatures';
import './MissionBrief.css';

export default function MissionBrief() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const mission = MISSIONS[missionId];

  if (!mission) {
    navigate('/game/campaign');
    return null;
  }

  const boss = CREATURES[mission.bossId];

  const handleStart = () => {
    if (!selectedRole) return;
    navigate(`/game/pve/${missionId}/setup`, { state: { role: selectedRole } });
  };

  return (
    <div className="mission-brief">
      <div className="mission-brief__header">
        <span className="mission-brief__code">{missionId.replace('_', ' ').toUpperCase()}</span>
        <h2 className="mission-brief__title">{mission.name}</h2>
        <p className="mission-brief__intro">{mission.intro}</p>
      </div>

      {/* Intel Panel */}
      {mission.threatBrief && (
        <div className="mission-brief__intel">
          <h3 className="mission-brief__intel-title">· THREAT INTELLIGENCE</h3>
          <ul className="mission-brief__intel-list">
            {mission.threatBrief.knownFacts.map((fact, i) => (
              <li key={i} className="mission-brief__intel-item">► {fact}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Role Selection */}
      <div className="mission-brief__roles">
        <h3 className="mission-brief__roles-title">· SELECT YOUR ROLE</h3>

        <div className="mission-brief__role-cards">
          {/* DEFENDER */}
          <div
            className={`mission-brief__role ${selectedRole === 'defender' ? 'mission-brief__role--selected' : ''}`}
            onClick={() => setSelectedRole('defender')}
          >
            <div className="mission-brief__role-badge mission-brief__role-badge--cyan">DEFENDER</div>
            <h4 className="mission-brief__role-title">PROTECT SINGAPORE</h4>
            <p className="mission-brief__role-desc">
              Play as a Defender creature. Use verification, fact-checking, and reporting to defeat the attacker.
              Learn how real Singaporeans can protect themselves from this threat.
            </p>
            <div className="mission-brief__role-context">
              <span className="mission-brief__role-label">YOUR MISSION:</span>
              <p>Stop {boss?.name || 'the attacker'} before they compromise more victims. Every move you make teaches a real-world defence skill.</p>
            </div>
            <div className="mission-brief__role-creatures">
              <span className="mission-brief__role-label">AVAILABLE CREATURES:</span>
              <div className="mission-brief__creature-list">
                {['verifox', 'cryptochel'].map(id => {
                  const c = CREATURES[id];
                  return c ? (
                    <span key={id} className="mission-brief__creature-tag">{c.name} ({c.type})</span>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* ATTACKER */}
          <div
            className={`mission-brief__role ${selectedRole === 'attacker' ? 'mission-brief__role--selected mission-brief__role--attacker' : ''}`}
            onClick={() => setSelectedRole('attacker')}
          >
            <div className="mission-brief__role-badge mission-brief__role-badge--magenta">ATTACKER</div>
            <h4 className="mission-brief__role-title">THINK LIKE THE ENEMY</h4>
            <p className="mission-brief__role-desc">
              Play as an Attacker creature. Simulate scam tactics against Singapore's defences.
              Understanding how scammers operate is the first step to stopping them.
            </p>
            <div className="mission-brief__role-context">
              <span className="mission-brief__role-label">YOUR MISSION:</span>
              <p>Exploit weaknesses in the defender's awareness. See how scammers think — so you never fall for it yourself.</p>
            </div>
            <div className="mission-brief__role-creatures">
              <span className="mission-brief__role-label">AVAILABLE CREATURES:</span>
              <div className="mission-brief__creature-list">
                {['phishmonger', 'trollgeist'].map(id => {
                  const c = CREATURES[id];
                  return c ? (
                    <span key={id} className="mission-brief__creature-tag mission-brief__creature-tag--red">{c.name} ({c.type})</span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Context */}
      <div className="mission-brief__education">
        <h3 className="mission-brief__edu-title">· WHY BOTH ROLES?</h3>
        <p className="mission-brief__edu-text">
          Singapore's Cyber Security Agency (CSA) recommends understanding attack patterns to build stronger defences.
          Playing as the attacker teaches you to recognise manipulation tactics — urgency, impersonation, isolation —
          so you can spot them in real life before clicking, transferring, or sharing.
        </p>
      </div>

      {/* Start Button */}
      <div className="mission-brief__actions">
        <button
          className="mission-brief__start-btn"
          onClick={handleStart}
          disabled={!selectedRole}
        >
          {selectedRole ? `START AS ${selectedRole.toUpperCase()}` : 'SELECT A ROLE TO BEGIN'}
        </button>
        <button className="mission-brief__back-btn" onClick={() => navigate('/game/campaign')}>
          ← BACK TO MAP
        </button>
      </div>
    </div>
  );
}
