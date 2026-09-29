const Job = require('../models/Job');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');

// @route   GET /api/dashboard/stats
// @desc    Get aggregate recruiter dashboard metrics & charts data
// @access  Private (Recruiter)
const getDashboardStats = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    // Get all jobs created by this recruiter
    const jobs = await Job.find({ recruiter: recruiterId }).select('_id status title createdAt');
    const jobIds = jobs.map(j => j._id);

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'Active').length;
    const closedJobs = jobs.filter(j => j.status === 'Closed').length;

    // Applications for this recruiter's jobs
    const totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
    const shortlistedCandidates = await Application.countDocuments({ job: { $in: jobIds }, status: 'Shortlisted' });
    const underReviewCandidates = await Application.countDocuments({ job: { $in: jobIds }, status: 'Under Review' });
    const rejectedCandidates = await Application.countDocuments({ job: { $in: jobIds }, status: 'Rejected' });
    const newCandidates = await Application.countDocuments({ job: { $in: jobIds }, status: 'New' });

    // Recent jobs with metrics
    const recentJobs = await Job.find({ recruiter: recruiterId })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentJobsWithCounts = await Promise.all(
      recentJobs.map(async (job) => {
        const count = await Application.countDocuments({ job: job._id });
        const shortlisted = await Application.countDocuments({ job: job._id, status: 'Shortlisted' });
        return {
          ...job.toObject(),
          totalApplicants: count,
          shortlistedApplicants: shortlisted
        };
      })
    );

    // Recent applications with candidate & job names
    const recentApplications = await Application.find({ job: { $in: jobIds } })
      .populate('candidate', 'name email skills yearsOfExperience')
      .populate('job', 'title department')
      .sort({ createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        closedJobs,
        totalCandidates: totalApplications,
        shortlistedCandidates,
        underReviewCandidates,
        rejectedCandidates,
        newCandidates,
        shortlistRate: totalApplications > 0 ? Math.round((shortlistedCandidates / totalApplications) * 100) : 0
      },
      recentJobs: recentJobsWithCounts,
      recentApplications
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboardStats
};
