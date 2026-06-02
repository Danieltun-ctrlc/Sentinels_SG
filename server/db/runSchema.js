/**
 * Run schema.sql against the configured database.
 * Usage: node db/runSchema.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });

  console.log('Connected to database:', process.env.DB_HOST);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  await connection.query(schema);
  console.log('✅ Schema executed successfully. All tables created.');

  // Verify tables
  const [tables] = await connection.query('SHOW TABLES');
  console.log('\nTables in database:');
  tables.forEach((row) => {
    const tableName = Object.values(row)[0];
    console.log(`  - ${tableName}`);
  });

  await connection.end();
}

runSchema().catch((err) => {
  console.error('❌ Schema execution failed:', err.message);
  process.exit(1);
});
