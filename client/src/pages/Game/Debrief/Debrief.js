import { useParams, useLocation, Link } from 'react-router-dom';
import { MISSIONS } from '../../../data/missions';
import { CREATURES } from '../../../data/creatures';
import './Debrief.css';

export default function Debrief() {
  const { missionId } = useParams();
  const location = useLocation();
  const mission = MISSIONS[missionId];
  const turns = location.state?.turns || 0;
  const rank = turns <= 5 ? 'S' : turns <= 8 ? 'A' : 'B';

  if (!mission || !mission.realWorldData) {
    return (
      <div className="debrief">
        <h2 className="debrief__title">MISSION COMPLETE</h2>
        <Link to="/game" className="debrief__btn">RETURN TO MAP</Link>
      </div>
    );
  }

  const { realWorldData, victoryMessage } = mission;
  const rewardCreature = mission.rewards?.creature ? CREATURES[mission.rewards.creature] : null;

  return (
    <div className="debrief animate-fade-in">
      <div className="debrief__banner">
        <h2 className="debrief__title">MISSION COMPLETE</h2>
        <div className="debrief__stats">
          <div className="debrief__stat">
            <span className="debrief__stat-value">{rank}</span>
            <span className="debrief__stat-label">RANK</span>
          </div>
          <div className="debrief__stat">
            <span className="debrief__stat-value">{turns}</span>
            <span className="debrief__stat-label">TURNS</span>
          </div>
          <div className="debrief__stat">
            <span className="debrief__stat-value">+{mission.rewards?.tap || 15}</span>
            <span className="debrief__stat-label">TAP</span>
          </div>
          <div className="debrief__stat">
            <span className="debrief__stat-value">+{mission.rewards?.awareness || 50}</span>
            <span className="debrief__stat-label">AWARENESS</span>
          </div>
        </div>
      </div>

      {/* Creature reward */}
      {rewardCreature && (
        <div className="debrief__reward">
          <h3 className="debrief__section-title">◆ CREATURE UNLOCKED</h3>
          <div className="debrief__reward-card">
            <img src={rewardCreature.sprite} alt={rewardCreature.name} className="debrief__reward-sprite" />
            <div className="debrief__reward-info">
              <span className="debrief__reward-name">{rewardCreature.name}</span>
              <span className="debrief__reward-title">{rewardCreature.title}</span>
              <span className="debrief__reward-level">Lv. 50</span>
            </div>
          </div>
          {victoryMessage && <p className="debrief__reward-note">{victoryMessage.reward}</p>}
        </div>
      )}

      {/* Victory message / lesson */}
      {victoryMessage && (
        <div className="debrief__section debrief__section--lesson">
          <h3 className="debrief__section-title">◆ {victoryMessage.title}</h3>
          <p className="debrief__lesson-body">{victoryMessage.body}</p>
        </div>
      )}

      <div className="debrief__section">
        <h3 className="debrief__section-title">◆ WHAT ACTUALLY HAPPENED</h3>
        <div className="debrief__real-stats">
          <span>Total Loss: <strong>{realWorldData.totalLoss}</strong></span>
          <span>Victims: <strong>{realWorldData.victims?.toLocaleString()}</strong></span>
          <span>Duration: <strong>{realWorldData.duration}</strong></span>
        </div>
        <div className="debrief__timeline">
          {realWorldData.timeline.map((item, i) => (
            <div key={i} className="debrief__timeline-item">
              <span className="debrief__timeline-date">{item.date}</span>
              <span className="debrief__timeline-event">{item.event}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="debrief__section">
        <h3 className="debrief__section-title">◆ HOW TO DEFEND YOURSELF</h3>
        <ol className="debrief__tips">
          {realWorldData.defenceTips.map((tip, i) => (
            <li key={i} className="debrief__tip">{tip}</li>
          ))}
        </ol>
      </div>

      <div className="debrief__actions">
        <Link to="/game" className="debrief__btn debrief__btn--primary">RETURN TO MAP</Link>
      </div>
    </div>
  );
}
