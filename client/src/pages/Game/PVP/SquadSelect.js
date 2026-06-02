import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CREATURES } from '../../../data/creatures';
import api from '../../../services/api';
import './SquadSelect.css';

export default function SquadSelect() {
  const navigate = useNavigate();
  const [ownedCreatures, setOwnedCreatures] = useState([]);
  const [defenders, setDefenders] = useState([null, null]);
  const [attackers, setAttackers] = useState([null, null]);
  const [activeTab, setActiveTab] = useState('defenders');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCreatures() {
      try {
        const res = await api.get('/game/creatures');
        setOwnedCreatures(res.data.creatures || []);
      } catch (err) {
        setError('Failed to load creatures');
      }
    }
    fetchCreatures();
  }, []);

  const selectedIds = [...defenders, ...attackers].filter(Boolean);

  const filteredCreatures = ownedCreatures.filter(c => {
    const def = CREATURES[c.creature_id];
    if (!def) return false;
    if (activeTab === 'defenders') return def.role === 'defender';
    return def.role === 'attacker';
  });

  function handleCreatureClick(creatureId) {
    if (selectedIds.includes(creatureId)) return;

    if (activeTab === 'defenders') {
      const emptyIdx = defenders.findIndex(d => d === null);
      if (emptyIdx === -1) return;
      const next = [...defenders];
      next[emptyIdx] = creatureId;
      setDefenders(next);
    } else {
      const emptyIdx = attackers.findIndex(a => a === null);
      if (emptyIdx === -1) return;
      const next = [...attackers];
      next[emptyIdx] = creatureId;
      setAttackers(next);
    }
  }

  function removeDefender(idx) {
    const next = [...defenders];
    next[idx] = null;
    setDefenders(next);
  }

  function removeAttacker(idx) {
    const next = [...attackers];
    next[idx] = null;
    setAttackers(next);
  }

  const squadFull = defenders.every(Boolean) && attackers.every(Boolean);

  async function handleFindMatch() {
    if (!squadFull) return;
    setLoading(true);
    setError('');

    try {
      // Save squad
      await api.post('/pvp/squad', {
        defenders: defenders,
        attackers: attackers,
      });

      // Find match
      const res = await api.post('/pvp/find-match');
      const { matchId, opponent } = res.data;

      navigate('/game/pvp/matchmaking', {
        state: {
          squad: { defenders, attackers },
          opponent,
          matchId,
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find match');
      setLoading(false);
    }
  }

  function renderSlot(creatureId, type, idx) {
    const def = creatureId ? CREATURES[creatureId] : null;
    const filled = !!creatureId;

    return (
      <div
        key={`${type}-${idx}`}
        className={`squad-slot squad-slot--${type} ${filled ? 'squad-slot--filled' : ''}`}
      >
        <span className="squad-slot__label">{type} {idx + 1}</span>
        {filled && def ? (
          <>
            <img className="squad-slot__sprite" src={def.sprite} alt={def.name} />
            <span className="squad-slot__name">{def.name}</span>
            <span className="squad-slot__type">{def.type}</span>
            <button
              className="squad-slot__remove"
              onClick={() => type === 'defender' ? removeDefender(idx) : removeAttacker(idx)}
            >
              ×
            </button>
          </>
        ) : (
          <span className="squad-slot__empty-icon">+</span>
        )}
      </div>
    );
  }

  return (
    <div className="squad-select animate-fade-in">
      <h1 className="squad-select__title">SELECT YOUR SQUAD</h1>

      <div className="squad-select__slots">
        {defenders.map((d, i) => renderSlot(d, 'defender', i))}
        {attackers.map((a, i) => renderSlot(a, 'attacker', i))}
      </div>

      <div className="squad-select__tabs">
        <button
          className={`squad-tab squad-tab--defenders ${activeTab === 'defenders' ? 'squad-tab--active' : ''}`}
          onClick={() => setActiveTab('defenders')}
        >
          DEFENDERS
        </button>
        <button
          className={`squad-tab squad-tab--attackers ${activeTab === 'attackers' ? 'squad-tab--active' : ''}`}
          onClick={() => setActiveTab('attackers')}
        >
          ATTACKERS
        </button>
      </div>

      <div className="squad-select__grid">
        {filteredCreatures.map(c => {
          const def = CREATURES[c.creature_id];
          if (!def) return null;
          const isSelected = selectedIds.includes(c.creature_id);
          return (
            <div
              key={c.creature_id}
              className={`squad-creature-card ${isSelected ? 'squad-creature-card--selected' : ''}`}
              onClick={() => handleCreatureClick(c.creature_id)}
            >
              <img className="squad-creature-card__sprite" src={def.sprite} alt={def.name} />
              <span className="squad-creature-card__name">{def.name}</span>
              <span className="squad-creature-card__role">{def.type}</span>
            </div>
          );
        })}
      </div>

      {error && <p className="squad-select__loading" style={{ color: 'var(--color-red)' }}>{error}</p>}

      <div className="squad-select__actions">
        {loading ? (
          <p className="squad-select__loading">Searching for opponent...</p>
        ) : (
          <button
            className="squad-select__find-btn"
            disabled={!squadFull}
            onClick={handleFindMatch}
          >
            FIND MATCH
          </button>
        )}
      </div>
    </div>
  );
}
