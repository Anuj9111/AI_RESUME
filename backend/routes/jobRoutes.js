const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const {
  uploadResumesForJob,
  getCandidatesForJob
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const { uploadResumesMiddleware } = require('../middleware/uploadMiddleware');

// All job routes require recruiter authentication
router.use(protect);

router.route('/')
  .post(createJob)
  .get(getJobs);

router.route('/:id')
  .get(getJobById)
  .put(updateJob)
  .delete(deleteJob);

// Resume upload & candidates under specific job
router.post('/:jobId/resumes', uploadResumesMiddleware, uploadResumesForJob);
router.get('/:jobId/candidates', getCandidatesForJob);

module.exports = router;
