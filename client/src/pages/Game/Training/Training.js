import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TRAINING_MODULES } from '../../../data/trainingModules';
import { MOVES } from '../../../data/moves';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './Training.css';

export default function Training() {
  const { user, refreshUser } = useAuth();
  const [progress, setProgress] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [watching, setWatching] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/game/training/progress').then(r => setProgress(r.data.progress));
  }, []);

  const getStatus = (moduleId) => {
    const p = progress.find(p => p.module_id === moduleId);
    return p?.status || 'NOT_STARTED';
  };

  const startWatching = async (mod) => {
    setActiveModule(mod);
    setWatching(true);
    setWatchTime(0);
    setMessage('');

    // Mark as in progress
    await api.post('/game/training/start', { moduleId: mod.id });

    // Start timer
    timerRef.current = setInterval(() => {
      setWatchTime(prev => prev + 1);
    }, 1000);
  };

  const completeModule = async () => {
    clearInterval(timerRef.current);
    try {
      const { data } = await api.post('/game/training/complete', { moduleId: activeModule.id });
      if (data.alreadyCompleted) {
        setMessage('Already completed!');
      } else {
        const reward = activeModule.tapReward;
        setMessage(`✓ Completed! +${reward.amount} ${reward.category.toUpperCase()} TAP earned!${activeModule.moveUnlock ? ` Move unlocked: ${MOVES[activeModule.moveUnlock.move]?.name}!` : ''}`);
        await refreshUser();
      }
      // Refresh progress
      const { data: prog } = await api.get('/game/training/progress');
      setProgress(prog.progress);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    }
    setWatching(false);
    setActiveModule(null);
  };

  const cancelWatching = () => {
    clearInterval(timerRef.current);
    setWatching(false);
    setActiveModule(null);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const featured = TRAINING_MODULES.find(m => m.featured);

  return (
    <div className="training">
      {/* Header */}
      <div className="training__header">
        <div className="training__header-left">
          <Link to="/game" className="training__back">· HOME</Link>
          <h2 className="training__title">TRAINING MODULES</h2>
        </div>
        <div className="training__header-right">
          <span className="training__tap-info">AVAILABLE TAP: {user?.available_tap || 0}</span>
        </div>
      </div>

      {message && <div className="training__message">{message}</div>}

      {/* Video Player Overlay */}
      {watching && activeModule && (
        <div className="training__player">
          <div className="training__player-header">
            <span className="training__player-title">NOW WATCHING: {activeModule.title}</span>
            <button className="training__player-close" onClick={cancelWatching}>✕ CLOSE</button>
          </div>
          <div className="training__player-video">
            <div className="training__player-placeholder">
              <span className="training__player-icon">▶</span>
              <p className="training__player-source">{activeModule.source}</p>
              <a href={activeModule.videoUrl} target="_blank" rel="noopener noreferrer" className="training__player-link">
                Open source material →
              </a>
            </div>
          </div>
          <div className="training__player-footer">
            <span className="training__player-time">⏱ {formatTime(watchTime)} / {activeModule.duration}</span>
            <span className="training__player-hint">Watch the full video to earn rewards</span>
            {watchTime >= Math.min(activeModule.durationSec, 10) && (
              <button className="training__player-complete" onClick={completeModule}>
                ✓ MARK AS COMPLETE
              </button>
            )}
          </div>
        </div>
      )}

      {/* Featured Module */}
      {featured && !watching && (
        <div className="training__featured">
          <div className="training__featured-video">
            <span className="training__featured-play">▶</span>
            <span className="training__featured-duration">{featured.duration}</span>
          </div>
          <div className="training__featured-info">
            <div className="training__featured-tags">
              {featured.moveUnlock && <span className="training__featured-tag training__featured-tag--gold">★ MOVE UNLOCK</span>}
              {featured.premium && <span className="training__featured-tag training__featured-tag--purple">PREMIUM MODULE</span>}
            </div>
            <h3 className="training__featured-title">{featured.title.toUpperCase()}</h3>
            <p className="training__featured-source">Source: {featured.source}</p>
            <p className="training__featured-desc">{featured.description}</p>
            {featured.moveUnlock && (
              <p className="training__featured-unlock">· UNLOCK MOVE: {MOVES[featured.moveUnlock.move]?.name || featured.moveUnlock.move}</p>
            )}
            <button
              className="training__featured-btn"
              onClick={() => startWatching(featured)}
              disabled={getStatus(featured.id) === 'COMPLETED'}
            >
              {getStatus(featured.id) === 'COMPLETED' ? '✓ COMPLETED' : '· START MODULE'}
            </button>
          </div>
        </div>
      )}

      {/* Module Grid */}
      {!watching && (
        <div className="training__grid">
          {TRAINING_MODULES.filter(m => !m.featured).map(mod => {
            const status = getStatus(mod.id);
            return (
              <div key={mod.id} className={`training__card training__card--${status.toLowerCase().replace('_', '-')}`}>
                <div className="training__card-status">
                  <span className={`training__card-badge training__card-badge--${status.toLowerCase().replace('_', '-')}`}>
                    {status === 'COMPLETED' ? 'COMPLETED ✓' : status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'NEW'}
                  </span>
                </div>
                <div className="training__card-video">
                  <span className="training__card-play">▶</span>
                  <span className="training__card-duration">{mod.duration}</span>
                </div>
                <span className={`training__card-tap-badge training__card-tap-badge--${mod.tapReward.category}`}>
                  {mod.tapReward.category.toUpperCase()} TAP
                </span>
                <h4 className="training__card-title">{mod.title.toUpperCase()}</h4>
                <p className="training__card-source">Source: {mod.source}</p>
                <p className="training__card-reward">+{mod.tapReward.amount} {mod.tapReward.category.toUpperCase()} TAP</p>
                <button
                  className="training__card-btn"
                  onClick={() => startWatching(mod)}
                  disabled={status === 'COMPLETED'}
                >
                  {status === 'COMPLETED' ? 'DONE' : 'WATCH'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
