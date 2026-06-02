import { getEffectivenessLabel } from './typeEffectiveness'; // eslint-disable-line no-unused-vars

export function narrateMove(user, target, move, result) {
  const lines = [];
  lines.push(`${user.name} used ${move.name}!`);

  if (move.category === 'attack' && result.damage > 0) {
    if (result.isCrit) lines.push('Critical hit!');
    if (result.effectiveness >= 2) lines.push("It's super effective!");
    else if (result.effectiveness < 1) lines.push("It's not very effective...");
    lines.push(`${target.name} took ${result.damage} damage!`);
  }

  if (move.category === 'status' && move.effect) {
    const statName = move.effect.stat.toUpperCase();
    const direction = move.effect.stages > 0 ? 'rose' : 'fell';
    const intensity = Math.abs(move.effect.stages) > 1 ? 'sharply ' : '';
    const who = move.effect.target === 'self' ? user.name : target.name;
    lines.push(`${who}'s ${statName} ${intensity}${direction}!`);
  }

  return lines;
}

export function narrateBattleStart(enemy) {
  return [`Wild ${enemy.name} appeared!`, `Prepare for battle!`];
}

export function narrateVictory(enemy) {
  return [`${enemy.name} was defeated!`, 'MISSION COMPLETE!'];
}

export function narrateDefeat(player) {
  return [`${player.name} fainted...`, 'Mission failed.'];
}
