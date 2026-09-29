const Job = require('../models/Job');
const Application = require('../models/Application');
const mongoose = require('mongoose');

// Helper to format skill input (handles both string "React, Node" and array ["React", "Node"])
const parseSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map(s => s.trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (Recruiter)
const createJob = async (req, res) => {
  try {
    const {
      title,
      department,
      description,
      requiredSkills,
      preferredSkills,
      experience,
      education,
      location,
      employmentType,
      status
    } = req.body;

    // Validation
    if (!title || !department || !description || !education || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, department, description, education, and location'
      });
    }

    const parsedRequiredSkills = parseSkills(requiredSkills);
    if (parsedRequiredSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one required skill'
      });
    }

    const parsedPreferredSkills = parseSkills(preferredSkills);

    const minExp = experience?.min !== undefined ? Number(experience.min) : 0;
    const maxExp = experience?.max !== undefined ? Number(experience.max) : Math.max(minExp + 2, 2);

    const job = await Job.create({
      recruiter: req.user._id,
      title: title.trim(),
      department: department.trim(),
      description: description.trim(),
      requiredSkills: parsedRequiredSkills,
      preferredSkills: parsedPreferredSkills,
      experience: {
        min: isNaN(minExp) ? 0 : minExp,
        max: isNaN(maxExp) ? 10 : maxExp
      },
      education: education.trim(),
      location: location.trim(),
      employmentType: employmentType || 'Full-time',
      status: status || 'Active'
    });

    return res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating job posting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   GET /api/jobs
// @desc    Get all jobs for current recruiter with search & candidate counts
// @access  Private (Recruiter)
const getJobs = async (req, res) => {
  try {
    const { search, department, status } = req.query;

    const query = { recruiter: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (department && department !== 'all') {
      query.department = new RegExp(department, 'i');
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { department: new RegExp(search, 'i') },
        { requiredSkills: new RegExp(search, 'i') }
      ];
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    // Attach candidate & application metrics to each job
    const jobsWithMetrics = await Promise.all(
      jobs.map(async (job) => {
        const totalCandidates = await Application.countDocuments({ job: job._id });
        const shortlisted = await Application.countDocuments({ job: job._id, status: 'Shortlisted' });
        const underReview = await Application.countDocuments({ job: job._id, status: 'Under Review' });
        const newCount = await Application.countDocuments({ job: job._id, status: 'New' });

        return {
          ...job.toObject(),
          metrics: {
            totalCandidates,
            shortlisted,
            underReview,
            newCount
          }
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: jobsWithMetrics.length,
      jobs: jobsWithMetrics
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   GET /api/jobs/:id
// @desc    Get single job by ID with candidate statistics
// @access  Private (Recruiter)
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await Job.findOne({ _id: id, recruiter: req.user._id });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Aggregate candidate metrics for this job
    const totalCandidates = await Application.countDocuments({ job: job._id });
    const shortlisted = await Application.countDocuments({ job: job._id, status: 'Shortlisted' });
    const underReview = await Application.countDocuments({ job: job._id, status: 'Under Review' });
    const rejected = await Application.countDocuments({ job: job._id, status: 'Rejected' });
    const newCount = await Application.countDocuments({ job: job._id, status: 'New' });

    return res.status(200).json({
      success: true,
      job: {
        ...job.toObject(),
        metrics: {
          totalCandidates,
          shortlisted,
          underReview,
          rejected,
          newCount
        }
      }
    });
  } catch (error) {
    console.error('Get job by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving job details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   PUT /api/jobs/:id
// @desc    Update a job posting
// @access  Private (Recruiter)
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await Job.findOne({ _id: id, recruiter: req.user._id });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const {
      title,
      department,
      description,
      requiredSkills,
      preferredSkills,
      experience,
      education,
      location,
      employmentType,
      status
    } = req.body;

    if (title) job.title = title.trim();
    if (department) job.department = department.trim();
    if (description) job.description = description.trim();
    if (requiredSkills) job.requiredSkills = parseSkills(requiredSkills);
    if (preferredSkills !== undefined) job.preferredSkills = parseSkills(preferredSkills);
    if (education) job.education = education.trim();
    if (location) job.location = location.trim();
    if (employmentType) job.employmentType = employmentType;
    if (status) job.status = status;

    if (experience) {
      if (experience.min !== undefined) job.experience.min = Number(experience.min);
      if (experience.max !== undefined) job.experience.max = Number(experience.max);
    }

    await job.save();

    return res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      job
    });
  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating job posting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   DELETE /api/jobs/:id
// @desc    Delete a job posting and cascade delete applications
// @access  Private (Recruiter)
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const job = await Job.findOne({ _id: id, recruiter: req.user._id });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Cascade delete applications associated with this job
    await Application.deleteMany({ job: job._id });
    await Job.deleteOne({ _id: job._id });

    return res.status(200).json({
      success: true,
      message: 'Job posting and associated applications removed successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting job posting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
};
