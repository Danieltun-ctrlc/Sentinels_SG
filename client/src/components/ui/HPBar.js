import './HPBar.css';

export default function HPBar({ current, max, label, size = 'md' }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const status = pct > 50 ? 'healthy' : pct > 25 ? 'warning' : 'critical';

  return (
    <div className={`hp-bar hp-bar--${size}`}>
      {label && <span className="hp-bar__label">{label}</span>}
      <div className="hp-bar__track">
        <div
          className={`hp-bar__fill hp-bar__fill--${status}`}
          style={{ width: `${pct}%` }}
        ></div>
      </div>
      <span className="hp-bar__value">{current}/{max}</span>
    </div>
  );
}
