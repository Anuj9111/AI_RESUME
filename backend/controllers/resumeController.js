const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const { extractRawText, extractCandidateEntities } = require('../services/resumeParserService');
const { analyzeResumeWithAI } = require('../services/aiService');

// @route   POST /api/jobs/:jobId/resumes
// @desc    Upload multiple resumes, extract text & entities, create Candidate & Application records
// @access  Private (Recruiter)
const uploadResumesForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Job ID format'
      });
    }

    // Verify job belongs to this recruiter
    const job = await Job.findOne({ _id: jobId, recruiter: req.user._id });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found or unauthorized'
      });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No resumes received for processing'
      });
    }

    const processingResults = [];
    const errors = [];

    // Process each uploaded resume file
    for (const file of files) {
      try {
        const filePath = file.path;
        const originalName = file.originalname;
        const fileType = path.extname(originalName).replace('.', '').toLowerCase();

        // 1. Text extraction
        const rawText = await extractRawText(filePath, originalName);

        if (!rawText || rawText.trim().length === 0) {
          errors.push({
            fileName: originalName,
            error: 'Extracted resume content is empty or unreadable'
          });
          continue;
        }

        // 2. Structured entity extraction
        const entities = extractCandidateEntities(rawText, originalName);

        // 3. Create or find Candidate record
        // Fallback email if candidate resume has no email
        const safeEmail = entities.email || `candidate_${Date.now()}_${Math.floor(Math.random() * 1000)}@applicant.ai`;

        let candidate = await Candidate.findOne({ email: safeEmail });
        if (!candidate) {
          candidate = await Candidate.create({
            name: entities.name,
            email: safeEmail,
            phone: entities.phone,
            resumePath: file.filename, // Stored filename in uploads/
            originalFileName: originalName,
            fileType,
            extractedText: rawText,
            skills: entities.skills,
            education: entities.education,
            experience: [],
            yearsOfExperience: entities.yearsOfExperience,
            projects: entities.projects,
            certifications: entities.certifications
          });
        } else {
          // Update candidate with newest resume text & skills
          candidate.extractedText = rawText;
          candidate.resumePath = file.filename;
          candidate.originalFileName = originalName;
          candidate.fileType = fileType;
          if (entities.skills.length > 0) candidate.skills = entities.skills;
          if (entities.education.length > 0) candidate.education = entities.education;
          if (entities.yearsOfExperience > 0) candidate.yearsOfExperience = entities.yearsOfExperience;
          await candidate.save();
        }

        // 4. Initial skill overlap analysis (Job vs Candidate)
        const jobRequired = job.requiredSkills.map(s => s.toLowerCase());
        const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase());

        // 4. Run AI matching service (FastAPI NLP microservice with embedded fallback)
        const aiAnalysisResult = await analyzeResumeWithAI({
          resumeText: rawText,
          jobDescription: job.description,
          requiredSkills: job.requiredSkills,
          preferredSkills: job.preferredSkills || [],
          requiredExperience: job.experience?.min || 0
        });

        const aiData = aiAnalysisResult.data;

        const initialStatus = aiData.match_score > 90 ? 'Shortlisted' : (aiData.match_score < 30 ? 'Rejected' : 'New');

        // 5. Create or update Application with explainable AI match results
        let application = await Application.findOne({
          candidate: candidate._id,
          job: job._id
        });

        if (!application) {
          application = await Application.create({
            candidate: candidate._id,
            job: job._id,
            matchScore: aiData.match_score,
            matchedSkills: aiData.matched_skills,
            missingSkills: aiData.missing_skills,
            explanation: aiData.explanation,
            status: initialStatus,
            aiAnalysis: {
              experienceAnalysis: aiData.experience_analysis,
              educationAnalysis: aiData.education_analysis,
              projectAnalysis: aiData.project_analysis,
              recommendation: aiData.recommendation,
              rawResponse: aiData
            }
          });
        } else {
          application.matchScore = aiData.match_score;
          application.matchedSkills = aiData.matched_skills;
          application.missingSkills = aiData.missing_skills;
          application.explanation = aiData.explanation;
          if (aiData.match_score > 90) {
            application.status = 'Shortlisted';
          } else if (aiData.match_score < 30) {
            application.status = 'Rejected';
          }
          application.aiAnalysis = {
            experienceAnalysis: aiData.experience_analysis,
            educationAnalysis: aiData.education_analysis,
            projectAnalysis: aiData.project_analysis,
            recommendation: aiData.recommendation,
            rawResponse: aiData
          };
          await application.save();
        }

        processingResults.push({
          candidateId: candidate._id,
          applicationId: application._id,
          name: candidate.name,
          email: candidate.email,
          skillsFound: candidate.skills.length,
          matchedSkills: aiData.matched_skills,
          missingSkills: aiData.missing_skills,
          baselineScore: aiData.match_score,
          recommendation: aiData.recommendation,
          fileName: originalName
        });
      } catch (fileErr) {
        console.error(`Failed processing ${file.originalname}:`, fileErr);
        errors.push({
          fileName: file.originalname,
          error: fileErr.message
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Processed ${processingResults.length} resumes successfully`,
      processedCount: processingResults.length,
      results: processingResults,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Upload resumes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during resume batch processing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   GET /api/jobs/:jobId/candidates
// @desc    Get all candidate applications for a specific job
// @access  Private (Recruiter)
const getCandidatesForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { search, status, sortBy } = req.query;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Job ID format'
      });
    }

    // Verify job belongs to recruiter
    const job = await Job.findOne({ _id: jobId, recruiter: req.user._id });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found or unauthorized'
      });
    }

    const filter = { job: job._id };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (req.query.minScore && !isNaN(Number(req.query.minScore))) {
      filter.matchScore = { $gte: Number(req.query.minScore) };
    }

    let sortOptions = { matchScore: -1 }; // Default sort by highest match score
    if (sortBy === 'newest') sortOptions = { createdAt: -1 };
    if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
    if (sortBy === 'score_asc') sortOptions = { matchScore: 1 };

    let applications = await Application.find(filter)
      .populate('candidate')
      .sort(sortOptions);

    if (search) {
      const searchLower = search.toLowerCase();
      applications = applications.filter(app => {
        const candidate = app.candidate;
        if (!candidate) return false;
        return (
          candidate.name?.toLowerCase().includes(searchLower) ||
          candidate.email?.toLowerCase().includes(searchLower) ||
          candidate.skills?.some(s => s.toLowerCase().includes(searchLower))
        );
      });
    }

    return res.status(200).json({
      success: true,
      job: {
        _id: job._id,
        title: job.title,
        department: job.department,
        requiredSkills: job.requiredSkills
      },
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Get candidates for job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving candidate applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   GET /api/candidates/:id
// @desc    Get detailed candidate information with resume download link
// @access  Private (Recruiter)
const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate ID format'
      });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    // Find applications submitted by this candidate
    const applications = await Application.find({ candidate: candidate._id })
      .populate('job', 'title department status requiredSkills');

    return res.status(200).json({
      success: true,
      candidate: {
        ...candidate.toObject(),
        resumeDownloadUrl: `/uploads/${candidate.resumePath}`
      },
      applications
    });
  } catch (error) {
    console.error('Get candidate by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving candidate profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   PUT /api/applications/:id/status
// @desc    Update candidate application review status (Shortlisted, Rejected, etc.)
// @access  Private (Recruiter)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Under Review', 'Shortlisted', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Candidate status updated to ${status}`,
      application
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   POST /api/applications/:id/analyze
// @desc    Re-run AI analysis on a candidate application
// @access  Private (Recruiter)
const analyzeApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id).populate('candidate').populate('job');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!application.job.recruiter.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this application'
      });
    }

    const aiResult = await analyzeResumeWithAI({
      resumeText: application.candidate.extractedText,
      jobDescription: application.job.description,
      requiredSkills: application.job.requiredSkills,
      preferredSkills: application.job.preferredSkills || [],
      requiredExperience: application.job.experience?.min || 0
    });

    const aiData = aiResult.data;
    application.matchScore = aiData.match_score;
    application.matchedSkills = aiData.matched_skills;
    application.missingSkills = aiData.missing_skills;
    application.explanation = aiData.explanation;
    if (aiData.match_score > 90) {
      application.status = 'Shortlisted';
    } else if (aiData.match_score < 30) {
      application.status = 'Rejected';
    }
    application.aiAnalysis = {
      experienceAnalysis: aiData.experience_analysis,
      educationAnalysis: aiData.education_analysis,
      projectAnalysis: aiData.project_analysis,
      recommendation: aiData.recommendation,
      rawResponse: aiData
    };

    await application.save();

    return res.status(200).json({
      success: true,
      message: 'AI analysis completed successfully',
      application,
      aiAnalysisSource: aiResult.source
    });
  } catch (error) {
    console.error('Analyze application error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error analyzing application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   PUT /api/applications/batch-status
// @desc    Batch update candidate application review statuses
// @access  Private (Recruiter)
const updateBatchApplicationStatus = async (req, res) => {
  try {
    const { applicationIds, status } = req.body;

    const validStatuses = ['New', 'Under Review', 'Shortlisted', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'applicationIds array is required'
      });
    }

    const result = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { $set: { status } }
    );

    return res.status(200).json({
      success: true,
      message: `Updated status to ${status} for ${result.modifiedCount} applications`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Batch update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating batch status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  uploadResumesForJob,
  getCandidatesForJob,
  getCandidateById,
  updateApplicationStatus,
  updateBatchApplicationStatus,
  analyzeApplication
};
