const pool = require('../config/database');

// Mission rewards (server-side source of truth)
const MISSION_REWARDS = {
  mission_01: { tap: { atk: 30, hp: 20 }, moveUnlock: { creature: 'verifox', move: 'ocbc_phish' }, intelCard: 'ocbc_wave', awarenessBonus: 100, creatureUnlock: 'cryptochel' },
  mission_02: { tap: { def: 40, hp: 20 }, awarenessBonus: 100, creatureUnlock: 'silencer' },
  mission_03: { tap: { spd: 40, atk: 20 }, awarenessBonus: 120 },
  mission_04: { tap: { hp: 40, def: 20 }, awarenessBonus: 120 },
  mission_05: { tap: { atk: 40, spd: 20 }, awarenessBonus: 150 },
  mission_06: { tap: { atk: 25, def: 25, spd: 25, hp: 25 }, awarenessBonus: 200 },
};

async function getCreatures(req, res, next) {
  try {
    const [creatures] = await pool.execute(
      'SELECT * FROM user_creatures WHERE user_id = ?',
      [req.userId]
    );
    res.json({ creatures });
  } catch (err) { next(err); }
}

async function getMissions(req, res, next) {
  try {
    const [missions] = await pool.execute(
      'SELECT * FROM missions_completed WHERE user_id = ?',
      [req.userId]
    );
    res.json({ missions });
  } catch (err) { next(err); }
}

