const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  // Give user 100 TAP per category
  await c.execute(
    'UPDATE users SET available_tap = 400, hp_tap = 100, atk_tap = 100, def_tap = 100, spd_tap = 100 WHERE id = 1'
  );
  console.log('TAP updated: 100 per category (400 total)');

  // Unlock 4 more moves for Verifox
  const moves = ['deep_research', 'logical_refute', 'official_app_check', 'scamshield_banish'];
  for (const m of moves) {
    await c.execute(
      'INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (1, ?, ?)',
      ['verifox', m]
    );
  }
  console.log('Unlocked moves:', moves.join(', '));

  // Unlock both abilities
  await c.execute(
    'INSERT IGNORE INTO unlocked_abilities (user_id, creature_id, ability_id) VALUES (1, ?, ?)',
    ['verifox', 'critical_thinker']
  );
  await c.execute(
    'INSERT IGNORE INTO unlocked_abilities (user_id, creature_id, ability_id) VALUES (1, ?, ?)',
    ['verifox', 'cognitive_bias_detector']
  );
  console.log('Unlocked abilities: critical_thinker, cognitive_bias_detector');

  // Equip 4 moves
  await c.execute('DELETE FROM equipped_moves WHERE user_id = 1 AND creature_id = ?', ['verifox']);
  const equip = ['cross_reference', 'fact_check', 'deep_research', 'logical_refute'];
  for (let i = 0; i < equip.length; i++) {
    await c.execute(
      'INSERT INTO equipped_moves (user_id, creature_id, slot_position, move_id) VALUES (1, ?, ?, ?)',
      ['verifox', i + 1, equip[i]]
    );
  }
  console.log('Equipped moves:', equip.join(', '));

  // Set active ability
  await c.execute(
    'UPDATE user_creatures SET active_ability = ? WHERE user_id = 1 AND creature_id = ?',
    ['critical_thinker', 'verifox']
  );
  console.log('Active ability set to critical_thinker');

  await c.end();
  console.log('✅ All done');
})();
