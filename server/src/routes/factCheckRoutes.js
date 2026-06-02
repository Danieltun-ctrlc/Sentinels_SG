const express = require('express');
const auth = require('../middleware/authMiddleware');
const { analyse, getHistory } = require('../controllers/factCheckController');

const router = express.Router();

router.post('/analyse', auth, analyse);
router.get('/history', auth, getHistory);

module.exports = router;
