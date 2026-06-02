const express = require('express');
const {
  getThreats,
  getTrending,
  getStats,
  getThreatById,
  getRelated,
  getFamilies,
  getCategories,
} = require('../controllers/threatsController');

const router = express.Router();

router.get('/', getThreats);
router.get('/trending', getTrending);
router.get('/stats', getStats);
router.get('/families', getFamilies);
router.get('/categories', getCategories);
router.get('/:id', getThreatById);
router.get('/:id/related', getRelated);

module.exports = router;
