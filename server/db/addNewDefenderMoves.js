/**
 * Migration: Add new defender moves to existing users.
 * Run once: node db/addNewDefenderMoves.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 16617,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  const newMoves = {
    verifox: ['source_verify', 'critical_analysis', 'debunk_blast'],
    cryptochel: ['two_factor_auth', 'data_wipe'],
    syncarya: ['bandwidth_surge', 'speed_patch', 'honeypot_trap'],
    tracehound: ['reverse_trace', 'incident_report'],
  };

  for (const [creatureId, moves] of Object.entries(newMoves)) {
    const [users] = await pool.execute(
      'SELECT user_id FROM user_creatures WHERE creature_id = ?',
      [creatureId]
    );

    for (const row of users) {
      for (const moveId of moves) {
        await pool.execute(
          'INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (?, ?, ?)',
          [row.user_id, creatureId, moveId]
        );
      }
      console.log(`Added ${moves.join(', ')} to user ${row.user_id} for ${creatureId}`);
    }
  }

  console.log('Done! New defender moves unlocked for all existing users.');
  await pool.end();
}

run().catch(console.error);
