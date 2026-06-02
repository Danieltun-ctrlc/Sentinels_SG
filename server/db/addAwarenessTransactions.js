const pool = require('../src/config/database');

async function migrate() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS awareness_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount INT NOT NULL,
        reason VARCHAR(100),
        reference_id VARCHAR(50),
        balance_after INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, created_at DESC)
      )
    `);
    console.log('✓ awareness_transactions table created');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cosmetic_unlocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_id VARCHAR(50) NOT NULL,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_item (user_id, item_id)
      )
    `);
    console.log('✓ cosmetic_unlocks table created');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS equipped_cosmetics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        slot VARCHAR(20) NOT NULL,
        item_id VARCHAR(50) NOT NULL,
        equipped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_slot (user_id, slot)
      )
    `);
    console.log('✓ equipped_cosmetics table created');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
