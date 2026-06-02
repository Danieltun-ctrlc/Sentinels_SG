const pool = require('../config/database');

// Module rewards (server-side source of truth)
const MODULE_REWARDS = {
  scamshield_ecosystem: { tap: { atk: 12 }, moveUnlock: { creature: 'syncarya', move: 'community_alert' } },
  recognizing_phishing: { tap: { atk: 8 } },
  recovering_after_scam: { tap: { hp: 6 } },
  enabling_2fa: { tap: { def: 5 }, moveUnlock: { creature: 'cryptochel', move: 'firewall' } },
  factcheck_speed_drill: { tap: { spd: 5 } },
  deepfake_anatomy: { tap: { atk: 10 }, moveUnlock: { creature: 'verifox', move: 'logical_refute' } },
  protecting_elderly: { tap: { hp: 8 } },
};

async function getProgress(req, res, next) {
  try {
    const [progress] = await pool.execute(
      'SELECT * FROM training_progress WHERE user_id = ?',
      [req.userId]
    );
    res.json({ progress });
  } catch (err) { next(err); }
}

async function startModule(req, res, next) {
  try {
    const { moduleId } = req.body;
    await pool.execute(
      `INSERT INTO training_progress (user_id, module_id, status, progress_pct)
       VALUES (?, ?, 'IN_PROGRESS', 0)
       ON DUPLICATE KEY UPDATE status = 'IN_PROGRESS'`,
      [req.userId, moduleId]
    );
    res.json({ success: true, status: 'IN_PROGRESS' });
  } catch (err) { next(err); }
}

async function completeModule(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.userId;
    const { moduleId } = req.body;

    // Check if already completed
    const [[existing]] = await conn.execute(
      'SELECT * FROM training_progress WHERE user_id = ? AND module_id = ?',
      [userId, moduleId]
    );
    if (existing?.status === 'COMPLETED') {
      await conn.commit();
      return res.json({ success: true, alreadyCompleted: true });
    }

    // Mark complete
    if (existing) {
      await conn.execute(
        "UPDATE training_progress SET status = 'COMPLETED', progress_pct = 100, completed_at = NOW() WHERE user_id = ? AND module_id = ?",
        [userId, moduleId]
      );
    } else {
      await conn.execute(
        `INSERT INTO training_progress (user_id, module_id, status, progress_pct, completed_at)
         VALUES (?, ?, 'COMPLETED', 100, NOW())`,
        [userId, moduleId]
      );
    }

    const rewards = MODULE_REWARDS[moduleId];
    if (!rewards) {
      await conn.commit();
      return res.json({ success: true, rewards: null });
    }

    // Award TAP
    for (const [stat, amount] of Object.entries(rewards.tap || {})) {
      const col = `${stat}_tap`;
      await conn.execute(
        `UPDATE users SET ${col} = ${col} + ?, available_tap = available_tap + ? WHERE id = ?`,
        [amount, amount, userId]
      );
    }

    // Unlock move
    if (rewards.moveUnlock) {
      await conn.execute(
        'INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (?, ?, ?)',
        [userId, rewards.moveUnlock.creature, rewards.moveUnlock.move]
      );
    }

    await conn.commit();

    const [[updatedUser]] = await conn.execute(
      'SELECT id, available_tap, hp_tap, atk_tap, def_tap, spd_tap FROM users WHERE id = ?',
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

module.exports = { getProgress, startModule, completeModule };
