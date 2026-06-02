const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, ssl: { rejectUnauthorized: false },
  });

  const userId = 1;
  const starters = [
    { id: 'cryptochel', moves: ['firewall', 'encryption_shield', 'patch_update', 'lockdown'], ability: 'zero_trust' },
    { id: 'phishmonger', moves: ['false_urgency', 'sender_id_spoof', 'thread_injection', 'ocbc_phish'], ability: 'false_legitimacy' },
    { id: 'trollgeist', moves: ['gaslight', 'pile_on', 'doxxing_threat', 'false_urgency'], ability: 'outrage_engine' },
  ];

  for (const creature of starters) {
    await c.execute('INSERT IGNORE INTO user_creatures (user_id, creature_id, level) VALUES (?, ?, 50)', [userId, creature.id]);
    for (const moveId of creature.moves) {
      await c.execute('INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (?, ?, ?)', [userId, creature.id, moveId]);
    }
    for (let i = 0; i < creature.moves.length; i++) {
      await c.execute('INSERT IGNORE INTO equipped_moves (user_id, creature_id, slot_position, move_id) VALUES (?, ?, ?, ?)', [userId, creature.id, i + 1, creature.moves[i]]);
    }
    await c.execute('INSERT IGNORE INTO unlocked_abilities (user_id, creature_id, ability_id) VALUES (?, ?, ?)', [userId, creature.id, creature.ability]);
  }

  console.log('✅ Added Cryptochel, Phishmonger, Trollgeist to user 1');
  await c.end();
})();
