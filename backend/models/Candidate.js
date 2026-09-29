const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, default: '' },
    college: { type: String, default: '' },
    year: { type: String, default: '' }
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    duration: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    technologies: { type: [String], default: [] }
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    resumePath: {
      type: String,
      required: [true, 'Resume file path is required']
    },
    originalFileName: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'doc', 'unknown'],
      default: 'unknown'
    },
    extractedText: {
      type: String,
      default: ''
    },
    skills: {
      type: [String],
      default: []
    },
    education: {
      type: [educationSchema],
      default: []
    },
    experience: {
      type: [experienceSchema],
      default: []
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years of experience cannot be negative']
    },
    projects: {
      type: [projectSchema],
      default: []
    },
    certifications: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes for search
candidateSchema.index({ name: 'text', email: 'text', skills: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);
