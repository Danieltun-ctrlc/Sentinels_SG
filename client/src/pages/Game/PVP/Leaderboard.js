import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './Leaderboard.css';

export default function Leaderboard() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/game/leaderboard');
        setPlayers(res.data.leaderboard || []);
      } catch (e) {
        console.error('Failed to load leaderboard:', e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) {
    return <div className="leaderboard"><p className="leaderboard__loading">Loading rankings...</p></div>;
  }

  return (
    <div className="leaderboard animate-fade-in">
      <h1 className="leaderboard__title">⭐ GLOBAL LEADERBOARD</h1>
      <p className="leaderboard__subtitle">Ranked by Awareness Points</p>

      <div className="leaderboard__table">
        <div className="leaderboard__header">
          <span className="leaderboard__col leaderboard__col--rank">#</span>
          <span className="leaderboard__col leaderboard__col--name">PLAYER</span>
          <span className="leaderboard__col leaderboard__col--tier">TIER</span>
          <span className="leaderboard__col leaderboard__col--score">AWARENESS</span>
        </div>

        {players.map((p, i) => {
          const isMe = user && p.id === user.id;
          const rank = i + 1;
          const medalClass = rank === 1 ? 'leaderboard__row--gold' : rank === 2 ? 'leaderboard__row--silver' : rank === 3 ? 'leaderboard__row--bronze' : '';

          return (
            <div key={p.id} className={`leaderboard__row ${medalClass} ${isMe ? 'leaderboard__row--me' : ''}`}>
              <span className="leaderboard__col leaderboard__col--rank">
                {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
              </span>
              <span className="leaderboard__col leaderboard__col--name">
                {p.display_name || p.username}
                {isMe && <span className="leaderboard__you-badge">YOU</span>}
              </span>
              <span className="leaderboard__col leaderboard__col--tier">{p.tier || 'Recruit'}</span>
              <span className="leaderboard__col leaderboard__col--score">{p.awareness_score?.toLocaleString()}</span>
            </div>
          );
        })}

        {players.length === 0 && (
          <p className="leaderboard__empty">No players yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
