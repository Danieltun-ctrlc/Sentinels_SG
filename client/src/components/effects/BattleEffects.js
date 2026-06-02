import { useState, useEffect } from 'react';
import PixelSplash from './PixelSplash';
import './BattleEffects.css';

/**
 * BattleEffects — renders layered move effects.
 * Props:
 *   effect: { type, side, moveType, isCrit, isSuper, isWeak } or null
 *   onComplete: called when all effects finish
 */

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

const TYPE_SPLASH = {
  logic: 'slash',
  forensic: 'slash',
  network: 'burst',
  armor: 'shockwave',
  phantom: 'shatter',
  illusion: 'swirl',
  toxic: 'drip',
  coercion: 'shockwave',
};

export default function BattleEffects({ effect, onComplete }) {
  const [phase, setPhase] = useState(null); // 'charge' | 'travel' | 'impact' | null
  const [screenFlash, setScreenFlash] = useState(null);
  const [hitStop, setHitStop] = useState(false);

  useEffect(() => {
    if (!effect) { setPhase(null); return; }

    let cancelled = false;
    async function runSequence() {
      const color = TYPE_COLORS[effect.moveType] || '#00D9FF';

      // Phase 1: Charge-up
      setPhase('charge');
      await delay(280);
      if (cancelled) return;

      // Phase 2: Travel
      setPhase('travel');
      await delay(200);
      if (cancelled) return;

      // Phase 3: Hit-stop
      setHitStop(true);
      await delay(60);
      setHitStop(false);
      if (cancelled) return;

      // Phase 4: Impact + screen flash
      setPhase('impact');
      if (effect.isCrit) {
        setScreenFlash('white');
        await delay(80);
        setScreenFlash(null);
      } else if (effect.isSuper) {
        setScreenFlash(color);
        await delay(100);
        setScreenFlash(null);
      }

      // Let splash play out
      await delay(700);
      if (cancelled) return;

      setPhase(null);
      if (onComplete) onComplete();
    }

    runSequence();
    return () => { cancelled = true; };
  }, [effect]); // eslint-disable-line

  if (!effect) return null;

  const color = TYPE_COLORS[effect.moveType] || '#00D9FF';
  const splashVariant = effect.isCrit ? 'shatter' : (TYPE_SPLASH[effect.moveType] || 'burst');
  const splashIntensity = effect.isCrit ? 'high' : effect.isSuper ? 'high' : 'medium';
  const isPlayerSide = effect.side === 'player';
  // Impact position: enemy side (right) if player attacks, player side (left) if enemy attacks
  const impactX = isPlayerSide ? '70%' : '30%';
  const impactY = isPlayerSide ? '30%' : '70%';

  // Charge position: caster side
  const chargeX = isPlayerSide ? '25%' : '75%';
  const chargeY = isPlayerSide ? '70%' : '25%';

  return (
    <div className={`battle-fx ${hitStop ? 'battle-fx--hitstop' : ''}`}>
      {/* Screen flash overlay */}
      {screenFlash && (
        <div className="battle-fx__screen-flash" style={{ background: screenFlash === 'white' ? 'rgba(255,255,255,0.35)' : `${screenFlash}30` }}></div>
      )}

      {/* Charge-up glow */}
      {phase === 'charge' && (
        <div className="battle-fx__charge" style={{ left: chargeX, top: chargeY, '--fx-color': color }}>
          <div className="battle-fx__charge-ring"></div>
          <div className="battle-fx__charge-particles">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="battle-fx__charge-dot" style={{
                background: color,
                animationDelay: `${i * 35}ms`,
                '--angle': `${i * 45}deg`,
              }}></div>
            ))}
          </div>
        </div>
      )}

      {/* Travel projectile */}
      {phase === 'travel' && (
        <div className={`battle-fx__projectile battle-fx__projectile--${isPlayerSide ? 'right' : 'left'}`} style={{ '--fx-color': color }}>
          <div className="battle-fx__projectile-core"></div>
          <div className="battle-fx__projectile-trail"></div>
          <div className="battle-fx__projectile-trail battle-fx__projectile-trail--2"></div>
        </div>
      )}

      {/* Impact splash */}
      {phase === 'impact' && (
        <PixelSplash
          x={impactX}
          y={impactY}
          color={color}
          intensity={splashIntensity}
          variant={splashVariant}
        />
      )}

      {/* Crit text */}
      {phase === 'impact' && effect.isCrit && (
        <div className="battle-fx__crit-text">CRITICAL HIT!</div>
      )}

      {/* Super effective text */}
      {phase === 'impact' && effect.isSuper && !effect.isCrit && (
        <div className="battle-fx__super-text">SUPER EFFECTIVE!</div>
      )}
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
