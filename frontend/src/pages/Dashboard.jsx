import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  Users,
  FileCheck,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Building,
  TrendingUp,
  XCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/dashboard/stats');
      if (res.data?.success) {
        setStatsData(res.data);
      }
    } catch (err) {
      console.error('Fetch dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = statsData?.stats || {
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    shortlistedCandidates: 0,
    underReviewCandidates: 0,
    rejectedCandidates: 0,
    shortlistRate: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-50 via-purple-50 to-white border border-indigo-100 p-8 shadow-sm mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>Recruiter Management Console</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Recruiter'}!
            </h1>
            <p className="text-slate-600 text-sm mt-1 flex items-center gap-2">
              <span>{user?.email}</span>
              {user?.company && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                    <Building className="h-3.5 w-3.5 text-indigo-600" />
                    {user?.company}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/jobs/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-md shadow-indigo-600/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create New Job</span>
            </Link>

            <button
              onClick={fetchStats}
              title="Refresh Stats"
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Total Jobs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Jobs</span>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalJobs}</div>
          <div className="text-[11px] text-slate-500 mt-1">Positions created</div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Jobs</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{stats.activeJobs}</div>
          <div className="text-[11px] text-slate-500 mt-1">Accepting resumes</div>
        </div>

        {/* Total Candidates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Candidates</span>
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.totalCandidates}</div>
          <div className="text-[11px] text-slate-500 mt-1">Applications logged</div>
        </div>

        {/* Candidates Under Review */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Under Review</span>
            <FileCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{stats.underReviewCandidates}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending evaluation</div>
        </div>

        {/* Shortlisted */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Shortlisted</span>
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{stats.shortlistedCandidates}</div>
          <div className="text-[11px] text-slate-500 mt-1">AI & recruiter approved</div>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600">{stats.rejectedCandidates}</div>
          <div className="text-[11px] text-slate-500 mt-1">Unmatched criteria</div>
        </div>
      </div>

      {/* Visual Analytics & Recent Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Shortlisting Funnel & Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Application Funnel</h2>
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Shortlisted Candidates</span>
                <span className="text-emerald-600 font-bold">{stats.shortlistedCandidates}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: stats.totalCandidates > 0 ? `${(stats.shortlistedCandidates / stats.totalCandidates) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Under Review</span>
                <span className="text-amber-600 font-bold">{stats.underReviewCandidates}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: stats.totalCandidates > 0 ? `${(stats.underReviewCandidates / stats.totalCandidates) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Rejected Candidates</span>
                <span className="text-rose-600 font-bold">{stats.rejectedCandidates}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: stats.totalCandidates > 0 ? `${(stats.rejectedCandidates / stats.totalCandidates) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
            <span className="text-xs text-indigo-700 uppercase font-bold tracking-wider">Shortlist Conversion Rate</span>
            <div className="text-3xl font-extrabold text-indigo-700 mt-1">
              {stats.shortlistRate}%
            </div>
          </div>
        </div>

        {/* Recent Job Postings */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Job Postings</h2>
                <p className="text-xs text-slate-500">Manage active screening pipelines</p>
              </div>
              <Link
                to="/jobs"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                <span>View All ({stats.totalJobs})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {statsData?.recentJobs?.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-500">No job postings created yet.</p>
                <Link
                  to="/jobs/create"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-indigo-600 font-semibold hover:underline"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create your first job posting</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {statsData?.recentJobs?.map((job) => (
                  <div
                    key={job._id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition">
                          {job.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                          {job.department}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {job.location} • {job.employmentType}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          {job.totalApplicants}
                        </div>
                        <div className="text-[10px] text-slate-500">Applicants</div>
                      </div>

                      <Link
                        to={`/jobs/${job._id}`}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">Ready to accept candidate resumes?</span>
            <Link
              to="/jobs/create"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Post New Role</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
