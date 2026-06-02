const pool = require('../config/database');
const cosmeticsCatalogue = require('../data/cosmeticsCatalogue');

/**
 * GET /api/shop/catalogue
 * Returns full catalogue with user's ownership/equipped status
 */
async function getCatalogue(req, res, next) {
  try {
    const userId = req.userId;

    // Get user's owned items
    const [owned] = await pool.execute(
      'SELECT item_id FROM cosmetic_unlocks WHERE user_id = ?',
      [userId]
    );
    const ownedSet = new Set(owned.map(r => r.item_id));

    // Get user's equipped items
    const [equipped] = await pool.execute(
      'SELECT slot, item_id FROM equipped_cosmetics WHERE user_id = ?',
      [userId]
    );
    const equippedMap = {};
    equipped.forEach(r => { equippedMap[r.item_id] = r.slot; });

    // Get user's completed missions
    const [missions] = await pool.execute(
      'SELECT mission_id FROM missions_completed WHERE user_id = ?',
      [userId]
    );
    const completedMissions = new Set(missions.map(m => m.mission_id));

    // Get user tier
    const [[user]] = await pool.execute(
      'SELECT tier, awareness_score FROM users WHERE id = ?',
      [userId]
    );

    const catalogue = cosmeticsCatalogue.map(item => {
      const isOwned = ownedSet.has(item.id);
      const isEquipped = !!equippedMap[item.id];
      let isLocked = false;

      if (item.unlockRequirement) {
        const req = item.unlockRequirement;
        if (req.type === 'mission' && !completedMissions.has(req.id)) {
          isLocked = true;
        }
        if (req.type === 'tier' && user.tier !== req.tier) {
          isLocked = true;
        }
      }

      return {
        ...item,
        owned: isOwned,
        equipped: isEquipped,
        locked: isLocked,
      };
    });

    res.json({ catalogue, balance: user.awareness_score });
  } catch (err) { next(err); }
}

/**
 * POST /api/shop/purchase
 * Transactional purchase of a cosmetic item
 * Body: { itemId }
 */
async function purchaseItem(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.userId;
    const { itemId } = req.body;

    // Validate item exists in catalogue
    const item = cosmeticsCatalogue.find(i => i.id === itemId);
    if (!item) {
      await conn.rollback();
      return res.status(404).json({ error: 'Item not found in catalogue' });
    }

    // Check if already owned
    const [existing] = await conn.execute(
      'SELECT id FROM cosmetic_unlocks WHERE user_id = ? AND item_id = ?',
      [userId, itemId]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Item already owned' });
    }

    // Check unlock requirement
    if (item.unlockRequirement) {
      const req = item.unlockRequirement;
      if (req.type === 'mission') {
        const [missions] = await conn.execute(
          'SELECT id FROM missions_completed WHERE user_id = ? AND mission_id = ?',
          [userId, req.id]
        );
        if (missions.length === 0) {
          await conn.rollback();
          return res.status(403).json({ error: 'Unlock requirement not met', requirement: req });
        }
      }
      if (req.type === 'tier') {
        const [[user]] = await conn.execute('SELECT tier FROM users WHERE id = ?', [userId]);
        if (user.tier !== req.tier) {
          await conn.rollback();
          return res.status(403).json({ error: 'Unlock requirement not met', requirement: req });
        }
      }
    }

    // Check balance (use FOR UPDATE to prevent race conditions)
    const [[user]] = await conn.execute(
      'SELECT awareness_score FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );
    if (user.awareness_score < item.price) {
      await conn.rollback();
      return res.status(400).json({ error: 'Insufficient awareness points', balance: user.awareness_score, price: item.price });
    }

    // Deduct awareness score
    const newBalance = user.awareness_score - item.price;
    await conn.execute(
      'UPDATE users SET awareness_score = ? WHERE id = ?',
      [newBalance, userId]
    );

    // Insert cosmetic unlock
    await conn.execute(
      'INSERT INTO cosmetic_unlocks (user_id, item_id, category, rarity) VALUES (?, ?, ?, ?)',
      [userId, itemId, item.category, item.rarity]
    );

    // Insert awareness transaction
    await conn.execute(
      'INSERT INTO awareness_transactions (user_id, amount, reason, reference_id, balance_after) VALUES (?, ?, ?, ?, ?)',
      [userId, -item.price, 'cosmetic_purchase', itemId, newBalance]
    );

    await conn.commit();

    res.json({ success: true, balance: newBalance, itemId });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/**
 * GET /api/shop/customisation
 * Returns user's currently equipped cosmetics
 */
async function getCustomisation(req, res, next) {
  try {
    const userId = req.userId;

    const [equipped] = await pool.execute(
      'SELECT slot, item_id FROM equipped_cosmetics WHERE user_id = ?',
      [userId]
    );

    const customisation = {};
    equipped.forEach(r => { customisation[r.slot] = r.item_id; });

    res.json({ customisation });
  } catch (err) { next(err); }
}

/**
 * POST /api/shop/customisation
 * Equip or unequip a cosmetic item
 * Body: { slot, itemId } — itemId can be null to unequip
 */
async function updateCustomisation(req, res, next) {
  try {
    const userId = req.userId;
    const { slot, itemId } = req.body;

    const validSlots = ['headgear', 'outfit', 'accessories', 'effects', 'badge', 'background', 'base'];
    if (!validSlots.includes(slot)) {
      return res.status(400).json({ error: 'Invalid slot' });
    }

    if (!itemId) {
      // Unequip
      await pool.execute(
        'DELETE FROM equipped_cosmetics WHERE user_id = ? AND slot = ?',
        [userId, slot]
      );
      return res.json({ success: true, slot, itemId: null });
    }

    // Verify ownership (skip for base characters — they're free)
    if (slot !== 'base') {
      const [owned] = await pool.execute(
        'SELECT id FROM cosmetic_unlocks WHERE user_id = ? AND item_id = ?',
        [userId, itemId]
      );
      if (owned.length === 0) {
        return res.status(403).json({ error: 'Item not owned' });
      }
    }

    // Verify item belongs to the correct slot/category (skip for base — not in catalogue)
    if (slot !== 'base') {
      const item = cosmeticsCatalogue.find(i => i.id === itemId);
      if (!item || item.category !== slot) {
        return res.status(400).json({ error: 'Item does not match slot category' });
      }
    }

    // Upsert equipped cosmetic
    await pool.execute(
      `INSERT INTO equipped_cosmetics (user_id, slot, item_id) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE item_id = ?, equipped_at = CURRENT_TIMESTAMP`,
      [userId, slot, itemId, itemId]
    );

    res.json({ success: true, slot, itemId });
  } catch (err) { next(err); }
}

/**
 * GET /api/shop/history
 * Returns awareness transaction history for the user
 */
async function getAwarenessHistory(req, res, next) {
  try {
    const userId = req.userId;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const [transactions] = await pool.execute(
      'SELECT amount, reason, reference_id, balance_after, created_at FROM awareness_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );

    res.json({ transactions });
  } catch (err) { next(err); }
}

module.exports = { getCatalogue, purchaseItem, getCustomisation, updateCustomisation, getAwarenessHistory };
