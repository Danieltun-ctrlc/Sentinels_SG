const pool = require('../src/config/database');

async function migrate() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pvp_squads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        defender_1 VARCHAR(50) NOT NULL,
        defender_2 VARCHAR(50) NOT NULL,
        attacker_1 VARCHAR(50) NOT NULL,
        attacker_2 VARCHAR(50) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ pvp_squads table created');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pvp_matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        player_id INT NOT NULL,
        opponent_id VARCHAR(50),
        opponent_name VARCHAR(50),
        result ENUM('WIN','LOSS','IN_PROGRESS') DEFAULT 'IN_PROGRESS',
        player_score INT DEFAULT 0,
        opponent_score INT DEFAULT 0,
        awareness_awarded INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ pvp_matches table created');

    console.log('PVP migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
