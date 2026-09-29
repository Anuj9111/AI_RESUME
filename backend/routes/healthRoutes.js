const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const dbStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

// @route   GET /api/health
// @desc    Health check endpoint with DB status
// @access  Public
router.get('/', (req, res) => {
  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    message: 'AI Resume Screener API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      connected: mongoose.connection.readyState === 1
    }
  });
});

module.exports = router;
