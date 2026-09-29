import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BrainCircuit,
  ArrowLeft,
  Mail,
  Phone,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';

export default function CandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzingId, setAnalyzingId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/candidates/${id}`);
      if (res.data?.success) {
        setCandidate(res.data.candidate);
        setApplications(res.data.applications);
      }
    } catch (err) {
      console.error('Fetch candidate error:', err);
      setError('Candidate profile not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      setStatusUpdatingId(applicationId);
      const res = await axios.put(`/api/applications/${applicationId}/status`, {
        status: newStatus
      });
      if (res.data?.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleRerunAi = async (applicationId) => {
    try {
      setAnalyzingId(applicationId);
      const res = await axios.post(`/api/applications/${applicationId}/analyze`);
      if (res.data?.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId ? res.data.application : app
          )
        );
      }
    } catch (err) {
      console.error('Re-run AI error:', err);
      alert(err.response?.data?.message || 'Failed to re-run AI matching analysis');
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 bg-white">
        <div className="h-96 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center bg-white">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error || 'Candidate Not Found'}</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
        >
          Return to Pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {candidate.resumeDownloadUrl && (
          <a
            href={candidate.resumeDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Original Resume</span>
          </a>
        )}
      </div>

      {/* Candidate Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-md shadow-indigo-600/20 shrink-0">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {candidate.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {candidate.email}
                </span>
                {candidate.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {candidate.phone}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {candidate.yearsOfExperience} Years Experience
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Extracted Technical Skills ({candidate.skills?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Extracted Academic Qualifications
            </h3>
            {candidate.education?.length > 0 ? (
              <div className="space-y-2">
                {candidate.education.map((edu, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900">{edu.degree}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{edu.college}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No formal degree tag identified.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Matching Analysis per Job Application */}
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-600" />
            <span>AI Matching & Explainable Evaluation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Section 8 multi-dimensional semantic comparison against job criteria
          </p>
        </div>

        {applications.map((app) => {
          const isAnalyzing = analyzingId === app._id;
          const ai = app.aiAnalysis || {};

          return (
            <div
              key={app._id}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative"
            >
              {/* Job Header in Application */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Application For
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {app.job?.title || 'Job Posting'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {app.job?.department} • Current Status:{' '}
                    <span className="font-bold text-slate-800">{app.status}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleRerunAi(app._id)}
                    disabled={isAnalyzing}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'Analyzing...' : 'Re-run AI Analysis'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleUpdateStatus(app._id, 'Shortlisted')}
                      disabled={statusUpdatingId === app._id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        app.status === 'Shortlisted'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app._id, 'Rejected')}
                      disabled={statusUpdatingId === app._id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        app.status === 'Rejected'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              {/* Match Score Banner */}
              <div className="mt-6 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>AI Recommendation: {ai.recommendation || 'Review'}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">
                    Overall Fit Evaluation
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    Composite score weighted across required technical skills (40%), semantic similarity (30%), experience duration (15%), education (10%), and preferred skills (5%).
                  </p>
                </div>

                <div className="text-center md:text-right shrink-0">
                  <div
                    className={`inline-block text-4xl sm:text-5xl font-extrabold px-5 py-2 rounded-2xl border ${
                      app.matchScore >= 80
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : app.matchScore >= 50
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    {app.matchScore}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 uppercase font-bold">
                    Match Score
                  </div>
                </div>
              </div>

              {/* Skills Analysis Checklist */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Skills */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Required Skills Present ({app.matchedSkills?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {app.matchedSkills?.length > 0 ? (
                      app.matchedSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold"
                        >
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No direct required skills detected.</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span>Required Skills Missing ({app.missingSkills?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {app.missingSkills?.length > 0 ? (
                      app.missingSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 font-semibold"
                        >
                          ✗ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold">
                        All required role competencies satisfied!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-Dimensional Analysis Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Experience Match
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    {ai.experienceAnalysis || 'Tenure verified against requirements.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Education Match
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    {ai.educationAnalysis || 'Academic credentials evaluated.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Project Relevance
                  </div>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    {ai.projectAnalysis || 'Practical hands-on usage verified.'}
                  </p>
                </div>
              </div>

              {/* Natural Language AI Explanation */}
              <div className="mt-6 p-5 rounded-2xl bg-indigo-50 border border-indigo-200">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-indigo-600" />
                  <span>Explainable AI Reasoning (Section 8)</span>
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed italic">
                  "{app.explanation || 'Candidate profile processed through semantic AI evaluation pipeline.'}"
                </p>
                <div className="mt-3 text-[11px] text-slate-600 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                  <span>Human-in-the-loop: Recruiter retains final shortlisting & hiring discretion.</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
