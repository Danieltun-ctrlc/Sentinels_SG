const express = require('express');
const auth = require('../middleware/authMiddleware');
const {
  getCatalogue, purchaseItem, getCustomisation, updateCustomisation, getAwarenessHistory
} = require('../controllers/shopController');

const router = express.Router();

router.get('/catalogue', auth, getCatalogue);
router.post('/purchase', auth, purchaseItem);
router.get('/customisation', auth, getCustomisation);
router.post('/customisation', auth, updateCustomisation);
router.get('/history', auth, getAwarenessHistory);

module.exports = router;
