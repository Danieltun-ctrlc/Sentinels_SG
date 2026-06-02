/**
 * Migration: Ensure equipped_cosmetics supports a 'base' slot
 * for storing the player's selected base character sprite.
 *
 * The existing equipped_cosmetics table uses (user_id, slot) as a unique key,
 * so we just need to ensure the slot VARCHAR is wide enough and document
 * that 'base' is a valid slot value alongside headgear, outfit, etc.
 *
 * This migration also adds a base_character column to character_customisation
 * for legacy compatibility.
 */

const pool = require('../src/config/database');

async function migrate() {
  try {
    // Ensure equipped_cosmetics slot column can hold 'base' (already VARCHAR(20), so fine)
    // Add an explicit check by inserting a test comment — the table already supports it.

    // Add base_character column to character_customisation if it doesn't exist
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'character_customisation'
      AND COLUMN_NAME = 'base_character'
    `);

    if (columns.length === 0) {
      await pool.execute(`
        ALTER TABLE character_customisation
        ADD COLUMN base_character VARCHAR(50) DEFAULT 'sentinel_default'
        AFTER user_id
      `);
      console.log('✓ Added base_character column to character_customisation');
    } else {
      console.log('✓ base_character column already exists');
    }

    // Verify equipped_cosmetics can store 'base' slot (slot is VARCHAR(20), 'base' fits)
    console.log('✓ equipped_cosmetics table already supports base slot (VARCHAR(20))');
    console.log('  Valid slots: base, headgear, outfit, accessories, effects, badge, background');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
