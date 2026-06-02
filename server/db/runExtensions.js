const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });

  console.log('Connected to:', process.env.DB_HOST);

  const sql = fs.readFileSync(path.join(__dirname, 'schema_extensions.sql'), 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    try {
      await connection.query(stmt);
    } catch (err) {
      // Ignore "duplicate column" or "table already exists" errors
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('  (skipped, already exists)');
      } else {
        throw err;
      }
    }
  }
  console.log('✅ Schema extensions applied.');

  const [tables] = await connection.query('SHOW TABLES');
  console.log('\nTables:', tables.map(r => Object.values(r)[0]).join(', '));

  await connection.end();
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
