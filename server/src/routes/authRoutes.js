const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const { signup, login, me } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/signup',
  [
    body('username').isLength({ min: 3, max: 50 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  signup
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').exists()],
  login
);

router.get('/me', auth, me);

module.exports = router;
