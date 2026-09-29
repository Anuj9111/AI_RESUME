const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter ID is required']
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Job title cannot exceed 150 characters']
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Job description is required']
    },
    requiredSkills: {
      type: [String],
      required: [true, 'At least one required skill must be specified'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one required skill is required'
      }
    },
    preferredSkills: {
      type: [String],
      default: []
    },
    experience: {
      min: {
        type: Number,
        default: 0,
        min: [0, 'Minimum experience cannot be negative']
      },
      max: {
        type: Number,
        default: 10,
        min: [0, 'Maximum experience cannot be negative']
      }
    },
    education: {
      type: String,
      required: [true, 'Required education is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
      default: 'Full-time'
    },
    status: {
      type: String,
      enum: ['Active', 'Closed', 'Draft'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

// Index for search optimization
jobSchema.index({ title: 'text', department: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
