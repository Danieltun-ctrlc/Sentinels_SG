import { CREATURES } from '../data/creatures';
import { MOVES } from '../data/moves';
import { calculateStat } from './statCalculator';
import { calculateDamage } from './damageCalculator';
import { getEffectiveness } from './typeEffectiveness';
import { applyStatusEffect, canActThisTurn, tickStatusEffects, checkAccuracy } from './statusEffects';

// ============================================================
// BUILD COMBATANT
// ============================================================

function buildCombatant(creatureId, level, userCreature) {
  const def = CREATURES[creatureId];
  if (!def) throw new Error(`Unknown creature: ${creatureId}`);
  const data = userCreature || { level, hp_invested: 0, atk_invested: 0, def_invested: 0, spd_invested: 0 };
  data.level = data.level || level;

  const maxHp = calculateStat('hp', def, data);
  return {
    creatureId, name: def.name, type: def.type, level: data.level,
    hp: maxHp, maxHp,
    stats: { atk: calculateStat('atk', def, data), def: calculateStat('def', def, data), spd: calculateStat('spd', def, data) },
    statStages: { atk: 0, def: 0, spd: 0 },
    statusEffects: [],
    moves: def.movePool.core.slice(0, 4),
    pp: def.movePool.core.slice(0, 4).reduce((acc, id) => { acc[id] = MOVES[id]?.pp || 5; return acc; }, {}),
    ability: (userCreature?.activeAbility && userCreature.activeAbility !== 'default') ? userCreature.activeAbility : def.abilities.default,
    abilityFired: false, fainted: false,
    sprite: def.sprite, spriteBack: def.spriteBack || def.sprite,
  };
}

// Helper: get active player creature from state
function getPlayer(state) { return state.playerSquad[state.activePlayerIndex]; }

// ============================================================
// INIT BATTLE
// ============================================================

export function initBattle(playerCreatureId, playerLevel, enemyCreatureId, enemyLevel, mission, userCreature, squadData) {
  const playerSquad = [];
  if (squadData && squadData.length > 0) {
    for (const sd of squadData) playerSquad.push(buildCombatant(sd.creatureId, sd.level || 50, sd));
  } else {
    playerSquad.push(buildCombatant(playerCreatureId, playerLevel, userCreature));
  }

  const enemy = buildCombatant(enemyCreatureId, enemyLevel, null);
  const player = playerSquad[0];
  const log = [{ turn: 0, text: `${enemy.name} appears!`, type: 'narration' }, { turn: 0, text: `Go, ${player.name}!`, type: 'narration' }];

  if (enemy.ability === 'false_legitimacy' || enemy.ability === 'intimidation') {
    player.statStages.atk = Math.max(-6, player.statStages.atk - 1);
    const abilityName = enemy.ability === 'false_legitimacy' ? 'False Legitimacy' : 'Intimidation';
    log.push({ turn: 0, text: `${enemy.name}'s ${abilityName} activated!`, type: 'ability' });
    log.push({ turn: 0, text: `${player.name}'s ATK fell!`, type: 'stat' });
    log.push({ turn: 0, text: enemy.ability === 'false_legitimacy'
      ? `⚠️ Scams exploit initial trust before revealing intent.`
      : `⚠️ Coercion works by inducing fear from the start.`, type: 'narration' });
  }

  return { turn: 1, phase: 'PLAYER_TURN', playerSquad, activePlayerIndex: 0, enemy, mission, log, lastAction: null, firstAttackReceived: false };
}

// ============================================================
// SWAP CREATURE
// ============================================================

export function swapCreature(state, newIndex) {
  if (state.phase !== 'PLAYER_TURN') return state;
  if (newIndex === state.activePlayerIndex) return state;
  if (!state.playerSquad[newIndex] || state.playerSquad[newIndex].fainted) return state;

  const s = JSON.parse(JSON.stringify(state));
  s.activePlayerIndex = newIndex;
  s.log.push({ turn: s.turn, text: `Come back! Go, ${getPlayer(s).name}!`, type: 'swap' });
  s.phase = 'ENEMY_TURN';
  return s;
}

export function canSwap(state) {
  if (state.phase !== 'PLAYER_TURN') return false;
  return state.playerSquad.some((c, i) => i !== state.activePlayerIndex && !c.fainted);
}

// ============================================================
// FORCE SWAP ON FAINT
// ============================================================

