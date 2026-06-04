const express = require('express');
const auth = require('../middleware/authMiddleware');
const { analyse, getHistory } = require('../controllers/factCheckController');

const router = express.Router();

// Analyse is public — no login required
router.post('/analyse', (req, res, next) => {
  // Try to extract userId if token present, but don't require it
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    } catch (e) {
      // No valid token — that's fine, proceed without userId
    }
  }
  next();
}, analyse);

router.get('/history', auth, getHistory);

module.exports = router;
