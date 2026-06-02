import { useState, useEffect, useMemo } from 'react';
import './PixelSplash.css';

/**
 * PixelSplash — pixel-block explosion effect.
 * Props:
 *   x, y: center position (% or px)
 *   color: primary colour hex
 *   intensity: 'low' | 'medium' | 'high'
 *   variant: 'burst' | 'slash' | 'shockwave' | 'sparkle' | 'shatter' | 'drip' | 'swirl'
 *   onComplete: called when animation finishes
 */

const VARIANTS = {
  burst: { count: [20, 25, 35], lifetime: 700, gravity: 0.4, spread: 360, speedRange: [2, 6] },
  slash: { count: [12, 18, 25], lifetime: 500, gravity: 0.1, spread: 60, speedRange: [4, 8] },
  shockwave: { count: [8, 10, 14], lifetime: 800, gravity: 0.6, spread: 360, speedRange: [1.5, 4] },
  sparkle: { count: [25, 35, 45], lifetime: 1200, gravity: -0.1, spread: 360, speedRange: [0.5, 2] },
  shatter: { count: [30, 45, 60], lifetime: 800, gravity: 0.5, spread: 360, speedRange: [3, 8] },
  drip: { count: [12, 16, 22], lifetime: 900, gravity: 0.8, spread: 120, speedRange: [1, 4] },
  swirl: { count: [18, 25, 35], lifetime: 1000, gravity: 0, spread: 360, speedRange: [1.5, 3.5] },
};

function getIntensityIdx(intensity) {
  if (intensity === 'low') return 0;
  if (intensity === 'high') return 2;
  return 1;
}

function randomRange(min, max) { return min + Math.random() * (max - min); }
function randomColor(base) {
  // Vary the base color slightly
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);
  const vary = 40;
  const nr = Math.min(255, Math.max(0, r + Math.floor(randomRange(-vary, vary))));
  const ng = Math.min(255, Math.max(0, g + Math.floor(randomRange(-vary, vary))));
  const nb = Math.min(255, Math.max(0, b + Math.floor(randomRange(-vary, vary))));
  return `rgb(${nr},${ng},${nb})`;
}

export default function PixelSplash({ x = '50%', y = '50%', color = '#00D9FF', intensity = 'medium', variant = 'burst', onComplete }) {
  const [visible, setVisible] = useState(true);

  const config = VARIANTS[variant] || VARIANTS.burst;
  const idx = getIntensityIdx(intensity);
  const count = config.count[idx];

  const blocks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = variant === 'slash'
        ? randomRange(-config.spread / 2, config.spread / 2) * (Math.PI / 180)
        : variant === 'drip'
          ? randomRange(60, 120) * (Math.PI / 180)
          : randomRange(0, 360) * (Math.PI / 180);

      const speed = randomRange(config.speedRange[0], config.speedRange[1]);
      const size = variant === 'sparkle'
        ? randomRange(3, 5)
        : variant === 'shockwave'
          ? randomRange(8, 14)
          : randomRange(4, 12);

      const lifetime = config.lifetime + randomRange(-150, 150);
      const dx = Math.cos(angle) * speed * randomRange(20, 60);
      const dy = Math.sin(angle) * speed * randomRange(20, 60) + (config.gravity * 80);
      const rotation = randomRange(-360, 360);

      arr.push({
        id: i,
        size,
        color: i % 4 === 0 ? '#fff' : randomColor(color),
        dx,
        dy,
        rotation,
        lifetime,
        delay: variant === 'shatter' && i > count * 0.6 ? 100 : 0,
        isRect: variant === 'slash' && Math.random() > 0.4,
      });
    }
    return arr;
  }, []); // eslint-disable-line

  useEffect(() => {
    const maxLife = Math.max(...blocks.map(b => b.lifetime + b.delay));
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, maxLife + 50);
    return () => clearTimeout(timer);
  }, [blocks, onComplete]);

  if (!visible) return null;

  // Check reduced motion
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  return (
    <div className="pixel-splash" style={{ left: x, top: y }}>
      {/* Shockwave ring */}
      {variant === 'shockwave' && (
        <div className="pixel-splash__ring" style={{ borderColor: color }}></div>
      )}
      {/* Blocks */}
      {blocks.map((b) => (
        <div
          key={b.id}
          className={`pixel-splash__block ${reducedMotion ? 'pixel-splash__block--reduced' : ''}`}
          style={{
            width: b.isRect ? b.size * 2 : b.size,
            height: b.size,
            background: b.color,
            '--dx': `${b.dx}px`,
            '--dy': `${b.dy}px`,
            '--rot': `${b.rotation}deg`,
            animationDuration: `${b.lifetime}ms`,
            animationDelay: `${b.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
