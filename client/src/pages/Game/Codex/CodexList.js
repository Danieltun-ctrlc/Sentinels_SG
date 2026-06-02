import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CREATURES } from '../../../data/creatures';
import gameService from '../../../services/gameService';
import './CodexList.css';

const DEFENDER_TYPES = ['ALL TYPES', 'LOGIC', 'FORENSIC', 'NETWORK', 'ARMOR'];
const ATTACKER_TYPES = ['ALL TYPES', 'PHANTOM', 'ILLUSION', 'TOXIC', 'COERCION'];

const UNLOCK_HINTS = {
  cryptochel: 'Complete OCBC Incident Mission',
  syncarya: 'Complete SingHealth Breach Mission',
  tracehound: 'Unlock via Network Cert Module',
  deepweaver: 'Unlock via gameplay',
  silencer: 'Unlock via gameplay',
};

export default function CodexList() {
  const [ownedCreatures, setOwnedCreatures] = useState([]);
  const [activeTab, setActiveTab] = useState('DEFENDERS');
  const [typeFilter, setTypeFilter] = useState('ALL TYPES');
  const [selectedCreature, setSelectedCreature] = useState(null);

  useEffect(() => {
    gameService.getCreatures()
      .then((creatures) => setOwnedCreatures(creatures))
      .catch(() => {});
  }, []);

  const ownedIds = new Set(ownedCreatures.map(c => c.creature_id));

  const allCreatures = Object.values(CREATURES);
  const defenders = allCreatures.filter(c => c.role === 'defender');
  const attackers = allCreatures.filter(c => c.role === 'attacker');

  const displayList = activeTab === 'DEFENDERS' ? defenders : attackers;
  const typeOptions = activeTab === 'DEFENDERS' ? DEFENDER_TYPES : ATTACKER_TYPES;
  const filtered = typeFilter === 'ALL TYPES'
    ? displayList
    : displayList.filter(c => c.type.toUpperCase() === typeFilter);

  // Reset type filter when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTypeFilter('ALL TYPES');
    // Select first owned creature of that role
    const list = tab === 'DEFENDERS' ? defenders : attackers;
    const firstOwned = list.find(c => ownedIds.has(c.id));
    setSelectedCreature(firstOwned || null);
  };

  // Set first owned creature as selected by default
  useEffect(() => {
    if (!selectedCreature && ownedIds.size > 0) {
      const firstOwned = defenders.find(c => ownedIds.has(c.id));
      if (firstOwned) setSelectedCreature(firstOwned);
    }
  }, [ownedCreatures]); // eslint-disable-line

  return (
    <div className="codex">
      {/* Header */}
      <div className="codex__header">
        <div className="codex__header-left">
          <Link to="/game" className="codex__back">· HOME</Link>
          <h2 className="codex__title">CODEX</h2>
        </div>
        <div className="codex__header-right">
          <span className="codex__count">{ownedIds.size} / {allCreatures.length} ENTRIES</span>
          <div className="codex__count-bar">
            <div className="codex__count-fill" style={{ width: `${(ownedIds.size / allCreatures.length) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="codex__tabs">
        {['DEFENDERS', 'ATTACKERS'].map(tab => (
          <button
            key={tab}
            className={`codex__tab ${activeTab === tab ? 'codex__tab--active' : ''} ${tab === 'ATTACKERS' ? 'codex__tab--attacker' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="codex__filters">
        {typeOptions.map(type => (
          <button
            key={type}
            className={`codex__filter-btn ${typeFilter === type ? 'codex__filter-btn--active' : ''}`}
            onClick={() => setTypeFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Featured / Selected Creature */}
      {selectedCreature && ownedIds.has(selectedCreature.id) && selectedCreature.role === (activeTab === 'DEFENDERS' ? 'defender' : 'attacker') && (
        <div className={`codex__featured ${activeTab === 'ATTACKERS' ? 'codex__featured--attacker' : ''}`}>
          <div className="codex__featured-sprite">
            {selectedCreature.sprite ? (
              <img src={selectedCreature.sprite} alt={selectedCreature.name} className="codex__featured-img" />
            ) : (
              <span className="codex__featured-placeholder">🛡️</span>
            )}
          </div>
          <div className="codex__featured-info">
            <span className="codex__featured-tier">TIER {selectedCreature.tier} {selectedCreature.role === 'attacker' ? 'ATTACKER' : 'DEFENDER'}</span>
            <h3 className="codex__featured-name">{selectedCreature.name.toUpperCase()}</h3>
            <p className="codex__featured-title">{selectedCreature.title}</p>
            <span className={`codex__type-badge codex__type-badge--${selectedCreature.type}`}>
              {selectedCreature.type.toUpperCase()}
            </span>
            <p className="codex__featured-lore">{selectedCreature.lore}</p>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className={`codex__grid ${activeTab === 'ATTACKERS' ? 'codex__grid--attacker' : ''}`}>
        {filtered.map((creature, index) => {
          const isOwned = ownedIds.has(creature.id);
          return (
            <div
              key={creature.id}
              className={`codex__card ${isOwned ? 'codex__card--owned' : 'codex__card--locked'}`}
              onClick={() => isOwned && setSelectedCreature(creature)}
            >
              {isOwned && <span className="codex__card-check">✓</span>}
              <div className="codex__card-sprite">
                {isOwned && creature.sprite ? (
                  <img src={creature.sprite} alt={creature.name} className="codex__card-img" />
                ) : (
                  <span className="codex__card-mystery">?</span>
                )}
              </div>
              <h4 className="codex__card-name">
                {isOwned ? creature.name.toUpperCase() : '??????????'}
              </h4>
              <span className={`codex__type-badge codex__type-badge--${isOwned ? creature.type : 'unknown'}`}>
                {isOwned ? creature.type.toUpperCase() : 'TYPE: ???'}
              </span>
              <p className="codex__card-subtitle">
                {isOwned ? creature.title : (UNLOCK_HINTS[creature.id] || 'Unlock via gameplay')}
              </p>
              <span className="codex__card-number">#{String(index + 1).padStart(3, '0')}</span>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="codex__footer-hint">
        Click any unlocked entry to view full lore and move pool. Locked entries reveal through gameplay and training.
      </p>
    </div>
  );
}
