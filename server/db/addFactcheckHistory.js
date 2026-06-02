const pool = require('../src/config/database');

async function migrate() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS factcheck_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        input_type VARCHAR(20) DEFAULT 'text',
        input_preview VARCHAR(200),
        verdict VARCHAR(20),
        confidence INT,
        result_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, created_at DESC)
      )
    `);
    console.log('✓ factcheck_history table created');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
