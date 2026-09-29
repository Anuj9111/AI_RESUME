import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase,
  ArrowLeft,
  MapPin,
  Clock,
  GraduationCap,
  Users,
  UploadCloud,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/jobs/${id}`);
      if (res.data?.success) {
        setJob(res.data.job);
        setEditFormData({
          title: res.data.job.title,
          department: res.data.job.department,
          description: res.data.job.description,
          requiredSkills: res.data.job.requiredSkills.join(', '),
          preferredSkills: res.data.job.preferredSkills.join(', '),
          minExp: res.data.job.experience?.min || 0,
          maxExp: res.data.job.experience?.max || 2,
          education: res.data.job.education,
          location: res.data.job.location,
          employmentType: res.data.job.employmentType,
          status: res.data.job.status
        });
      }
    } catch (err) {
      console.error('Fetch job error:', err);
      setError(err.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const payload = {
        title: editFormData.title,
        department: editFormData.department,
        description: editFormData.description,
        requiredSkills: editFormData.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        preferredSkills: editFormData.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        experience: {
          min: Number(editFormData.minExp),
          max: Number(editFormData.maxExp)
        },
        education: editFormData.education,
        location: editFormData.location,
        employmentType: editFormData.employmentType,
        status: editFormData.status
      };

      const res = await axios.put(`/api/jobs/${id}`, payload);
      if (res.data?.success) {
        setIsEditing(false);
        fetchJob();
      }
    } catch (err) {
      console.error('Update job error:', err);
      alert(err.response?.data?.message || 'Failed to update job');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await axios.delete(`/api/jobs/${id}`);
        navigate('/jobs');
      } catch (err) {
        console.error('Delete job error:', err);
        alert(err.response?.data?.message || 'Failed to delete job');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <div className="h-96 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center bg-white">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Job Posting Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">{error || 'This job may have been removed.'}</p>
        <Link
          to="/jobs"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to All Jobs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/jobs"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Jobs</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition shadow-xs"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Job'}</span>
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Job Details</h2>
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Job Description
              </label>
              <textarea
                rows={4}
                required
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Required Skills
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.requiredSkills}
                  onChange={(e) => setEditFormData({ ...editFormData, requiredSkills: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Skills
                </label>
                <input
                  type="text"
                  value={editFormData.preferredSkills}
                  onChange={(e) => setEditFormData({ ...editFormData, preferredSkills: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Min Exp
                </label>
                <input
                  type="number"
                  value={editFormData.minExp}
                  onChange={(e) => setEditFormData({ ...editFormData, minExp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Max Exp
                </label>
                <input
                  type="number"
                  value={editFormData.maxExp}
                  onChange={(e) => setEditFormData({ ...editFormData, maxExp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Main Job Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {job.department}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  job.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {job.status}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {job.employmentType}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center space-x-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{job.location}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{job.experience?.min}–{job.experience?.max} Years Experience</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1.5">
                <GraduationCap className="h-4 w-4 text-slate-400" />
                <span>{job.education}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/jobs/${job._id}/candidates`}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 transition shadow-xs"
            >
              <Users className="h-4 w-4 text-indigo-600" />
              <span>View Candidates ({job.metrics?.totalCandidates || 0})</span>
            </Link>

            <Link
              to={`/jobs/${job._id}/upload`}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Resumes</span>
            </Link>
          </div>
        </div>

        {/* Candidate Pipeline Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Candidates</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {job.metrics?.totalCandidates || 0}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Shortlisted</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {job.metrics?.shortlisted || 0}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Under Review</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {job.metrics?.underReview || 0}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-rose-600 font-semibold uppercase tracking-wider">Rejected</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {job.metrics?.rejected || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Description & Competencies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Job Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Skills Breakdown */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {job.requiredSkills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>

            {job.preferredSkills?.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Preferred Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
