import './CreatureDisplay.css';

export default function CreatureDisplay({ combatant, side, isAnimating }) {
  const hpPct = Math.max(0, (combatant.hp / combatant.maxHp) * 100);
  const hpColor = hpPct > 50 ? 'var(--color-green)' : hpPct > 25 ? 'var(--color-amber)' : 'var(--color-red)';
  const hpCritical = hpPct <= 25;

  return (
    <div className={`creature-display creature-display--${side} ${isAnimating ? 'creature-display--hit' : ''}`}>
      <div className="creature-display__info">
        <div className="creature-display__name">{combatant.name}</div>
        <div className="creature-display__level">Lv.{combatant.level}</div>
        <div className="creature-display__hp-bar">
          <div className="creature-display__hp-track">
            <div
              className={`creature-display__hp-fill ${hpCritical ? 'creature-display__hp-fill--critical' : ''}`}
              style={{ width: `${hpPct}%`, background: hpColor }}
            ></div>
          </div>
          <span className="creature-display__hp-text">{combatant.hp}/{combatant.maxHp}</span>
        </div>
      </div>
      <div className="creature-display__sprite-container">
        <div className="creature-display__sprite-placeholder">
          {(() => {
            const imgSrc = side === 'player'
              ? (combatant.spriteBack || combatant.sprite)
              : combatant.sprite;
            if (imgSrc) {
              return <img src={imgSrc} alt={combatant.name} className="creature-display__sprite-img" />;
            }
            return <span className="creature-display__sprite-emoji">{side === 'player' ? '🛡️' : '👾'}</span>;
          })()}
        </div>
      </div>
    </div>
  );
}
