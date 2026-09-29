const express = require('express');
const router = express.Router();
const { updateApplicationStatus, updateBatchApplicationStatus, analyzeApplication } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/batch-status', updateBatchApplicationStatus);
router.put('/:id/status', updateApplicationStatus);
router.post('/:id/analyze', analyzeApplication);

module.exports = router;
