import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TYPE_CHART } from '../../../data/typeChart';
import { MOVES } from '../../../data/moves';
import { ABILITIES } from '../../../data/abilities';
import { GLOSSARY } from '../../../data/glossary';
import './Dictionary.css';

const TYPES = ['logic', 'forensic', 'network', 'armor', 'phantom', 'illusion', 'toxic', 'coercion'];
const TYPE_COLORS = {
  logic: 'var(--color-cyan)', forensic: 'var(--color-purple)', network: 'var(--color-green)',
  armor: 'var(--color-gold)', phantom: 'var(--color-magenta)', illusion: 'var(--color-purple)',
  toxic: 'var(--color-red)', coercion: 'var(--color-amber)',
};

const TYPE_EXPLANATIONS = [
  { atk: 'forensic', def: 'phantom', mult: '2×', why: 'Forensic investigation exposes phantom scams — verification destroys fake identities.' },
  { atk: 'network', def: 'coercion', mult: '2×', why: 'Community networks break isolation — coercion fails when victims have support.' },
  { atk: 'armor', def: 'toxic', mult: '2×', why: 'Strong security defences neutralize toxic harassment — encrypted systems ignore trolls.' },
  { atk: 'toxic', def: 'logic', mult: '2×', why: 'Emotional manipulation overwhelms logical thinking — outrage bypasses reason.' },
  { atk: 'coercion', def: 'logic', mult: '2×', why: 'Fear and threats shut down critical thinking — panic overrides logic.' },
  { atk: 'phantom', def: 'armor', mult: '2×', why: 'Phishing bypasses technical defences by targeting the human, not the system.' },
  { atk: 'logic', def: 'toxic', mult: '0.5×', why: 'Logic alone struggles against emotional manipulation — trolls feed on rational engagement.' },
  { atk: 'logic', def: 'coercion', mult: '0.5×', why: 'Reasoning with a coercer is ineffective — they exploit fear, not facts.' },
  { atk: 'armor', def: 'phantom', mult: '0.5×', why: 'Technical defences miss social engineering — firewalls cannot block a convincing lie.' },
  { atk: 'network', def: 'coercion', mult: '2×', why: 'Reporting to authorities and community breaks the silence coercion depends on.' },
];

const TABS = ['TYPE CHART', 'MOVES', 'ABILITIES', 'GLOSSARY'];
const GLOSSARY_CATS = ['all', 'attack', 'defence', 'mechanic', 'status'];

