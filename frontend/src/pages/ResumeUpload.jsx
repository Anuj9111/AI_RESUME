import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  FileCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function ResumeUpload() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`/api/jobs/${jobId}`);
        if (res.data?.success) {
          setJob(res.data.job);
        }
      } catch (err) {
        console.error('Fetch job error:', err);
        setError('Could not load job requirements');
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const addFiles = (newFiles) => {
    setError('');
    const validFiles = [];
    const allowedExts = ['.pdf', '.docx', '.doc'];

    for (const f of newFiles) {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExts.includes(ext)) {
        setError(`"${f.name}" is not supported. Please upload PDF or DOCX files.`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError(`"${f.name}" exceeds the 10MB limit.`);
        continue;
      }
      validFiles.push(f);
    }

    if (files.length + validFiles.length > 15) {
      setError('You can upload a maximum of 15 resumes per batch.');
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one resume file to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResults(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('resumes', file);
      });

      const res = await axios.post(`/api/jobs/${jobId}/resumes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success) {
        setUploadResults(res.data);
        setFiles([]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.message || 'Failed to process resume batch upload.'
      );
    } finally {
      setUploading(false);
    }
  };

  // Generate lightweight mock PDF file for testing
  const handleGenerateSampleResume = (candidateName, skills, expYears) => {
    const streamContent = `BT /F1 12 Tf 72 712 Td (${candidateName}) Tj 0 -20 Td (Email: ${candidateName.toLowerCase().replace(' ', '.')}@example.com) Tj 0 -20 Td (Skills: ${skills}) Tj 0 -20 Td (Experience: ${expYears} years) Tj ET`;
    const pdfData = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj << /Length ${streamContent.length} >> stream\n${streamContent}\nendstream\nendobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n450\n%%EOF`;

    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const file = new File([blob], `${candidateName.replace(' ', '_')}_Resume.pdf`, {
      type: 'application/pdf'
    });
    addFiles([file]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to={`/jobs/${jobId}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Job</span>
        </Link>

        {job && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Target Role: {job.title}
          </span>
        )}
      </div>

      {/* Target Job Quick Summary Card */}
      {job && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Batch Screening For
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{job.title}</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {job.department} • {job.location} • {job.experience?.min}–{job.experience?.max} Yrs Exp
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 max-w-md">
              {job.requiredSkills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification after Batch Upload */}
      {uploadResults && (
        <div className="bg-white border border-emerald-300 rounded-3xl p-6 sm:p-8 mb-8 shadow-md">
          <div className="flex items-center space-x-3 text-emerald-600 mb-4">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="text-xl font-bold text-slate-900">
              Successfully Extracted {uploadResults.processedCount} Candidates
            </h2>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            Resume entities (Name, Email, Phone, Skills, Education, Experience) were extracted and scored with AI.
          </p>

          <div className="space-y-3 mb-6">
            {uploadResults.results?.map((res, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{res.name}</span>
                    <span className="text-xs text-slate-500">({res.email})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <span>Matched Skills:</span>
                    <span className="text-emerald-700 font-semibold">
                      {res.matchedSkills?.join(', ') || 'None'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-indigo-700">
                      {res.baselineScore}%
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Initial Match</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setUploadResults(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Upload More Resumes
            </button>
            <Link
              to={`/jobs/${jobId}/candidates`}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-xs"
            >
              <span>View Candidate Leaderboard</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Upload Candidate Resumes</h2>
          <p className="text-xs text-slate-500 mt-1">
            Supports batch upload of PDF and DOCX files (Up to 15 files, max 10MB each)
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center ${
            dragOver
              ? 'border-indigo-600 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
            <UploadCloud className="h-8 w-8" />
          </div>

          <h3 className="text-base font-bold text-slate-800">
            Drag & drop resumes here, or <span className="text-indigo-600 underline">browse</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Files will be parsed automatically for skills, education, and experience
          </p>
        </div>

        {/* Quick Demo Resumes Generator */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Don't have PDF files on hand? Attach pre-built test candidates:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleGenerateSampleResume(
                  'Rahul Sharma',
                  'React, Node.js, MongoDB, JavaScript, Express, Git',
                  2
                )
              }
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition"
            >
              + Rahul Sharma (High Match)
            </button>
            <button
              type="button"
              onClick={() =>
                handleGenerateSampleResume(
                  'Priya Singh',
                  'Python, FastAPI, Docker, PostgreSQL, Linux',
                  3
                )
              }
              className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition"
            >
              + Priya Singh (Backend Match)
            </button>
          </div>
        </div>

        {/* Selected Files Queue */}
        {files.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selected Files ({files.length})
              </span>
              <button
                onClick={() => setFiles([])}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="truncate text-slate-800 font-semibold">{file.name}</span>
                    <span className="text-slate-400 shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-60 cursor-pointer"
              >
                <FileCheck className="h-4 w-4" />
                <span>
                  {uploading
                    ? 'Extracting Resume Entities...'
                    : `Process & Upload ${files.length} Resume${files.length > 1 ? 's' : ''}`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
