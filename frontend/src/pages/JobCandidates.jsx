import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Search,
  Filter,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  Download,
  AlertCircle,
  Eye,
  BrainCircuit,
  FileSpreadsheet,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Award
} from 'lucide-react';

export default function JobCandidates() {
  const { id: jobId } = useParams();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState('score_desc');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (minScoreFilter > 0) params.minScore = minScoreFilter;
      if (sortBy) params.sortBy = sortBy;

      const res = await axios.get(`/api/jobs/${jobId}/candidates`, { params });
      if (res.data?.success) {
        setJob(res.data.job);
        setApplications(res.data.applications);
      }
    } catch (err) {
      console.error('Fetch candidates error:', err);
      showToast(err.response?.data?.message || 'Failed to fetch candidates', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCandidates();
    }, 250);
    return () => clearTimeout(delay);
  }, [jobId, search, statusFilter, minScoreFilter, sortBy]);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      setStatusLoadingId(applicationId);
      const res = await axios.put(`/api/applications/${applicationId}/status`, {
        status: newStatus
      });
      if (res.data?.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId ? { ...app, status: newStatus } : app
          )
        );
        showToast(`Candidate status updated to "${newStatus}"`);
      }
    } catch (err) {
      console.error('Update status error:', err);
      showToast(err.response?.data?.message || 'Failed to update status', true);
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleBatchStatusUpdate = async (newStatus) => {
    if (selectedAppIds.length === 0) return;
    try {
      setBatchLoading(true);
      const res = await axios.put('/api/applications/batch-status', {
        applicationIds: selectedAppIds,
        status: newStatus
      });
      if (res.data?.success) {
        setApplications((prev) =>
          prev.map((app) =>
            selectedAppIds.includes(app._id) ? { ...app, status: newStatus } : app
          )
        );
        showToast(`Updated ${selectedAppIds.length} candidate(s) to "${newStatus}"`);
        setSelectedAppIds([]);
      }
    } catch (err) {
      console.error('Batch status error:', err);
      showToast(err.response?.data?.message || 'Failed to update batch status', true);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleShortlistTopN = async (count = 3) => {
    const sorted = [...applications].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const topCandidates = sorted.slice(0, count);
    const topIds = topCandidates.map((a) => a._id);

    if (topIds.length === 0) {
      showToast('No candidates available to shortlist', true);
      return;
    }

    try {
      setBatchLoading(true);
      const res = await axios.put('/api/applications/batch-status', {
        applicationIds: topIds,
        status: 'Shortlisted'
      });
      if (res.data?.success) {
        setApplications((prev) =>
          prev.map((app) =>
            topIds.includes(app._id) ? { ...app, status: 'Shortlisted' } : app
          )
        );
        showToast(`AI Shortlisted top ${topIds.length} candidate(s) successfully!`);
      }
    } catch (err) {
      console.error('Shortlist top candidates error:', err);
      showToast(err.response?.data?.message || 'Failed to shortlist top candidates', true);
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleSelectApp = (id) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAppIds.length === applications.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(applications.map((app) => app._id));
    }
  };

  // Export current candidate pipeline to CSV
  const handleExportCSV = () => {
    if (applications.length === 0) {
      showToast('No candidate data to export', true);
      return;
    }

    const headers = [
      'Candidate Name',
      'Email',
      'Phone',
      'Match Score (%)',
      'Review Status',
      'Years Experience',
      'Matched Skills',
      'Missing Skills',
      'AI Recommendation',
      'AI Explanation'
    ];

    const rows = applications.map((app) => {
      const c = app.candidate || {};
      const matched = (app.matchedSkills || []).join('; ');
      const missing = (app.missingSkills || []).join('; ');
      const rec = app.aiAnalysis?.recommendation || '';
      const exp = (app.explanation || '').replace(/[\r\n]+/g, ' ');

      return [
        `"${c.name || ''}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        app.matchScore || 0,
        `"${app.status || 'New'}"`,
        c.yearsOfExperience || 0,
        `"${matched}"`,
        `"${missing}"`,
        `"${rec}"`,
        `"${exp.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeTitle = (job?.title || 'pipeline').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `${safeTitle}_candidates_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Candidate pipeline exported to CSV');
  };

  const totalCount = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const strongMatchCount = applications.filter((a) => (a.matchScore || 0) >= 80).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-sm font-medium transition transform ${
            toastMessage.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Job Details</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <span>Candidate Pipeline</span>
            {job && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {job.department}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {job
              ? `${job.title} • AI-ranked candidates & explainable suitability scores`
              : 'Candidate applications & AI matching scores'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={applications.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50 shadow-xs"
            title="Download pipeline as CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleShortlistTopN(3)}
            disabled={applications.length === 0 || batchLoading}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold transition disabled:opacity-50"
            title="Automatically shortlist top 3 scored candidates"
          >
            <Award className="h-4 w-4 text-amber-600" />
            <span>Shortlist Top 3</span>
          </button>

          <Link
            to={`/jobs/${jobId}/upload`}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Resumes</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{totalCount}</div>
            <div className="text-xs text-slate-500 font-medium">Total Applicants</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-600">{shortlistedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Shortlisted</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-purple-600">{strongMatchCount}</div>
            <div className="text-xs text-slate-500 font-medium">High Match (≥80%)</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-cyan-700">
              {applications.length > 0
                ? Math.round(
                    applications.reduce((acc, a) => acc + (a.matchScore || 0), 0) /
                      applications.length
                  )
                : 0}
              %
            </div>
            <div className="text-xs text-slate-500 font-medium">Avg Match Score</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center gap-4 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name, email, or extracted skill..."
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Score Threshold Filter */}
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
            >
              <option value={0}>Min Score: Any</option>
              <option value={50}>Min Score: 50%+</option>
              <option value={70}>Min Score: 70%+</option>
              <option value={80}>Min Score: 80%+</option>
              <option value={90}>Min Score: 90%+</option>
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none"
          >
            <option value="score_desc">Highest Match Score</option>
            <option value="score_asc">Lowest Match Score</option>
            <option value="newest">Recently Uploaded</option>
            <option value="oldest">First Uploaded</option>
          </select>
        </div>
      </div>

      {/* Batch Action Toolbar when items are selected */}
      {selectedAppIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 px-5 mb-6 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-3 text-xs font-semibold text-indigo-900">
            <span>{selectedAppIds.length} candidate(s) selected</span>
            <button
              onClick={() => setSelectedAppIds([])}
              className="text-slate-500 hover:text-slate-800 underline text-[11px]"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBatchStatusUpdate('Shortlisted')}
              disabled={batchLoading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              Shortlist Selected
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('Under Review')}
              disabled={batchLoading}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
            >
              Mark Under Review
            </button>
            <button
              onClick={() => handleBatchStatusUpdate('Rejected')}
              disabled={batchLoading}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
            >
              Reject Selected
            </button>
          </div>
        </div>
      )}

      {/* Candidates Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse"
            ></div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Candidate Applications Found</h3>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            {search || statusFilter !== 'all' || minScoreFilter > 0
              ? 'Try adjusting your search criteria or score threshold filters.'
              : 'Upload candidate resumes to extract information and calculate match scores.'}
          </p>
          <Link
            to={`/jobs/${jobId}/upload`}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-sm"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Resumes</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="py-4 px-4 w-12 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-700"
                      title="Select all on this view"
                    >
                      {selectedAppIds.length === applications.length && applications.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4">Candidate</th>
                  <th className="py-4 px-4 text-center">AI Match Score</th>
                  <th className="py-4 px-4">Skills Coverage</th>
                  <th className="py-4 px-4">Experience & Edu</th>
                  <th className="py-4 px-4 text-center">Review Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {applications.map((app) => {
                  const cand = app.candidate;
                  const isSelected = selectedAppIds.includes(app._id);
                  const score = app.matchScore || 0;

                  return (
                    <tr
                      key={app._id}
                      className={`hover:bg-slate-50 transition ${
                        isSelected ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => toggleSelectApp(app._id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Name & Contact */}
                      <td className="py-4 px-4">
                        <Link
                          to={`/candidates/${cand?._id}`}
                          className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition"
                        >
                          {cand?.name || 'Unnamed Candidate'}
                        </Link>
                        <div className="text-slate-500 text-xs mt-0.5">{cand?.email}</div>
                        {cand?.phone && (
                          <div className="text-slate-400 text-[11px]">{cand.phone}</div>
                        )}
                        {app.aiAnalysis?.recommendation && (
                          <span
                            className={`inline-block text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                              app.aiAnalysis.recommendation === 'Strong Match'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : app.aiAnalysis.recommendation === 'Potential Match'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {app.aiAnalysis.recommendation}
                          </span>
                        )}
                      </td>

                      {/* Match Score */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-base font-extrabold px-3 py-1 rounded-xl border ${
                              score >= 80
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : score >= 50
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {score}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                score >= 80
                                  ? 'bg-emerald-500'
                                  : score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Skills Breakdown */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-1">
                          {app.matchedSkills && app.matchedSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {app.matchedSkills.slice(0, 3).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                                >
                                  ✓ {skill}
                                </span>
                              ))}
                              {app.matchedSkills.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                                  +{app.matchedSkills.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {app.missingSkills && app.missingSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {app.missingSkills.slice(0, 2).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-medium"
                                >
                                  ✕ {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Experience & Education */}
                      <td className="py-4 px-4">
                        <div className="text-slate-700 font-semibold">
                          {cand?.yearsOfExperience
                            ? `${cand.yearsOfExperience} Yrs Exp`
                            : 'Exp Not Specified'}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[140px]">
                          {cand?.education?.[0]?.degree || 'Education Not Specified'}
                        </div>
                      </td>

                      {/* Review Status */}
                      <td className="py-4 px-4 text-center">
                        <select
                          value={app.status || 'New'}
                          onChange={(e) => handleUpdateStatus(app._id, e.target.value)}
                          disabled={statusLoadingId === app._id}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer transition ${
                            app.status === 'Shortlisted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : app.status === 'Under Review'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : app.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedCandidate({ ...cand, application: app })}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                            title="Quick preview profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {cand?.resumePath && (
                            <a
                              href={`/uploads/${cand.resumePath}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Download Original Resume File"
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}

                          <Link
                            to={`/candidates/${cand?._id}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition"
                            title="View Full Explainable AI Breakdown"
                          >
                            <BrainCircuit className="h-3.5 w-3.5" />
                            <span>AI Analysis</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Quick Preview Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative text-slate-800">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Extracted Resume Profile Preview
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">{selectedCandidate.name}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedCandidate.email} • {selectedCandidate.phone || 'Phone not found'}
                </p>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    AI Match Score & Recommendation
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {selectedCandidate.application?.explanation ||
                      'Semantic suitability score computed against job description.'}
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-indigo-700 ml-4">
                  {selectedCandidate.application?.matchScore}%
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Extracted Technical Skills ({selectedCandidate.skills?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Education
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {selectedCandidate.education?.[0]?.degree || 'Not detected'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Experience
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {selectedCandidate.yearsOfExperience} Years Detected
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                {selectedCandidate.resumePath ? (
                  <a
                    href={`/uploads/${selectedCandidate.resumePath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Resume</span>
                  </a>
                ) : (
                  <div></div>
                )}

                <Link
                  to={`/candidates/${selectedCandidate._id}`}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
                >
                  <BrainCircuit className="h-3.5 w-3.5" />
                  <span>Full AI Report</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
