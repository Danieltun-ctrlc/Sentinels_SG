import { getEffectiveness } from './typeEffectiveness';
import { applyStatStage } from './statCalculator';
import { getDamageMultiplierFromStatus } from './statusEffects';
import { CREATURES } from '../data/creatures';

/**
 * Calculate damage for an attack move.
 * Includes: level scaling, stat stages, type effectiveness, STAB, crit, random, status modifiers.
 */
export function calculateDamage(attacker, defender, move) {
  if (move.category !== 'attack' || move.power === 0) {
    return { damage: 0, effectiveness: 1, isCrit: false };
  }

  const level = attacker.level;
  const power = move.power;

  // Apply stat stages
  const effectiveAtk = applyStatStage(attacker.stats.atk, attacker.statStages.atk);
  const effectiveDef = applyStatStage(defender.stats.def, defender.statStages.def);

  // Type effectiveness
  const defenderType = CREATURES[defender.creatureId]?.type || defender.type;
  const effectiveness = getEffectiveness(move.type, defenderType);

  // Base damage formula
  const base = Math.floor(
    ((2 * level / 5 + 2) * power * effectiveAtk / effectiveDef) / 50
  ) + 2;

  // STAB (Same-Type Attack Bonus)
  const attackerType = CREATURES[attacker.creatureId]?.type || attacker.type;
  const stab = move.type === attackerType ? 1.5 : 1.0;

  // Random variance 0.85–1.0
  const random = 0.85 + Math.random() * 0.15;

  // Critical hit: 6.25% chance, 1.5× damage
  const isCrit = Math.random() < 0.0625;
  const crit = isCrit ? 1.5 : 1.0;

  // Status modifier (DOXXED = +25% incoming damage)
  const statusMult = getDamageMultiplierFromStatus(defender);

  // Final
  const damage = Math.max(1, Math.floor(base * stab * effectiveness * random * crit * statusMult));

  return { damage, effectiveness, isCrit };
}
