import { MOVES } from '../../data/moves';
import { playMoveSelect } from '../../utils/synthSounds';
import './MoveSelector.css';

const TYPE_COLORS = {
  logic: '#00D9FF',
  forensic: '#10F981',
  network: '#3B82F6',
  armor: '#C0C8D6',
  phantom: '#FF2E63',
  illusion: '#9333EA',
  toxic: '#A3E635',
  coercion: '#F97316',
};

const TYPE_LABELS = {
  logic: 'LOGIC',
  forensic: 'FORENSIC',
  network: 'NETWORK',
  armor: 'ARMOR',
  phantom: 'PHANTOM',
  illusion: 'ILLUSION',
  toxic: 'TOXIC',
  coercion: 'COERCION',
};

export default function MoveSelector({ moves, pp, onSelect, disabled, onHover }) {
  return (
    <div className="move-selector">
      {moves.map((moveId) => {
        const move = MOVES[moveId];
        if (!move) return null;
        const remaining = pp[moveId] ?? 0;
        const isEmpty = remaining <= 0;
        const isLowPp = remaining > 0 && remaining <= 2;
        const color = TYPE_COLORS[move.type] || '#00D9FF';

        const classes = [
          'move-selector__btn',
          isEmpty ? 'move-selector__btn--empty' : '',
          isLowPp ? 'move-selector__btn--low-pp' : '',
        ].filter(Boolean).join(' ');

        const ppClass = isEmpty ? 'move-selector__pp--depleted' : isLowPp ? 'move-selector__pp--low' : '';

        return (
          <button
            key={moveId}
            className={classes}
            onClick={() => { playMoveSelect(); onSelect(moveId); }}
            onMouseEnter={() => onHover && onHover(moveId)}
            onMouseLeave={() => onHover && onHover(null)}
            disabled={disabled || isEmpty}
            style={{ '--type-color': color, '--type-glow': `${color}40` }}
          >
            {/* Top accent bar */}
            <span className="move-selector__accent" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}></span>
            {/* Corner brackets */}
            <span className="move-selector__corner move-selector__corner--tl"></span>
            <span className="move-selector__corner move-selector__corner--tr"></span>
            <span className="move-selector__corner move-selector__corner--bl"></span>
            <span className="move-selector__corner move-selector__corner--br"></span>
            {/* Content */}
            <div className="move-selector__content">
              <div className="move-selector__top-row">
                <span className="move-selector__name">{move.name}</span>
                <span className="move-selector__type-badge" style={{ background: `${color}22`, borderColor: `${color}66`, color }}>
                  {TYPE_LABELS[move.type] || move.type.toUpperCase()}
                </span>
              </div>
              <div className="move-selector__bottom-row">
                <span className="move-selector__category">
                  <span className={`move-selector__cat-dot move-selector__cat-dot--${move.category}`}></span>
                  {move.category === 'attack' ? 'ATTACK' : 'STATUS'}
                </span>
                <span className={`move-selector__pp ${ppClass}`}>
                  ↻ PP {remaining}/{move.pp}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
