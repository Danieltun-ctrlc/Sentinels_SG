const pool = require('../config/database');
const botOpponents = require('../data/botOpponents');

// Save or update PVP squad
async function saveSquad(req, res, next) {
  try {
    const userId = req.userId;
    const { defenders, attackers } = req.body;

    if (!Array.isArray(defenders) || defenders.length !== 2) {
      return res.status(400).json({ error: 'Must select exactly 2 defenders' });
    }
    if (!Array.isArray(attackers) || attackers.length !== 2) {
      return res.status(400).json({ error: 'Must select exactly 2 attackers' });
    }

    // Verify all creatures are owned by user
    const allCreatures = [...defenders, ...attackers];
    const uniqueCreatures = new Set(allCreatures);
    if (uniqueCreatures.size !== 4) {
      return res.status(400).json({ error: 'All 4 squad members must be unique' });
    }

    const [owned] = await pool.execute(
      'SELECT creature_id FROM user_creatures WHERE user_id = ?',
      [userId]
    );
    const ownedSet = new Set(owned.map(c => c.creature_id));

    for (const creatureId of allCreatures) {
      if (!ownedSet.has(creatureId)) {
        return res.status(400).json({ error: `Creature "${creatureId}" not owned` });
      }
    }

    await pool.execute(
      `INSERT INTO pvp_squads (user_id, defender_1, defender_2, attacker_1, attacker_2)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE defender_1 = VALUES(defender_1), defender_2 = VALUES(defender_2),
       attacker_1 = VALUES(attacker_1), attacker_2 = VALUES(attacker_2)`,
      [userId, defenders[0], defenders[1], attackers[0], attackers[1]]
    );

    res.json({ success: true, squad: { defenders, attackers } });
  } catch (err) { next(err); }
}

// Find a match — look for real opponents or fall back to bot
async function findMatch(req, res, next) {
  try {
    const userId = req.userId;

    // Get player awareness score
    const [[player]] = await pool.execute(
      'SELECT awareness_score FROM users WHERE id = ?',
      [userId]
    );
    if (!player) return res.status(404).json({ error: 'User not found' });

    const playerScore = player.awareness_score || 0;

    // Look for real opponents within ±500 awareness who have a saved squad
    const [realOpponents] = await pool.execute(
      `SELECT u.id, u.username, u.awareness_score, u.tier,
              ps.defender_1, ps.defender_2, ps.attacker_1, ps.attacker_2
       FROM users u
       JOIN pvp_squads ps ON ps.user_id = u.id
       WHERE u.id != ? AND u.awareness_score BETWEEN ? AND ?
       ORDER BY RAND() LIMIT 1`,
      [userId, playerScore - 500, playerScore + 500]
    );

    let opponent;

    if (realOpponents.length > 0) {
      const real = realOpponents[0];
      opponent = {
        id: `player_${real.id}`,
        username: real.username,
        tier: real.tier || 'Analyst',
        awarenessScore: real.awareness_score,
        squad: {
          defenders: [real.defender_1, real.defender_2],
          attackers: [real.attacker_1, real.attacker_2],
        },
        customisation: {},
        isBot: false,
      };
    } else {
      // Fall back to random bot
      const bot = botOpponents[Math.floor(Math.random() * botOpponents.length)];
      opponent = { ...bot, isBot: true };
    }

    // Create match record
    const [result] = await pool.execute(
      `INSERT INTO pvp_matches (player_id, opponent_id, opponent_name, result)
       VALUES (?, ?, ?, 'IN_PROGRESS')`,
      [userId, opponent.id, opponent.username]
    );

    res.json({
      matchId: result.insertId,
      opponent,
    });
  } catch (err) { next(err); }
}

// Complete a match — record result and award awareness
async function completeMatch(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.userId;
    const { matchId, result, playerScore, opponentScore } = req.body;

    if (!['WIN', 'LOSS'].includes(result)) {
      return res.status(400).json({ error: 'Result must be WIN or LOSS' });
    }

    const awarenessAwarded = result === 'WIN' ? 150 : 25;

    // Update match record
    await conn.execute(
      `UPDATE pvp_matches SET result = ?, player_score = ?, opponent_score = ?, awareness_awarded = ?
       WHERE id = ? AND player_id = ?`,
      [result, playerScore || 0, opponentScore || 0, awarenessAwarded, matchId, userId]
    );

    // Award awareness points
    await conn.execute(
      'UPDATE users SET awareness_score = awareness_score + ? WHERE id = ?',
      [awarenessAwarded, userId]
    );

    // Get updated balance for transaction log
    const [[user]] = await conn.execute(
      'SELECT awareness_score FROM users WHERE id = ?',
      [userId]
    );

    // Log to awareness_transactions
    await conn.execute(
      `INSERT INTO awareness_transactions (user_id, amount, reason, reference_id, balance_after)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, awarenessAwarded, `pvp_${result.toLowerCase()}`, `match_${matchId}`, user.awareness_score]
    );

    await conn.commit();

    res.json({
      success: true,
      result,
      awarenessAwarded,
      newAwarenessScore: user.awareness_score,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { saveSquad, findMatch, completeMatch };
