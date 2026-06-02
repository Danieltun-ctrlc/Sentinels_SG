const pool = require('../config/database');

class User {
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findByEmailOrUsername(email, username) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, display_name, tier, awareness_score, available_tap, hp_tap, atk_tap, def_tap, spd_tap, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ username, email, passwordHash, displayName }) {
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, display_name, available_tap, hp_tap, atk_tap, def_tap, spd_tap)
       VALUES (?, ?, ?, ?, 400, 100, 100, 100, 100)`,
      [username, email, passwordHash, displayName]
    );
    return result.insertId;
  }

  static async unlockStarterCreatures(userId) {
    // 2 Defenders: Verifox + Cryptochel
    // 2 Attackers: Phishmonger + Trollgeist
    const starters = [
      { id: 'verifox', moves: ['cross_reference', 'fact_check', 'deep_research', 'logical_refute', 'expose_weakness', 'source_verify', 'critical_analysis', 'debunk_blast'], ability: 'critical_thinker' },
      { id: 'cryptochel', moves: ['firewall', 'encryption_shield', 'patch_update', 'lockdown', 'two_factor_auth', 'data_wipe'], ability: 'zero_trust' },
      { id: 'phishmonger', moves: ['false_urgency', 'sender_id_spoof', 'thread_injection', 'ocbc_phish'], ability: 'false_legitimacy' },
      { id: 'trollgeist', moves: ['gaslight', 'pile_on', 'doxxing_threat', 'false_urgency'], ability: 'outrage_engine' },
    ];

    for (const creature of starters) {
      // Add creature at level 50
      await pool.execute(
        'INSERT IGNORE INTO user_creatures (user_id, creature_id, level) VALUES (?, ?, 50)',
        [userId, creature.id]
      );

      // Unlock all moves
      for (const moveId of creature.moves) {
        await pool.execute(
          'INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (?, ?, ?)',
          [userId, creature.id, moveId]
        );
      }

      // Equip first 4 moves
      for (let i = 0; i < Math.min(4, creature.moves.length); i++) {
        await pool.execute(
          'INSERT IGNORE INTO equipped_moves (user_id, creature_id, slot_position, move_id) VALUES (?, ?, ?, ?)',
          [userId, creature.id, i + 1, creature.moves[i]]
        );
      }

      // Unlock default ability
      await pool.execute(
        'INSERT IGNORE INTO unlocked_abilities (user_id, creature_id, ability_id) VALUES (?, ?, ?)',
        [userId, creature.id, creature.ability]
      );
    }

    await pool.execute(
      'INSERT IGNORE INTO character_customisation (user_id) VALUES (?)',
      [userId]
    );

    await pool.execute(
      `INSERT IGNORE INTO cosmetic_unlocks (user_id, item_id, category, rarity)
       VALUES (?, ?, ?, ?)`,
      [userId, 'base_cap', 'headgear', 'common']
    );
  }

  static async updateLastLogin(id) {
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
  }

  static async addAwareness(id, delta) {
    await pool.execute(
      'UPDATE users SET awareness_score = awareness_score + ? WHERE id = ?',
      [delta, id]
    );
  }
}

module.exports = User;
