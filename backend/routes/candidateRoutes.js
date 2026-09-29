const express = require('express');
const router = express.Router();
const { getCandidateById } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:id', getCandidateById);

module.exports = router;
