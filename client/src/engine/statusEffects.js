export const STATUS_EFFECTS = {
  PANIC: {
    name: 'Panic',
    description: 'Has a 30% chance to be unable to move each turn.',
    realMeaning: 'Scams induce panic to bypass rational thought.',
    duration: 4,
  },
  DECEIVED: {
    name: 'Deceived',
    description: 'Attacks miss 25% of the time.',
    realMeaning: 'When deceived, you cannot tell real from fake.',
    duration: 3,
  },
  TRIGGERED: {
    name: 'Triggered',
    description: 'ATK rises but DEF falls each turn.',
    realMeaning: 'Outrage clouds judgment.',
    duration: 4,
  },
  DOXXED: {
    name: 'Doxxed',
    description: 'All incoming damage increased by 25%.',
    realMeaning: 'Once personal info is exposed, every attack lands harder.',
    duration: -1, // persistent
  },
};

export function applyStatusEffect(combatant, effectType) {
  if (!effectType) return;
  // Don't stack same status
  if (combatant.statusEffects.find(s => s.type === effectType)) return;
  // Critical Thinker blocks PANIC
  if (effectType === 'PANIC' && combatant.ability === 'critical_thinker') return;

  const def = STATUS_EFFECTS[effectType];
  if (!def) return;

  combatant.statusEffects.push({
    type: effectType,
    turnsRemaining: def.duration,
  });
}

export function tickStatusEffects(state) {
  // Tick player's active creature
  const player = state.playerSquad ? state.playerSquad[state.activePlayerIndex] : null;
  if (player && player.statusEffects) {
    player.statusEffects = player.statusEffects
      .map(s => ({ ...s, turnsRemaining: s.turnsRemaining === -1 ? -1 : s.turnsRemaining - 1 }))
      .filter(s => s.turnsRemaining !== 0);
  }

  // Tick enemy
  const enemy = state.enemy;
  if (enemy && enemy.statusEffects) {
    enemy.statusEffects = enemy.statusEffects
      .map(s => ({ ...s, turnsRemaining: s.turnsRemaining === -1 ? -1 : s.turnsRemaining - 1 }))
      .filter(s => s.turnsRemaining !== 0);
  }

  return state;
}

export function canActThisTurn(combatant) {
  if (combatant.statusEffects.find(s => s.type === 'PANIC')) {
    return Math.random() >= 0.3; // 30% chance to skip turn
  }
  return true;
}

/**
 * Check if an attack hits (DECEIVED = 25% miss chance)
 * Returns { hits: boolean, reason: string|null }
 */
export function checkAccuracy(attacker) {
  if (attacker.statusEffects.find(s => s.type === 'DECEIVED')) {
    if (Math.random() < 0.25) {
      return { hits: false, reason: `${attacker.name} is DECEIVED and missed!` };
    }
  }
  return { hits: true, reason: null };
}

export function getDamageMultiplierFromStatus(defender) {
  if (defender.statusEffects.find(s => s.type === 'DOXXED')) {
    return 1.25;
  }
  return 1.0;
}
