const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate safe unique filename: timestamp-random-originalName
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${cleanOriginalName}`);
  }
});

// File validation filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/octet-stream' // In some OS/browsers docx appears as octet-stream
  ];

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(`Invalid file format: ${ext}. Only PDF and DOCX files are permitted.`),
      false
    );
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(`Invalid file MIME type (${file.mimetype}). Only PDF and DOCX resumes are supported.`),
      false
    );
  }

  cb(null, true);
};

// Configure Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 15 // Max 15 files per batch
  }
});

// Middleware wrapper to handle Multer errors gracefully
const uploadResumesMiddleware = (req, res, next) => {
  const uploadHandler = upload.array('resumes', 15);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum permitted size is 10MB per resume.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files uploaded at once. Maximum batch size is 15 resumes.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one PDF or DOCX resume to upload.'
      });
    }

    next();
  });
};

module.exports = {
  uploadResumesMiddleware
};
