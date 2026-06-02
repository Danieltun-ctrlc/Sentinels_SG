import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Matchmaking.css';

const TERMINAL_MESSAGES = [
  '> Scanning network for opponents...',
  '> Querying awareness database...',
  '> Matching threat profiles...',
  '> Evaluating squad compositions...',
  '> Checking latency routes...',
  '> Verifying opponent credentials...',
  '> Establishing secure channel...',
  '> Calibrating battle parameters...',
];

export default function Matchmaking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { squad, opponent, matchId } = location.state || {};

  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [found, setFound] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!squad || !opponent) {
      navigate('/game/pvp/squad', { replace: true });
      return;
    }

    // Progress bar: 0 → 100 over 4 seconds
    const startTime = Date.now();
    const duration = 4000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(timerRef.current);
        setFound(true);
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [squad, opponent, navigate]);

  // Cycle terminal messages
  useEffect(() => {
    if (found) return;
    const interval = setInterval(() => {
      setMessageIdx(prev => (prev + 1) % TERMINAL_MESSAGES.length);
    }, 800);
    return () => clearInterval(interval);
  }, [found]);

  // Navigate after found
  useEffect(() => {
    if (!found) return;
    const timeout = setTimeout(() => {
      navigate('/game/pvp/reveal', {
        state: { squad, opponent, matchId },
      });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [found, navigate, squad, opponent, matchId]);

  return (
    <div className="matchmaking animate-fade-in">
      <h2 className="matchmaking__status">MATCHMAKING</h2>

      <div className="matchmaking__radar" />

      <div className="matchmaking__progress-wrap">
        <p className="matchmaking__progress-label">
          {found ? 'MATCH FOUND' : `Searching... ${Math.floor(progress)}%`}
        </p>
        <div className="matchmaking__progress-bar">
          <div
            className="matchmaking__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="matchmaking__terminal">
        {found ? (
          <span className="matchmaking__found">OPPONENT FOUND!</span>
        ) : (
          <span className="matchmaking__terminal-text" key={messageIdx}>
            {TERMINAL_MESSAGES[messageIdx]}
          </span>
        )}
      </div>
    </div>
  );
}