function forceSwapIfFainted(state) {
  const player = getPlayer(state);
  if (!player.fainted) return state;
  const nextAlive = state.playerSquad.findIndex((c, i) => i !== state.activePlayerIndex && !c.fainted);
  if (nextAlive === -1) { state.phase = 'LOSS'; state.log.push({ turn: state.turn, text: 'All creatures fainted!', type: 'faint' }); return state; }
  state.activePlayerIndex = nextAlive;
  state.log.push({ turn: state.turn, text: `${getPlayer(state).name} enters the battle!`, type: 'swap' });
  state.phase = 'PLAYER_TURN';
  return state;
}

// ============================================================
// ABILITY HELPERS
// ============================================================

function applyViralReach(attacker, move, dmg) { return attacker.ability === 'viral_reach' && move.type === 'network' ? Math.floor(dmg * 1.2) : dmg; }
function applyOutrageEngine(attacker, defender, dmg) { if (attacker.ability !== 'outrage_engine') return dmg; return Math.floor(dmg * (1 + (1 - defender.hp / defender.maxHp) * 0.5)); }
function checkDataBackup(c, log, turn) { if (c.ability === 'data_backup' && !c.abilityFired && c.hp > 0 && c.hp <= c.maxHp * 0.25) { const h = Math.floor(c.maxHp * 0.25); c.hp = Math.min(c.maxHp, c.hp + h); c.abilityFired = true; log.push({ turn, text: `${c.name}'s Data Backup restored ${h} HP!`, type: 'ability' }); } }
function isImmune(target, move) { return target.ability === 'air_gapped' && move.type === 'network' && move.category === 'status'; }

function applyFirstAttackReduction(player, state, result, log) {
  if (!state.firstAttackReceived) {
    if (player.ability === 'zero_trust') { result.damage = Math.floor(result.damage * 0.5); log.push({ turn: state.turn, text: `${player.name}'s Zero Trust halved the damage!`, type: 'ability' }); }
    else if (player.ability === 'spam_filter') { result.damage = 0; log.push({ turn: state.turn, text: `${player.name}'s Spam Filter blocked the attack!`, type: 'ability' }); }
    else if (player.ability === 'cognitive_bias_detector' && state.turn === 1) { result.damage = Math.floor(result.damage * 0.75); log.push({ turn: state.turn, text: `${player.name}'s Cognitive Bias Detector reduced damage!`, type: 'ability' }); }
    state.firstAttackReceived = true;
  }
}

// ============================================================
// EXECUTE PLAYER MOVE
// ============================================================

export function executePlayerMove(state, moveId) {
  const move = MOVES[moveId];
  if (!move) return state;
  const s = JSON.parse(JSON.stringify(state));
  const player = getPlayer(s);
  const enemy = s.enemy;

  if (!canActThisTurn(player)) { s.log.push({ turn: s.turn, text: `${player.name} is panicking and can't move!`, type: 'status' }); s.phase = 'ENEMY_TURN'; return s; }

  if (player.pp[moveId] !== undefined) player.pp[moveId] = Math.max(0, player.pp[moveId] - 1);

  let result = { damage: 0, effectiveness: 1, isCrit: false };

  if (move.category === 'attack' && move.power > 0) {
    // Check accuracy (DECEIVED = 25% miss)
    const acc = checkAccuracy(player);
    if (!acc.hits) {
      s.log.push({ turn: s.turn, text: `${player.name} used ${move.name}!`, type: 'player' });
      s.log.push({ turn: s.turn, text: acc.reason, type: 'miss' });
      s.lastAction = { actor: 'player', moveId, damage: 0, effectiveness: 1, isCrit: false, missed: true };
      s.phase = 'ENEMY_TURN';
      return s;
    }
    result = calculateDamage(player, enemy, move);
    result.damage = applyViralReach(player, move, result.damage);
    result.damage = applyOutrageEngine(player, enemy, result.damage);
    enemy.hp = Math.max(0, enemy.hp - result.damage);
    s.log.push({ turn: s.turn, text: `${player.name} used ${move.name}!`, type: 'player' });
    if (result.isCrit) s.log.push({ turn: s.turn, text: 'Critical hit!', type: 'crit' });
    if (result.effectiveness >= 2) s.log.push({ turn: s.turn, text: "It's super effective!", type: 'effective' });
    else if (result.effectiveness < 1) s.log.push({ turn: s.turn, text: "It's not very effective...", type: 'resist' });
    s.log.push({ turn: s.turn, text: `${enemy.name} took ${result.damage} damage!`, type: 'damage' });
    if (move.statusInflict && Math.random() < 0.3) { applyStatusEffect(enemy, move.statusInflict); if (enemy.statusEffects.find(x => x.type === move.statusInflict)) s.log.push({ turn: s.turn, text: `${enemy.name} is now ${move.statusInflict}!`, type: 'status' }); }
  }

  if (move.category === 'status') {
    if (isImmune(enemy, move)) { s.log.push({ turn: s.turn, text: `${player.name} used ${move.name}!`, type: 'player' }); s.log.push({ turn: s.turn, text: `${enemy.name}'s Air-Gapped blocked it!`, type: 'ability' }); }
    else {
      if (move.effect) {
        const target = move.effect.target === 'self' ? player : enemy;
        const tName = move.effect.target === 'self' ? player.name : enemy.name;
        if (target === player && player.ability === 'critical_thinker' && move.effect.stages < 0) { s.log.push({ turn: s.turn, text: `${player.name} used ${move.name}!`, type: 'player' }); s.log.push({ turn: s.turn, text: `Critical Thinker blocked it!`, type: 'ability' }); }
        else { target.statStages[move.effect.stat] = Math.max(-6, Math.min(6, target.statStages[move.effect.stat] + move.effect.stages)); const dir = move.effect.stages > 0 ? 'rose' : 'fell'; s.log.push({ turn: s.turn, text: `${player.name} used ${move.name}!`, type: 'player' }); s.log.push({ turn: s.turn, text: `${tName}'s ${move.effect.stat.toUpperCase()} ${dir}!`, type: 'stat' }); }
      } else { s.log.push({ turn: s.turn, text: `${player.name} used ${move.name}!`, type: 'player' }); }
      if (move.statusInflict) { applyStatusEffect(enemy, move.statusInflict); if (enemy.statusEffects.find(x => x.type === move.statusInflict)) s.log.push({ turn: s.turn, text: `${enemy.name} is now ${move.statusInflict}!`, type: 'status' }); }
    }
  }

  s.lastAction = { actor: 'player', moveId, ...result };
  checkDataBackup(enemy, s.log, s.turn);

  if (enemy.hp <= 0) { enemy.fainted = true; s.phase = 'WIN'; s.log.push({ turn: s.turn, text: `${enemy.name} was defeated!`, type: 'faint' }); }
  else { s.phase = 'ENEMY_TURN'; }
  return s;
}

