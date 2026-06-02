const express = require('express');
const authRoutes = require('./authRoutes');
const gameRoutes = require('./gameRoutes');
const trainingRoutes = require('./trainingRoutes');
const shopRoutes = require('./shopRoutes');
const pvpRoutes = require('./pvpRoutes');
const factCheckRoutes = require('./factCheckRoutes');
const threatsRoutes = require('./threatsRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/game', gameRoutes);
router.use('/game/training', trainingRoutes);
router.use('/shop', shopRoutes);
router.use('/pvp', pvpRoutes);
router.use('/factcheck', factCheckRoutes);
router.use('/threats', threatsRoutes);

module.exports = router;
