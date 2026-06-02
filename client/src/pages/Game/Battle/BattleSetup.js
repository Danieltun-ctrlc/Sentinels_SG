import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CREATURES } from '../../../data/creatures';
import { ABILITIES } from '../../../data/abilities';
import { calculateStat } from '../../../engine/statCalculator';
import gameService from '../../../services/gameService';
import './BattleSetup.css';

export default function BattleSetup() {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'defender';

  const [creatures, setCreatures] = useState([]);
  const [selected, setSelected] = useState([]); // ordered array of creature_ids
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gameService.getCreatures().then(all => {
      // Filter by role
      const filtered = all.filter(c => {
        const def = CREATURES[c.creature_id];
        if (!def) return false;
        if (role === 'defender') return def.role === 'defender';
        return def.role === 'attacker';
      });
      setCreatures(filtered);
      setLoading(false);
    });
  }, [role]);

  const toggleSelect = (creatureId) => {
    if (selected.includes(creatureId)) {
      setSelected(selected.filter(id => id !== creatureId));
    } else {
      if (selected.length >= 2) return; // max 2
      setSelected([...selected, creatureId]);
    }
  };

  const moveUp = (creatureId) => {
    const idx = selected.indexOf(creatureId);
    if (idx <= 0) return;
    const newArr = [...selected];
    [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
    setSelected(newArr);
  };

  const handleDone = () => {
    if (selected.length === 0) return;
    navigate(`/game/pve/${missionId}/fight`, {
      state: { role, squad: selected }
    });
  };

  if (loading) {
    return <div className="battle-setup"><p style={{ color: 'var(--color-text-muted)' }}>Loading squad...</p></div>;
  }

  return (
    <div className="battle-setup">
      <div className="battle-setup__header">
        <h2 className="battle-setup__title">BATTLE SETUP</h2>
        <p className="battle-setup__subtitle">
          {role === 'defender'
            ? 'Choose your Defenders. First creature leads the battle.'
            : 'Choose your Attackers. First creature leads the assault.'}
        </p>
      </div>

      {/* Creature List */}
      <div className="battle-setup__list">
        {creatures.map(c => {
          const def = CREATURES[c.creature_id];
          if (!def) return null;
          const isSelected = selected.includes(c.creature_id);
          const orderNum = selected.indexOf(c.creature_id) + 1;
          const hp = calculateStat('hp', def, c);

          return (
            <div
              key={c.creature_id}
              className={`battle-setup__card ${isSelected ? 'battle-setup__card--selected' : ''}`}
              onClick={() => toggleSelect(c.creature_id)}
            >
              <div className="battle-setup__card-left">
                <div className="battle-setup__sprite">
                  {def.sprite ? (
                    <img src={def.sprite} alt={def.name} className="battle-setup__sprite-img" />
                  ) : (
                    <span className="battle-setup__sprite-emoji">🛡️</span>
                  )}
                </div>
                <div className="battle-setup__info">
                  <span className="battle-setup__name">{def.name}</span>
                  <span className="battle-setup__meta">
                    <span className="battle-setup__ability">{ABILITIES[def.abilities.default]?.name || def.abilities.default}</span>
                  </span>
                  <span className="battle-setup__level">Lv. {c.level || 50}</span>
                </div>
              </div>
              <div className="battle-setup__card-right">
                <div className="battle-setup__hp">
                  <div className="battle-setup__hp-bar">
                    <div className="battle-setup__hp-fill" style={{ width: '100%' }}></div>
                  </div>
                  <span className="battle-setup__hp-text">{hp}/{hp}</span>
                </div>
                {isSelected && (
                  <div className="battle-setup__order">
                    <span className={`battle-setup__order-badge ${orderNum === 1 ? 'battle-setup__order-badge--first' : ''}`}>
                      {orderNum === 1 ? 'First' : 'Second'}
                    </span>
                    {orderNum === 2 && (
                      <button className="battle-setup__reorder" onClick={(e) => { e.stopPropagation(); moveUp(c.creature_id); }}>
                        ↑
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="battle-setup__footer">
        <div className="battle-setup__count">
          <span className="battle-setup__count-icon">▶</span>
          <span className="battle-setup__count-text">{selected.length} / 2</span>
        </div>
        <button
          className="battle-setup__done-btn"
          onClick={handleDone}
          disabled={selected.length === 0}
        >
          Done
        </button>
      </div>
    </div>
  );
}
