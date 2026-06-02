const express = require('express');
const auth = require('../middleware/authMiddleware');
const { getProgress, startModule, completeModule } = require('../controllers/trainingController');

const router = express.Router();

router.get('/progress', auth, getProgress);
router.post('/start', auth, startModule);
router.post('/complete', auth, completeModule);

module.exports = router;
