const express = require('express');
const auth = require('../middleware/authMiddleware');
const { saveSquad, findMatch, completeMatch } = require('../controllers/pvpController');

const router = express.Router();

router.post('/squad', auth, saveSquad);
router.post('/find-match', auth, findMatch);
router.post('/match/complete', auth, completeMatch);

module.exports = router;
