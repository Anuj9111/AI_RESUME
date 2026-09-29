const express = require('express');
const router = express.Router();
const {
  registerRecruiter,
  loginRecruiter,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerRecruiter);
router.post('/login', loginRecruiter);
router.get('/me', protect, getMe);

module.exports = router;