// ============================================================
// EXECUTE ENEMY AI
// ============================================================

export function executeEnemyAI(state) {
  const s = JSON.parse(JSON.stringify(state));
  const player = getPlayer(s);
  const enemy = s.enemy;

  if (!canActThisTurn(enemy)) { s.log.push({ turn: s.turn, text: `${enemy.name} is panicking and can't move!`, type: 'status' }); s.turn += 1; s.phase = 'PLAYER_TURN'; return tickStatusEffects(s); }

  const moveId = selectEnemyMove(s);
  const move = MOVES[moveId];
  if (!move) { s.turn += 1; s.phase = 'PLAYER_TURN'; return s; }

  if (enemy.pp[moveId] !== undefined) enemy.pp[moveId] = Math.max(0, enemy.pp[moveId] - 1);

  let result = { damage: 0, effectiveness: 1, isCrit: false };

  if (move.category === 'attack' && move.power > 0) {
    // Check accuracy (DECEIVED = 25% miss)
    const acc = checkAccuracy(enemy);
    if (!acc.hits) {
      s.log.push({ turn: s.turn, text: `${enemy.name} used ${move.name}!`, type: 'enemy' });
      s.log.push({ turn: s.turn, text: acc.reason, type: 'miss' });
      s.lastAction = { actor: 'enemy', moveId, damage: 0, effectiveness: 1, isCrit: false, missed: true };
      const ticked = tickStatusEffects(s); ticked.turn += 1; ticked.phase = 'PLAYER_TURN'; return ticked;
    }
    result = calculateDamage(enemy, player, move);
    result.damage = applyOutrageEngine(enemy, player, result.damage);
    result.damage = applyViralReach(enemy, move, result.damage);
    applyFirstAttackReduction(player, s, result, s.log);
    player.hp = Math.max(0, player.hp - result.damage);
    s.log.push({ turn: s.turn, text: `${enemy.name} used ${move.name}!`, type: 'enemy' });
    if (result.isCrit) s.log.push({ turn: s.turn, text: 'Critical hit!', type: 'crit' });
    if (result.effectiveness >= 2) s.log.push({ turn: s.turn, text: "It's super effective!", type: 'effective' });
    if (result.damage > 0) s.log.push({ turn: s.turn, text: `${player.name} took ${result.damage} damage!`, type: 'damage' });
    if (move.statusInflict && Math.random() < 0.3) { applyStatusEffect(player, move.statusInflict); if (player.statusEffects.find(x => x.type === move.statusInflict)) s.log.push({ turn: s.turn, text: `${player.name} is now ${move.statusInflict}!`, type: 'status' }); }
  }

  if (move.category === 'status') {
    if (isImmune(player, move)) { s.log.push({ turn: s.turn, text: `${enemy.name} used ${move.name}!`, type: 'enemy' }); s.log.push({ turn: s.turn, text: `${player.name}'s Air-Gapped blocked it!`, type: 'ability' }); }
    else {
      if (move.effect) {
        const target = move.effect.target === 'self' ? enemy : player;
        const tName = move.effect.target === 'self' ? enemy.name : player.name;
        if (target === player && player.ability === 'critical_thinker' && move.effect.stages < 0) { s.log.push({ turn: s.turn, text: `${enemy.name} used ${move.name}!`, type: 'enemy' }); s.log.push({ turn: s.turn, text: `Critical Thinker blocked it!`, type: 'ability' }); }
        else { target.statStages[move.effect.stat] = Math.max(-6, Math.min(6, target.statStages[move.effect.stat] + move.effect.stages)); const dir = move.effect.stages > 0 ? 'rose' : 'fell'; s.log.push({ turn: s.turn, text: `${enemy.name} used ${move.name}!`, type: 'enemy' }); s.log.push({ turn: s.turn, text: `${tName}'s ${move.effect.stat.toUpperCase()} ${dir}!`, type: 'stat' }); }
      } else { s.log.push({ turn: s.turn, text: `${enemy.name} used ${move.name}!`, type: 'enemy' }); }
      if (move.statusInflict) { applyStatusEffect(player, move.statusInflict); if (player.statusEffects.find(x => x.type === move.statusInflict)) s.log.push({ turn: s.turn, text: `${player.name} is now ${move.statusInflict}!`, type: 'status' }); }
    }
  }

  s.lastAction = { actor: 'enemy', moveId, ...result };
  checkDataBackup(player, s.log, s.turn);

  // Write player back to squad array
  s.playerSquad[s.activePlayerIndex] = player;

  if (player.hp <= 0) {
    player.fainted = true;
    s.playerSquad[s.activePlayerIndex] = player;
    const swapped = forceSwapIfFainted(s);
    if (swapped.phase === 'LOSS') return swapped;
    const ticked = tickStatusEffects(swapped);
    ticked.turn += 1;
    return ticked;
  }

  const ticked = tickStatusEffects(s);
  ticked.turn += 1;
  ticked.phase = 'PLAYER_TURN';
  return ticked;
}

