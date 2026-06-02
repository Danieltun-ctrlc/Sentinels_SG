import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './PVPDebrief.css';

export default function PVPDebrief() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const { result, playerScore, opponentScore, roundResults, opponent, awarenessAwarded } = location.state || {};

  // Refresh user data to reflect new awareness score
  refreshUser?.();

  if (!result) {
    navigate('/game/pvp/squad', { replace: true });
    return null;
  }

  const isWin = result === 'WIN';

  return (
    <div className="pvp-debrief animate-fade-in">
      <h1 className={`pvp-debrief__banner ${isWin ? 'pvp-debrief__banner--win' : 'pvp-debrief__banner--loss'}`}>
        {isWin ? 'VICTORY' : 'DEFEAT'}
      </h1>

      <p className="pvp-debrief__opponent">
        vs <span className="pvp-debrief__opponent-name">{opponent?.username || 'Unknown'}</span>
      </p>

      <div className="pvp-debrief__score">
        <span className="pvp-debrief__score-player">{playerScore}</span>
        <span className="pvp-debrief__score-divider">—</span>
        <span className="pvp-debrief__score-opponent">{opponentScore}</span>
      </div>

      <div className="pvp-debrief__rounds">
        <h3 className="pvp-debrief__rounds-title">Round Results</h3>
        {roundResults?.map((r, i) => (
          <div key={i} className="pvp-debrief__round-row">
            <span className="pvp-debrief__round-label">Round {r.round}</span>
            <span className={`pvp-debrief__round-result ${r.result === 'WIN' ? 'pvp-debrief__round-result--win' : 'pvp-debrief__round-result--loss'}`}>
              {r.result}
            </span>
          </div>
        ))}
      </div>

      <div className="pvp-debrief__awareness">
        <p className="pvp-debrief__awareness-label">Awareness Points Earned</p>
        <p className="pvp-debrief__awareness-value">+{awarenessAwarded || 0}</p>
      </div>

      <div className="pvp-debrief__actions">
        <button
          className="pvp-debrief__btn pvp-debrief__btn--primary"
          onClick={() => navigate('/game/pvp/squad')}
        >
          PLAY AGAIN
        </button>
        <button
          className="pvp-debrief__btn pvp-debrief__btn--secondary"
          onClick={() => navigate('/game')}
        >
          RETURN HOME
        </button>
      </div>
    </div>
  );
}