export default function Dictionary() {
  const [activeTab, setActiveTab] = useState('TYPE CHART');
  const [moveFilter, setMoveFilter] = useState('all');
  const [glossaryCat, setGlossaryCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCell, setHoveredCell] = useState(null);

  const allMoves = Object.values(MOVES);
  const allAbilities = Object.values(ABILITIES);
  const filteredMoves = allMoves.filter(m => {
    if (moveFilter !== 'all' && m.type !== moveFilter) return false;
    if (searchTerm && !m.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredGlossary = GLOSSARY.filter(g => {
    if (glossaryCat !== 'all' && g.category !== glossaryCat) return false;
    if (searchTerm && !g.term.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dict">
      <div className="dict__header">
        <div>
          <Link to="/game" className="dict__back">· HOME</Link>
          <h2 className="dict__title">DICTIONARY</h2>
        </div>
      </div>

      <div className="dict__tabs">
        {TABS.map(tab => (
          <button key={tab} className={`dict__tab ${activeTab === tab ? 'dict__tab--active' : ''}`}
            onClick={() => { setActiveTab(tab); setSearchTerm(''); }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ===== TYPE CHART ===== */}
      {activeTab === 'TYPE CHART' && (
        <div className="dict__type-section animate-fade-in">
          <div className="dict__chart-legend">
            <span className="dict__legend-item dict__legend-item--super">● 2× SUPER EFFECTIVE</span>
            <span className="dict__legend-item dict__legend-item--neutral">● 1× NEUTRAL</span>
            <span className="dict__legend-item dict__legend-item--resist">● 0.5× NOT VERY EFFECTIVE</span>
          </div>

          <div className="dict__chart-scroll">
            <table className="dict__chart-table">
              <thead>
                <tr>
                  <th className="dict__chart-corner">ATK ↓ / DEF →</th>
                  {TYPES.map(t => (
                    <th key={t} className="dict__chart-th" style={{ color: TYPE_COLORS[t] }}>{t.slice(0, 4).toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPES.map((atkType, ri) => (
                  <tr key={atkType} style={{ animationDelay: `${ri * 0.05}s` }} className="dict__chart-row">
                    <td className="dict__chart-label" style={{ color: TYPE_COLORS[atkType] }}>{atkType.toUpperCase()}</td>
                    {TYPES.map(defType => {
                      const eff = TYPE_CHART[atkType]?.[defType] ?? 1;
                      let cellClass = 'dict__chart-cell';
                      if (eff >= 2) cellClass += ' dict__chart-cell--super';
                      else if (eff < 1) cellClass += ' dict__chart-cell--resist';
                      const isHovered = hoveredCell?.atk === atkType && hoveredCell?.def === defType;
                      return (
                        <td key={defType}
                          className={`${cellClass} ${isHovered ? 'dict__chart-cell--hovered' : ''}`}
                          onMouseEnter={() => setHoveredCell({ atk: atkType, def: defType, eff })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {eff === 1 ? '1×' : eff >= 2 ? '2×' : '½'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hoveredCell && (
            <div className="dict__chart-tooltip animate-fade-in">
              <span style={{ color: TYPE_COLORS[hoveredCell.atk] }}>{hoveredCell.atk.toUpperCase()}</span>
              <span className="dict__tooltip-arrow">→</span>
              <span style={{ color: TYPE_COLORS[hoveredCell.def] }}>{hoveredCell.def.toUpperCase()}</span>
              <span className="dict__tooltip-mult">= {hoveredCell.eff}×</span>
            </div>
          )}

          {/* Explanations */}
          <div className="dict__explanations">
            <h3 className="dict__section-title">· WHY THESE MATCHUPS?</h3>
            <p className="dict__section-subtitle">Every type advantage is rooted in real cybersecurity principles.</p>
            <div className="dict__explain-grid">
              {TYPE_EXPLANATIONS.map((exp, i) => (
                <div key={i} className="dict__explain-card" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="dict__explain-matchup">
                    <span className="dict__explain-type" style={{ color: TYPE_COLORS[exp.atk] }}>{exp.atk.toUpperCase()}</span>
                    <span className="dict__explain-arrow">→</span>
                    <span className="dict__explain-type" style={{ color: TYPE_COLORS[exp.def] }}>{exp.def.toUpperCase()}</span>
                    <span className={`dict__explain-mult ${exp.mult === '2×' ? 'dict__explain-mult--super' : 'dict__explain-mult--resist'}`}>{exp.mult}</span>
                  </div>
                  <p className="dict__explain-why">{exp.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== MOVES ===== */}
      {activeTab === 'MOVES' && (
        <div className="dict__moves animate-fade-in">
          <div className="dict__controls">
            <input className="dict__search" placeholder="Search moves..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div className="dict__filters">
              <button className={`dict__filter ${moveFilter === 'all' ? 'dict__filter--active' : ''}`} onClick={() => setMoveFilter('all')}>ALL</button>
              {TYPES.map(t => (
                <button key={t} className={`dict__filter ${moveFilter === t ? 'dict__filter--active' : ''}`}
                  style={moveFilter === t ? { color: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : {}}
                  onClick={() => setMoveFilter(t)}>{t.slice(0, 4).toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="dict__moves-grid">
            {filteredMoves.map((move, i) => (
              <div key={move.id} className="dict__move-card" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="dict__move-top">
                  <span className="dict__move-name">{move.name.toUpperCase()}</span>
                  <span className={`dict__move-cat dict__move-cat--${move.category}`}>{move.category}</span>
                </div>
                <div className="dict__move-stats">
                  <span className="dict__move-type" style={{ color: TYPE_COLORS[move.type] }}>{move.type.toUpperCase()}</span>
                  {move.power > 0 && <span className="dict__move-power">PWR {move.power}</span>}
                  <span className="dict__move-pp">PP {move.pp}</span>
                </div>
                <p className="dict__move-desc">{move.description}</p>
                {move.realMeaning && <p className="dict__move-real">↳ {move.realMeaning}</p>}
              </div>
            ))}
          </div>
          <p className="dict__count">{filteredMoves.length} moves found</p>
        </div>
      )}

      {/* ===== ABILITIES ===== */}
      {activeTab === 'ABILITIES' && (
        <div className="dict__abilities animate-fade-in">
          <div className="dict__abilities-grid">
            {allAbilities.map((ability, i) => (
              <div key={ability.id} className="dict__ability-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="dict__ability-trigger">{ability.trigger.replace('_', ' ').toUpperCase()}</span>
                <h4 className="dict__ability-name">{ability.name.toUpperCase()}</h4>
                <p className="dict__ability-desc">{ability.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== GLOSSARY ===== */}
      {activeTab === 'GLOSSARY' && (
        <div className="dict__glossary animate-fade-in">
          <div className="dict__controls">
            <input className="dict__search" placeholder="Search terms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div className="dict__filters">
              {GLOSSARY_CATS.map(cat => (
                <button key={cat} className={`dict__filter ${glossaryCat === cat ? 'dict__filter--active' : ''}`}
                  onClick={() => setGlossaryCat(cat)}>{cat.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="dict__glossary-list">
            {filteredGlossary.map((item, i) => (
              <div key={item.term} className="dict__glossary-item" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="dict__glossary-header">
                  <span className="dict__glossary-name">{item.term}</span>
                  <span className={`dict__glossary-cat dict__glossary-cat--${item.category}`}>{item.category}</span>
                </div>
                <p className="dict__glossary-def">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
