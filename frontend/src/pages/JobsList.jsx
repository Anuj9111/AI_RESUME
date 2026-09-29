import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase,
  PlusCircle,
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  ChevronRight,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await axios.get('/api/jobs', { params });
      if (res.data?.success) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Fetch jobs error:', err);
      setError(err.response?.data?.message || 'Failed to fetch job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchJobs();
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const handleDeleteJob = async (jobId) => {
    try {
      await axios.delete(`/api/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete job error:', err);
      alert(err.response?.data?.message || 'Failed to delete job');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Job Postings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your recruitment positions and candidate screening pipelines
          </p>
        </div>

        <Link
          to="/jobs/create"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-md shadow-indigo-600/20"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Post New Job</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center gap-4 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, department, or required skill..."
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none transition"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Closed">Closed Only</option>
            <option value="Draft">Draft Only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse p-6"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <Briefcase className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Job Postings Found</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            {search || statusFilter !== 'all'
              ? 'No jobs match your current search or filter criteria.'
              : 'Create your first job posting to start uploading resumes and running AI screening.'}
          </p>
          <Link
            to="/jobs/create"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-md shadow-indigo-600/20"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create First Job</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {job.department}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition leading-snug">
                      {job.title}
                    </h2>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      job.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : job.status === 'Draft'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <p className="text-slate-600 text-xs line-clamp-2 mb-4 leading-relaxed">
                  {job.description}
                </p>

                {/* Details Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 truncate">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{job.experience?.min}–{job.experience?.max} yrs exp</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Required Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills?.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills?.length > 4 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                        +{job.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Metrics & Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">
                    {job.metrics?.totalCandidates || 0}
                  </span>
                  <span>Applicants</span>
                </div>

                <div className="flex items-center space-x-2">
                  {deleteConfirmId === job._id ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDeleteJob(job._id)}
                        className="px-2 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(job._id)}
                      title="Delete Job"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <Link
                    to={`/jobs/${job._id}`}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition"
                  >
                    <span>Manage</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
