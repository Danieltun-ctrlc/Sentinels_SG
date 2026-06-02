import './TypeBadge.css';

const TYPE_COLORS = {
  logic: 'cyan',
  forensic: 'purple',
  network: 'green',
  armor: 'gold',
  phantom: 'magenta',
  illusion: 'purple',
  toxic: 'red',
  coercion: 'amber',
};

export default function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || 'cyan';

  return (
    <span className={`type-badge type-badge--${color}`}>
      {type?.toUpperCase()}
    </span>
  );
}
