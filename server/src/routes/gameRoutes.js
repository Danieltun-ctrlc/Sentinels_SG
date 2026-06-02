const express = require('express');
const auth = require('../middleware/authMiddleware');
const {
  getCreatures, getMissions, saveBattle, completeMission,
  allocateTap, resetCreatureTap, getCreatureDetail, setActiveAbility, equipMoves
} = require('../controllers/gameController');

const router = express.Router();

router.get('/creatures', auth, getCreatures);
router.get('/creatures/:creatureId', auth, getCreatureDetail);
router.get('/missions', auth, getMissions);
router.post('/battles', auth, saveBattle);
router.post('/missions/complete', auth, completeMission);
router.post('/tap/allocate', auth, allocateTap);
router.post('/tap/reset', auth, resetCreatureTap);
router.post('/ability/set', auth, setActiveAbility);
router.post('/moves/equip', auth, equipMoves);

// Leaderboard (public — no auth required for viewing)
router.get('/leaderboard', async (req, res, next) => {
  try {
    const pool = require('../config/database');
    const [rows] = await pool.execute(
      `SELECT id, username, display_name, tier, awareness_score
       FROM users
       ORDER BY awareness_score DESC
       LIMIT 50`
    );
    res.json({ leaderboard: rows });
  } catch (err) { next(err); }
});

module.exports = router;
