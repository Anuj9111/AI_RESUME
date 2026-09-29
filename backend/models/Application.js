const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    experienceAnalysis: { type: String, default: '' },
    educationAnalysis: { type: String, default: '' },
    projectAnalysis: { type: String, default: '' },
    recommendation: { type: String, default: 'Review' },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate ID is required']
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required']
    },
    matchScore: {
      type: Number,
      default: 0,
      min: [0, 'Match score cannot be less than 0'],
      max: [100, 'Match score cannot exceed 100']
    },
    matchedSkills: {
      type: [String],
      default: []
    },
    missingSkills: {
      type: [String],
      default: []
    },
    explanation: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['New', 'Under Review', 'Shortlisted', 'Rejected'],
      default: 'New'
    },
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Compound index so a candidate can only apply once per job
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, matchScore: -1 }); // Fast leaderboard / ranking sorting

module.exports = mongoose.model('Application', applicationSchema);
