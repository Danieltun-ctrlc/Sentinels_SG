/**
 * Migration: Add 'expose_weakness' move to all existing users who own Verifox or Tracehound.
 * Run once: node db/addExposeWeakness.js
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

  // Get all users who own verifox
  const [verifoxUsers] = await pool.execute(
    "SELECT user_id FROM user_creatures WHERE creature_id = 'verifox'"
  );

  for (const row of verifoxUsers) {
    await pool.execute(
      "INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (?, 'verifox', 'expose_weakness')",
      [row.user_id]
    );
    console.log(`Added expose_weakness to user ${row.user_id} for verifox`);
  }

  // Get all users who own tracehound
  const [tracehoundUsers] = await pool.execute(
    "SELECT user_id FROM user_creatures WHERE creature_id = 'tracehound'"
  );

  for (const row of tracehoundUsers) {
    await pool.execute(
      "INSERT IGNORE INTO user_moves (user_id, creature_id, move_id) VALUES (?, 'tracehound', 'expose_weakness')",
      [row.user_id]
    );
    console.log(`Added expose_weakness to user ${row.user_id} for tracehound`);
  }

  console.log('Done! Users can now equip expose_weakness via TAP Allocation.');
  await pool.end();
}

run().catch(console.error);