// ============================================================
// ENEMY AI
// ============================================================

function selectEnemyMove(state) {
  const enemy = state.enemy;
  const player = getPlayer(state);
  const avail = enemy.moves.filter(id => (enemy.pp[id] || 0) > 0);
  if (avail.length === 0) {
    // All moves depleted — use first move anyway (struggle equivalent)
    return enemy.moves[0];
  }

  const pType = CREATURES[player.creatureId]?.type;
  const pHpPct = player.hp / player.maxHp;
  const eHpPct = enemy.hp / enemy.maxHp;

  if (pHpPct < 0.3) { const a = avail.filter(id => MOVES[id]?.category === 'attack').sort((a, b) => (MOVES[b]?.power || 0) - (MOVES[a]?.power || 0)); if (a.length) return a[0]; }
  if (eHpPct < 0.4) { const b = avail.filter(id => { const m = MOVES[id]; return m?.category === 'status' && m?.effect?.target === 'self' && m?.effect?.stages > 0; }); if (b.length && Math.random() < 0.4) return b[0]; }

  const se = avail.find(id => { const m = MOVES[id]; return m?.category === 'attack' && getEffectiveness(m.type, pType) >= 2; });
  if (se) return se;

  if (player.statusEffects.length === 0 && state.turn <= 3) { const sm = avail.filter(id => MOVES[id]?.statusInflict); if (sm.length && Math.random() < 0.5) return sm[Math.floor(Math.random() * sm.length)]; }
  if (player.statStages.def >= 0) { const dd = avail.filter(id => { const m = MOVES[id]; return m?.effect?.target === 'enemy' && m?.effect?.stat === 'def' && m?.effect?.stages < 0; }); if (dd.length && Math.random() < 0.35) return dd[0]; }

  const attacks = avail.filter(id => MOVES[id]?.category === 'attack').sort((a, b) => (MOVES[b]?.power || 0) - (MOVES[a]?.power || 0));
  if (attacks.length) return attacks[0];
  return avail[Math.floor(Math.random() * avail.length)];
}

// ============================================================
// HELPERS
// ============================================================

export function isBattleOver(state) { if (state.phase === 'WIN') return 'WIN'; if (state.phase === 'LOSS') return 'LOSS'; return null; }

// Export getPlayer for UI to read active creature
export function getActivePlayer(state) { return state.playerSquad[state.activePlayerIndex]; }
