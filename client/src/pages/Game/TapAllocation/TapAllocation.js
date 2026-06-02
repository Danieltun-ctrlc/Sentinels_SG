import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CREATURES } from '../../../data/creatures';
import { MOVES } from '../../../data/moves';
import { ABILITIES } from '../../../data/abilities';
import { calculateStat, TAP_LIMITS } from '../../../engine/statCalculator';
import { useAuth } from '../../../context/AuthContext';
import gameService from '../../../services/gameService';
import { playTapAllocate, playSuccess, playClick } from '../../../utils/synthSounds';
import './TapAllocation.css';

const STAT_LABELS = {
  hp: 'HP — DATA INTEGRITY',
  atk: 'ATK — MITIGATION STRENGTH',
  def: 'DEF — FIREWALL',
  spd: 'SPD — PROCESSING RATE',
};

export default function TapAllocation() {
  const { user, refreshUser } = useAuth();
  const [creatures, setCreatures] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [pending, setPending] = useState({ hp: 0, atk: 0, def: 0, spd: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    gameService.getCreatures().then(c => {
      setCreatures(c);
      if (c.length > 0) setSelectedId(c[0].creature_id);
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      gameService.getCreatureDetail(selectedId).then(setDetail);
      setPending({ hp: 0, atk: 0, def: 0, spd: 0 });
      setMessage('');
    }
  }, [selectedId]);

  if (!detail) return <div className="tap"><p style={{ color: 'var(--color-text-muted)' }}>Loading...</p></div>;

  const creatureDef = CREATURES[selectedId];
  const uc = detail.creature;
  const totalPending = pending.hp + pending.atk + pending.def + pending.spd;
  const availableAfterPending = (user?.available_tap || 0) - totalPending;

  const getTotalInvested = () =>
    (uc.hp_invested || 0) + (uc.atk_invested || 0) + (uc.def_invested || 0) + (uc.spd_invested || 0) + totalPending;

  const getEffective = (stat) => {
    const mock = { ...uc, [`${stat}_invested`]: (uc[`${stat}_invested`] || 0) + pending[stat], level: uc.level || 50 };
    return calculateStat(stat, creatureDef, mock);
  };

  const handleIncrement = (stat) => {
    const currentInvested = (uc[`${stat}_invested`] || 0) + pending[stat];
    if (currentInvested >= TAP_LIMITS.perStat) { setMessage(`Max ${TAP_LIMITS.perStat} per stat`); return; }
    if (getTotalInvested() >= TAP_LIMITS.perCreature) { setMessage(`Max ${TAP_LIMITS.perCreature} per creature`); return; }
    // Check category-specific TAP
    const categoryAvailable = (user?.[`${stat}_tap`] || 0) - pending[stat];
    if (categoryAvailable <= 0) { setMessage(`No ${stat.toUpperCase()} TAP available`); return; }
    setPending(p => ({ ...p, [stat]: p[stat] + 1 }));
    playTapAllocate();
    setMessage('');
  };

  const handleDecrement = (stat) => {
    if (pending[stat] <= 0) return;
    setPending(p => ({ ...p, [stat]: p[stat] - 1 }));
    setMessage('');
  };

  const handleSave = async () => {
    if (totalPending === 0) return;
    setSaving(true);
    try {
      await gameService.allocateTap({ creatureId: selectedId, ...pending });
      await refreshUser();
      const fresh = await gameService.getCreatureDetail(selectedId);
      setDetail(fresh);
      setPending({ hp: 0, atk: 0, def: 0, spd: 0 });
      setMessage('✓ TAP allocated successfully!');
      playSuccess();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await gameService.resetCreatureTap({ creatureId: selectedId });
      await refreshUser();
      const fresh = await gameService.getCreatureDetail(selectedId);
      setDetail(fresh);
      setPending({ hp: 0, atk: 0, def: 0, spd: 0 });
      setMessage('✓ All TAP refunded!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    }
    setSaving(false);
  };

  const handleAbilitySelect = async (abilityId) => {
    try {
      await gameService.setActiveAbility({ creatureId: selectedId, abilityId });
      const fresh = await gameService.getCreatureDetail(selectedId);
      setDetail(fresh);
      setMessage('✓ Ability set!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Ability not unlocked');
    }
  };

  const handleEquipMove = async (moveId) => {
    const current = detail.equippedMoves.map(m => m.moveId);
    let updated;
    if (current.includes(moveId)) {
      updated = current.filter(id => id !== moveId);
      if (updated.length === 0) { setMessage('Must have at least 1 move'); return; }
    } else {
      if (current.length >= 4) { setMessage('Max 4 moves equipped'); return; }
      updated = [...current, moveId];
    }
    try {
      await gameService.equipMoves({ creatureId: selectedId, moves: updated });
      const fresh = await gameService.getCreatureDetail(selectedId);
      setDetail(fresh);
      setMessage('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    }
  };

  const equippedSet = new Set(detail.equippedMoves.map(m => m.moveId));

  return (
    <div className="tap">
      {/* Header */}
      <div className="tap__header">
        <div className="tap__header-left">
          <Link to="/game" className="tap__back">· HOME</Link>
          <h2 className="tap__title">TAP ALLOCATION</h2>
        </div>
      </div>

      {/* TAP Wallet */}
      <div className="tap__wallet">
        <div className="tap__wallet-item tap__wallet-item--total">
          <span className="tap__wallet-label">TOTAL AVAILABLE</span>
          <span className="tap__wallet-value">{availableAfterPending}</span>
        </div>
        <div className="tap__wallet-item">
          <span className="tap__wallet-label">HP TAP</span>
          <span className="tap__wallet-value">{(user?.hp_tap || 0) - pending.hp}</span>
        </div>
        <div className="tap__wallet-item">
          <span className="tap__wallet-label">ATK TAP</span>
          <span className="tap__wallet-value">{(user?.atk_tap || 0) - pending.atk}</span>
        </div>
        <div className="tap__wallet-item">
          <span className="tap__wallet-label">DEF TAP</span>
          <span className="tap__wallet-value">{(user?.def_tap || 0) - pending.def}</span>
        </div>
        <div className="tap__wallet-item">
          <span className="tap__wallet-label">SPD TAP</span>
          <span className="tap__wallet-value">{(user?.spd_tap || 0) - pending.spd}</span>
        </div>
      </div>

      {/* Creature Selector */}
      <div className="tap__squad-header">· MY SQUAD ({creatures.length} / 12)</div>
      <div className="tap__squad">
        {creatures.map(c => {
          const def = CREATURES[c.creature_id];
          const totalInv = (c.hp_invested || 0) + (c.atk_invested || 0) + (c.def_invested || 0) + (c.spd_invested || 0);
          return (
            <div
              key={c.creature_id}
              className={`tap__squad-card ${selectedId === c.creature_id ? 'tap__squad-card--active' : ''}`}
              onClick={() => setSelectedId(c.creature_id)}
            >
              <span className="tap__squad-name">{def?.name || c.creature_id}</span>
              <span className="tap__squad-type">{def?.type?.toUpperCase()}</span>
              <span className="tap__squad-tap">{totalInv} / {TAP_LIMITS.perCreature} TAP</span>
              <span className="tap__squad-level">Lv. {c.level || 1}</span>
            </div>
          );
        })}
      </div>

      {message && <div className="tap__message">{message}</div>}

      {/* Main Content */}
      <div className="tap__main">
        {/* Left: Creature + Stats */}
        <div className="tap__left">
          <div className="tap__creature-card">
            <div className="tap__sprite-box">
              {creatureDef?.sprite ? (
                <img src={creatureDef.sprite} alt={creatureDef.name} className="tap__sprite-img" />
              ) : (
                <span className="tap__sprite-placeholder">🛡️</span>
              )}
            </div>
            <h3 className="tap__creature-name">{creatureDef?.name?.toUpperCase()}</h3>
            <span className="tap__creature-meta">{creatureDef?.type?.toUpperCase()} · Lv. {uc.level || 1}</span>
            <span className="tap__creature-ability">Ability: {ABILITIES[detail.activeAbility]?.name || detail.activeAbility}</span>
          </div>

          <div className="tap__allocated-header">
            <span>{getTotalInvested()} / {TAP_LIMITS.perCreature} ALLOCATED</span>
          </div>

          {/* Stat Rows */}
          <div className="tap__stats">
            {['hp', 'atk', 'def', 'spd'].map(stat => {
              const base = creatureDef?.baseStats[stat] || 0;
              const invested = (uc[`${stat}_invested`] || 0);
              const pendingVal = pending[stat];
              const effective = getEffective(stat);
              // Bar: full width = 252 (max investable). Green = base/252, Yellow = invested/252
              const greenPct = Math.min(50, (base / 252) * 100); // cap green at 50% so yellow has room
              const investedPct = (invested / 252) * (100 - greenPct);
              const pendingPctVal = (pendingVal / 252) * (100 - greenPct);
              // Ensure no overflow
              const yellowWidth = Math.min(100 - greenPct, investedPct);
              const pendingWidth = Math.min(100 - greenPct - yellowWidth, pendingPctVal);

              return (
                <div key={stat} className="tap__stat">
                  <div className="tap__stat-header">
                    <span className="tap__stat-label">{STAT_LABELS[stat]}</span>
                    <div className="tap__stat-values">
                      <span className="tap__stat-effective">{effective}</span>
                      {pendingVal > 0 && <span className="tap__stat-pending">+{pendingVal} ↑</span>}
                    </div>
                  </div>
                  <div className="tap__stat-bar">
                    <div className="tap__stat-bar-base" style={{ width: `${greenPct}%` }}></div>
                    {invested > 0 && (
                      <div className="tap__stat-bar-invested" style={{ left: `${greenPct}%`, width: `${yellowWidth}%` }}></div>
                    )}
                    {pendingVal > 0 && (
                      <div className="tap__stat-bar-pending" style={{ left: `${greenPct + yellowWidth}%`, width: `${pendingWidth}%` }}></div>
                    )}
                  </div>
                  <div className="tap__stat-footer">
                    <span className="tap__stat-alloc">{invested + pendingVal} / 252 TAP allocated</span>
                    <div className="tap__stat-controls">
                      <button className="tap__ctrl-btn" onClick={() => handleDecrement(stat)} disabled={pendingVal <= 0}>−</button>
                      <button className="tap__ctrl-btn tap__ctrl-btn--plus" onClick={() => handleIncrement(stat)}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="tap__actions">
            <button className="tap__action-link" onClick={handleReset} disabled={saving}>Reset Allocation</button>
            <button className="tap__action-btn" onClick={handleSave} disabled={saving || totalPending === 0}>Save & Apply</button>
          </div>
        </div>

        {/* Right: Abilities + Moves */}
        <div className="tap__right">
          <h3 className="tap__section-title">· ABILITIES</h3>
          <div className="tap__abilities">
            {[creatureDef?.abilities?.default, creatureDef?.abilities?.hidden].filter(Boolean).map(abilityId => {
              const ability = ABILITIES[abilityId];
              if (!ability) return null;
              const isUnlocked = detail.unlockedAbilities.includes(abilityId);
              const isActive = detail.activeAbility === abilityId;
              return (
                <div
                  key={abilityId}
                  className={`tap__ability ${isActive ? 'tap__ability--active' : ''} ${!isUnlocked ? 'tap__ability--locked' : ''}`}
                  onClick={() => isUnlocked && handleAbilitySelect(abilityId)}
                >
                  <span className="tap__ability-tag">{abilityId === creatureDef.abilities.default ? 'DEFAULT' : 'HIDDEN'}</span>
                  <span className="tap__ability-name">{ability.name.toUpperCase()}</span>
                  <span className="tap__ability-desc">{ability.description}</span>
                  {!isUnlocked && <span className="tap__ability-lock">🔒 LOCKED</span>}
                </div>
              );
            })}
          </div>

          <h3 className="tap__section-title">· MOVE POOL <span className="tap__move-count">{detail.equippedMoves.length} / 4 EQUIPPED</span></h3>
          <div className="tap__moves">
            {detail.unlockedMoves.map(moveId => {
              const move = MOVES[moveId];
              if (!move) return null;
              const isEquipped = equippedSet.has(moveId);
              return (
                <div
                  key={moveId}
                  className={`tap__move ${isEquipped ? 'tap__move--equipped' : ''}`}
                  onClick={() => handleEquipMove(moveId)}
                >
                  <div className="tap__move-top">
                    <span className="tap__move-name">{move.name.toUpperCase()}</span>
                    {isEquipped && <span className="tap__move-dot"></span>}
                  </div>
                  <span className="tap__move-meta">{move.type} · {move.category} · PP {move.pp}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
