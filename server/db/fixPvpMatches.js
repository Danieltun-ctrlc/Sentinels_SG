const pool = require('../src/config/database');
require('dotenv').config();

async function fix() {
  await pool.execute('DROP TABLE IF EXISTS pvp_matches');
  await pool.execute(`
    CREATE TABLE pvp_matches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      player_id INT NOT NULL,
      opponent_id VARCHAR(50),
      opponent_name VARCHAR(50),
      result VARCHAR(20) DEFAULT 'IN_PROGRESS',
      player_score INT DEFAULT 0,
      opponent_score INT DEFAULT 0,
      awareness_awarded INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('pvp_matches table recreated with correct schema');
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
