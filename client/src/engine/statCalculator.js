/**
 * Calculate the actual in-battle stat for a creature.
 * Formula from Deep Dive spec.
 */
export function calculateStat(stat, creatureDef, userCreature) {
  const base = creatureDef.baseStats[stat];
  const invested = userCreature?.[`${stat}_invested`] || 0;
  const level = userCreature?.level || 50;

  if (stat === 'hp') {
    return Math.floor((2 * base + invested) * level / 100) + level + 10;
  } else {
    return Math.floor((2 * base + invested) * level / 100) + 5;
  }
}

/**
 * Apply stat stage multiplier (battle-only).
 * Stages range from -6 to +6.
 */
export function applyStatStage(statValue, stage) {
  const clamped = Math.max(-6, Math.min(6, stage));
  if (clamped >= 0) return Math.floor(statValue * (2 + clamped) / 2);
  return Math.floor(statValue * 2 / (2 - clamped));
}

/**
 * TAP investment limits.
 */
export const TAP_LIMITS = {
  perStat: 252,
  perCreature: 510,
};

export function canInvestTap(userCreature, stat, amount) {
  const currentInvested = userCreature?.[`${stat}_invested`] || 0;
  const totalInvested =
    (userCreature?.hp_invested || 0) +
    (userCreature?.atk_invested || 0) +
    (userCreature?.def_invested || 0) +
    (userCreature?.spd_invested || 0);

  if (currentInvested + amount > TAP_LIMITS.perStat) {
    return { valid: false, reason: `Cannot exceed ${TAP_LIMITS.perStat} per stat` };
  }
  if (totalInvested + amount > TAP_LIMITS.perCreature) {
    return { valid: false, reason: `Cannot exceed ${TAP_LIMITS.perCreature} total per creature` };
  }
  return { valid: true };
}