async function saveBattle(req, res, next) {
  try {
    const { battleType, missionId, result, turnsTaken, battleLog } = req.body;
    const awarenessDelta = result === 'WIN' ? 25 : 5;

    await pool.execute(
      `INSERT INTO battles (user_id, battle_type, mission_id, result, turns_taken, awareness_delta, battle_log)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, battleType, missionId || null, result, turnsTaken, awarenessDelta, JSON.stringify(battleLog || [])]
    );

    await pool.execute(
      'UPDATE users SET awareness_score = awareness_score + ? WHERE id = ?',
      [awarenessDelta, req.userId]
    );

    res.json({ success: true, awarenessDelta });
  } catch (err) { next(err); }
}

async function completeMission(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.userId;
    const { missionId, rank, turnsTaken, damageTakenPct, role } = req.body;
    const isDefender = role === 'defender' || !role;
    const isAttacker = role === 'attacker';

    // Check if record exists
    const [existing] = await conn.execute(
      'SELECT id, rank_earned, defender_won, attacker_won FROM missions_completed WHERE user_id = ? AND mission_id = ?',
      [userId, missionId]
    );

    if (existing.length > 0) {
      const record = existing[0];
      // Update the role that was just won
      let newWin = false;
      if (isDefender && !record.defender_won) {
        await conn.execute('UPDATE missions_completed SET defender_won = TRUE WHERE id = ?', [record.id]);
        newWin = true;
      }
      if (isAttacker && !record.attacker_won) {
        await conn.execute('UPDATE missions_completed SET attacker_won = TRUE WHERE id = ?', [record.id]);
        newWin = true;
      }
      // Update rank if better
      const ranks = { S: 5, A: 4, B: 3, C: 2, D: 1 };
      if (ranks[rank] > (ranks[record.rank_earned] || 0)) {
        await conn.execute(
          'UPDATE missions_completed SET rank_earned = ?, turns_taken = ?, damage_taken_pct = ? WHERE id = ?',
          [rank, turnsTaken, damageTakenPct, existing[0].id]
        );
      }
      const bothDone = (isDefender ? true : record.defender_won) && (isAttacker ? true : record.attacker_won);
      await conn.commit();
      return res.json({ success: true, alreadyStarted: true, bothComplete: bothDone, defenderWon: isDefender || record.defender_won, attackerWon: isAttacker || record.attacker_won });
    }

    // First-time completion — insert with role flags
    await conn.execute(
      `INSERT INTO missions_completed (user_id, mission_id, rank_earned, turns_taken, damage_taken_pct, defender_won, attacker_won)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, missionId, rank || 'C', turnsTaken, damageTakenPct, isDefender, isAttacker]
    );

    const rewards = MISSION_REWARDS[missionId];
    if (rewards) {
      // Award TAP per category
      for (const [stat, amount] of Object.entries(rewards.tap || {})) {
        const col = `${stat}_tap`;
        await conn.execute(
          `UPDATE users SET ${col} = ${col} + ?, available_tap = available_tap + ? WHERE id = ?`,
          [amount, amount, userId]
        );
      }

      // Award awareness
      if (rewards.awarenessBonus) {
        await conn.execute(
          'UPDATE users SET awareness_score = awareness_score + ? WHERE id = ?',
          [rewards.awarenessBonus, userId]
        );
      }

      // Unlock move
      if (rewards.moveUnlock) {
        await conn.execute(
          'INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (?, ?, ?)',
          [userId, rewards.moveUnlock.creature, rewards.moveUnlock.move]
        );
      }

      // Unlock creature
      if (rewards.creatureUnlock) {
        await conn.execute(
          'INSERT IGNORE INTO user_creatures (user_id, creature_id, level) VALUES (?, ?, 50)',
          [userId, rewards.creatureUnlock]
        );
        // Also unlock the creature's core moves
        const creatureMoves = { silencer: ['threats', 'extortion', 'panic_pressure', 'lateral_movement', 'data_exfiltration', 'false_urgency'] };
        const moves = creatureMoves[rewards.creatureUnlock];
        if (moves) {
          for (const moveId of moves) {
            await conn.execute('INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (?, ?, ?)', [userId, rewards.creatureUnlock, moveId]);
          }
          // Equip first 4
          for (let i = 0; i < Math.min(4, moves.length); i++) {
            await conn.execute('INSERT IGNORE INTO equipped_moves (user_id, creature_id, slot_position, move_id) VALUES (?, ?, ?, ?)', [userId, rewards.creatureUnlock, i + 1, moves[i]]);
          }
        }
      }

      // Intel card
      if (rewards.intelCard) {
        await conn.execute(
          'INSERT IGNORE INTO intel_cards (user_id, card_id, unlocked_via_mission) VALUES (?, ?, ?)',
          [userId, rewards.intelCard, missionId]
        );
      }
    }

    await conn.commit();

    // Return updated user
    const [[updatedUser]] = await conn.execute(
      'SELECT id, username, awareness_score, available_tap, hp_tap, atk_tap, def_tap, spd_tap, tier FROM users WHERE id = ?',
      [userId]
    );

    res.json({ success: true, rewards, user: updatedUser });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// TAP Allocation — deducts from each category individually
async function allocateTap(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.userId;
    const { creatureId, hp = 0, atk = 0, def = 0, spd = 0 } = req.body;

    if ([hp, atk, def, spd].some(v => v < 0 || !Number.isInteger(v))) {
      return res.status(400).json({ error: 'Invalid TAP amounts' });
    }

    const totalSpent = hp + atk + def + spd;
    if (totalSpent === 0) return res.json({ success: true, message: 'Nothing to allocate' });

    // Check user has enough in each category
    const [[user]] = await conn.execute(
      'SELECT available_tap, hp_tap, atk_tap, def_tap, spd_tap FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    if (!user) throw new Error('User not found');
    if (hp > user.hp_tap) return res.status(400).json({ error: `Not enough HP TAP. Have ${user.hp_tap}, need ${hp}` });
    if (atk > user.atk_tap) return res.status(400).json({ error: `Not enough ATK TAP. Have ${user.atk_tap}, need ${atk}` });
    if (def > user.def_tap) return res.status(400).json({ error: `Not enough DEF TAP. Have ${user.def_tap}, need ${def}` });
    if (spd > user.spd_tap) return res.status(400).json({ error: `Not enough SPD TAP. Have ${user.spd_tap}, need ${spd}` });

    const [[creature]] = await conn.execute(
      'SELECT * FROM user_creatures WHERE user_id = ? AND creature_id = ? FOR UPDATE',
      [userId, creatureId]
    );
    if (!creature) return res.status(404).json({ error: 'Creature not owned' });

    const newHp = creature.hp_invested + hp;
    const newAtk = creature.atk_invested + atk;
    const newDef = creature.def_invested + def;
    const newSpd = creature.spd_invested + spd;

    if ([newHp, newAtk, newDef, newSpd].some(v => v > 252)) {
      return res.status(400).json({ error: 'Cannot exceed 252 per stat' });
    }
    if (newHp + newAtk + newDef + newSpd > 510) {
      return res.status(400).json({ error: 'Cannot exceed 510 total per creature' });
    }

    const totalSpentCalc = hp + atk + def + spd;
    await conn.execute(
      `UPDATE users SET hp_tap = hp_tap - ?, atk_tap = atk_tap - ?, def_tap = def_tap - ?, spd_tap = spd_tap - ?, available_tap = available_tap - ? WHERE id = ?`,
      [hp, atk, def, spd, totalSpentCalc, userId]
    );

    await conn.execute(
      `UPDATE user_creatures SET hp_invested = hp_invested + ?, atk_invested = atk_invested + ?, def_invested = def_invested + ?, spd_invested = spd_invested + ? WHERE user_id = ? AND creature_id = ?`,
      [hp, atk, def, spd, userId, creatureId]
    );

    await conn.execute(
      `INSERT INTO tap_transactions (user_id, amount, category, reason, reference_id, balance_after) VALUES (?, ?, 'general', 'allocate_creature', ?, ?)`,
      [userId, -(hp + atk + def + spd), creatureId, user.available_tap - (hp + atk + def + spd)]
    );

    await conn.commit();

    const [[updatedUser]] = await conn.execute(
      'SELECT id, available_tap, hp_tap, atk_tap, def_tap, spd_tap FROM users WHERE id = ?', [userId]
    );
    const [squad] = await conn.execute('SELECT * FROM user_creatures WHERE user_id = ?', [userId]);

    res.json({ user: updatedUser, squad });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function resetCreatureTap(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.userId;
    const { creatureId } = req.body;

    const [[creature]] = await conn.execute(
      'SELECT * FROM user_creatures WHERE user_id = ? AND creature_id = ? FOR UPDATE',
      [userId, creatureId]
    );
    if (!creature) return res.status(404).json({ error: 'Creature not owned' });

    const { hp_invested, atk_invested, def_invested, spd_invested } = creature;
    const totalRefund = hp_invested + atk_invested + def_invested + spd_invested;

    await conn.execute(
      `UPDATE users SET hp_tap = hp_tap + ?, atk_tap = atk_tap + ?, def_tap = def_tap + ?, spd_tap = spd_tap + ?, available_tap = available_tap + ? WHERE id = ?`,
      [hp_invested, atk_invested, def_invested, spd_invested, totalRefund, userId]
    );

    await conn.execute(
      `UPDATE user_creatures SET hp_invested = 0, atk_invested = 0, def_invested = 0, spd_invested = 0 WHERE user_id = ? AND creature_id = ?`,
      [userId, creatureId]
    );

    await conn.commit();

    const [[updatedUser]] = await conn.execute(
      'SELECT id, available_tap, hp_tap, atk_tap, def_tap, spd_tap FROM users WHERE id = ?', [userId]
    );
    const [squad] = await conn.execute('SELECT * FROM user_creatures WHERE user_id = ?', [userId]);

    res.json({ user: updatedUser, squad });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// Get creature detail (moves, abilities, equipped)
async function getCreatureDetail(req, res, next) {
  try {
    const userId = req.userId;
    const { creatureId } = req.params;

    const [[creature]] = await pool.execute(
      'SELECT * FROM user_creatures WHERE user_id = ? AND creature_id = ?',
      [userId, creatureId]
    );
    if (!creature) return res.status(404).json({ error: 'Creature not owned' });

    const [unlockedMoves] = await pool.execute(
      'SELECT move_id FROM user_moves WHERE user_id = ? AND creature_id = ?',
      [userId, creatureId]
    );

    const [equippedMoves] = await pool.execute(
      'SELECT slot_position, move_id FROM equipped_moves WHERE user_id = ? AND creature_id = ? ORDER BY slot_position',
      [userId, creatureId]
    );

    const [unlockedAbilities] = await pool.execute(
      'SELECT ability_id FROM unlocked_abilities WHERE user_id = ? AND creature_id = ?',
      [userId, creatureId]
    );

    res.json({
      creature,
      unlockedMoves: unlockedMoves.map(m => m.move_id),
      equippedMoves: equippedMoves.map(m => ({ slot: m.slot_position, moveId: m.move_id })),
      unlockedAbilities: unlockedAbilities.map(a => a.ability_id),
      activeAbility: creature.active_ability || 'default',
    });
  } catch (err) { next(err); }
}

// Set active ability
async function setActiveAbility(req, res, next) {
  try {
    const userId = req.userId;
    const { creatureId, abilityId } = req.body;

    // Verify ability is unlocked
    const [unlocked] = await pool.execute(
      'SELECT id FROM unlocked_abilities WHERE user_id = ? AND creature_id = ? AND ability_id = ?',
      [userId, creatureId, abilityId]
    );
    if (unlocked.length === 0) {
      return res.status(400).json({ error: 'Ability not unlocked' });
    }

    await pool.execute(
      'UPDATE user_creatures SET active_ability = ? WHERE user_id = ? AND creature_id = ?',
      [abilityId, userId, creatureId]
    );

    res.json({ success: true, activeAbility: abilityId });
  } catch (err) { next(err); }
}

// Equip moves (set 4 move slots)
async function equipMoves(req, res, next) {
  try {
    const userId = req.userId;
    const { creatureId, moves } = req.body;
    // moves = ['cross_reference', 'fact_check', 'deep_research', 'logical_refute']

    if (!Array.isArray(moves) || moves.length < 1 || moves.length > 4) {
      return res.status(400).json({ error: 'Must equip 1-4 moves' });
    }

    // Verify all moves are unlocked
    const [unlockedMoves] = await pool.execute(
      'SELECT move_id FROM user_moves WHERE user_id = ? AND creature_id = ?',
      [userId, creatureId]
    );
    const unlockedSet = new Set(unlockedMoves.map(m => m.move_id));

    for (const moveId of moves) {
      if (!unlockedSet.has(moveId)) {
        return res.status(400).json({ error: `Move "${moveId}" not unlocked` });
      }
    }

    // Clear existing equipped moves
    await pool.execute(
      'DELETE FROM equipped_moves WHERE user_id = ? AND creature_id = ?',
      [userId, creatureId]
    );

    // Insert new equipped moves
    for (let i = 0; i < moves.length; i++) {
      await pool.execute(
        'INSERT INTO equipped_moves (user_id, creature_id, slot_position, move_id) VALUES (?, ?, ?, ?)',
        [userId, creatureId, i + 1, moves[i]]
      );
    }

    res.json({ success: true, equippedMoves: moves });
  } catch (err) { next(err); }
}

module.exports = { getCreatures, getMissions, saveBattle, completeMission, allocateTap, resetCreatureTap, getCreatureDetail, setActiveAbility, equipMoves };
