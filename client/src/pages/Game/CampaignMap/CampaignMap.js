import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import gameService from '../../../services/gameService';
import './CampaignMap.css';

const MISSIONS = [
  { id: 'mission_01', code: 'M01', name: 'OCBC INCIDENT', tag: null },
  { id: 'mission_02', code: 'M02', name: 'SINGHEALTH BREACH', tag: null },
  { id: 'mission_03', code: 'M03', name: 'PARCEL SCAM WAVE', tag: null },
  { id: 'mission_04', code: 'M04 · INTERCHANGE', name: 'DEEPFAKE ALERT', tag: 'CHAPTER 2 BRANCH' },
  { id: 'mission_05', code: 'M05', name: 'SEXTORTION RING', tag: null },
  { id: 'mission_06', code: 'M06 · CHAPTER BOSS', name: 'SYNDICATE BOSS', tag: 'COMPLETE M01-M05' },
];

// Station positions (x%, y in px) — diagonal layout
const POSITIONS = [
  { x: 3, y: 40 },
  { x: 16, y: 110 },
  { x: 30, y: 180 },
  { x: 45, y: 250 },
  { x: 60, y: 320 },
  { x: 76, y: 390 },
];

export default function CampaignMap() {
  const [completedMissions, setCompletedMissions] = useState([]);
  const [missionData, setMissionData] = useState([]);

  useEffect(() => {
    gameService.getMissions()
      .then((missions) => {
        setMissionData(missions);
        // Only count as fully completed if both defender AND attacker won
        const fullyComplete = missions
          .filter(m => m.defender_won && m.attacker_won)
          .map(m => m.mission_id);
        setCompletedMissions(fullyComplete);
      })
      .catch(() => {});
  }, []);

  const getStatus = (missionId, index) => {
    if (completedMissions.includes(missionId)) return 'completed';
    if (index === 0) return 'available';
    const prevId = MISSIONS[index - 1]?.id;
    if (completedMissions.includes(prevId)) return 'available';
    return 'locked';
  };

  return (
    <div className="mrt-map">
      <div className="mrt-map__header">
        <h2 className="mrt-map__title">› CAMPAIGN</h2>
        <span className="mrt-map__subtitle">THE PHANTOM CHRONICLES</span>
      </div>

      <div className="mrt-map__track">
        {/* SVG line connecting all nodes */}
        <svg className="mrt-map__svg" viewBox="0 0 1000 460" preserveAspectRatio="none">
          <line
            x1={POSITIONS[0].x * 10 + 12}
            y1={POSITIONS[0].y + 12}
            x2={POSITIONS[5].x * 10 + 12}
            y2={POSITIONS[5].y + 12}
            stroke="#9333EA"
            strokeWidth="3"
          />
        </svg>

        {/* Stations */}
        {MISSIONS.map((mission, index) => {
          const status = getStatus(mission.id, index);
          const isClickable = status !== 'locked';
          const pos = POSITIONS[index];

          const stationContent = (
            <div className={`mrt-map__station mrt-map__station--${status}`}>
              <div className={`mrt-map__node mrt-map__node--${status}`}>
                {status === 'completed' && <span className="mrt-map__node-icon">✓</span>}
                {status === 'locked' && <span className="mrt-map__node-icon">🔒</span>}
              </div>
              <div className="mrt-map__info">
                <span className="mrt-map__code">{mission.code}</span>
                <span className="mrt-map__name">{mission.name}</span>
                <span className={`mrt-map__badge mrt-map__badge--${status}`}>
                  {status === 'completed' && '✓ BOTH SIDES COMPLETE'}
                  {status === 'available' && (() => {
                    const md = missionData.find(m => m.mission_id === mission.id);
                    if (md) {
                      if (md.defender_won && !md.attacker_won) return '► ATTACKER SIDE NEEDED';
                      if (!md.defender_won && md.attacker_won) return '► DEFENDER SIDE NEEDED';
                    }
                    return '► AVAILABLE';
                  })()}
                  {status === 'locked' && (mission.tag ? `🔒 ${mission.tag}` : '🔒 LOCKED')}
                </span>
              </div>
            </div>
          );

          const style = { left: `${pos.x}%`, top: `${pos.y}px` };

          if (isClickable) {
            return (
              <Link key={mission.id} to={`/game/pve/${mission.id}`} className="mrt-map__link" style={style}>
                {stationContent}
              </Link>
            );
          }
          return (
            <div key={mission.id} className="mrt-map__link" style={style}>
              {stationContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
