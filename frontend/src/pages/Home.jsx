import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Server,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Activity,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [healthStatus, setHealthStatus] = useState({
    loading: false,
    checked: false,
    success: false,
    message: '',
    dbConnected: false,
    dbStatus: 'checking',
    timestamp: null,
  });

  const checkHealth = async () => {
    setHealthStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await axios.get('/api/health');
      setHealthStatus({
        loading: false,
        checked: true,
        success: res.data?.success || false,
        message: res.data?.message || 'API responded successfully',
        dbConnected: res.data?.database?.connected || false,
        dbStatus: res.data?.database?.status || 'unknown',
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setHealthStatus({
        loading: false,
        checked: true,
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to connect to backend API',
        dbConnected: false,
        dbStatus: 'disconnected',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12 bg-white">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Recruitment Intelligence Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          AI-Based Resume Screening &{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Candidate Shortlisting
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 leading-relaxed">
          A next-generation full-stack platform designed to help recruiters create job requirements,
          process multi-format resumes, compute explainable AI match scores, and streamline candidate shortlisting.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
            >
              <span>Go to Recruiter Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25"
              >
                <span>Register as Recruiter</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-sm transition border border-slate-300"
              >
                <Lock className="h-4 w-4 text-indigo-600" />
                <span>Recruiter Login</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Live System Health & DB Card */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">System & Database Status</h2>
              <p className="text-sm text-slate-500">
                Backend endpoint:{' '}
                <code className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs font-mono border border-indigo-100">
                  GET /api/health
                </code>
              </p>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={healthStatus.loading}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${healthStatus.loading ? 'animate-spin' : ''}`} />
            <span>{healthStatus.loading ? 'Verifying...' : 'Re-check Health'}</span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Express API Server
            </div>
            <div className="mt-2 flex items-center space-x-2">
              {healthStatus.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Online (Port 5000)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-700 font-semibold">Standby / Unreachable</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              MongoDB Connection
            </div>
            <div className="mt-2 flex items-center space-x-2">
              {healthStatus.dbConnected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Connected (Active)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-amber-700 font-semibold capitalize">
                    {healthStatus.dbStatus || 'Disconnected'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              API Message
            </div>
            <div className="mt-2 text-sm font-mono text-slate-800 truncate">
              {healthStatus.message || 'Waiting for check...'}
            </div>
          </div>
        </div>
      </section>

      {/* 3-Tier Architecture Overview */}
      <section className="pb-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Three-Tier Decoupled Architecture
          </h2>
          <p className="text-slate-500 text-sm mt-1">Modular college project engineering blueprint</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition border border-indigo-100">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">1. Frontend UI</h3>
            <p className="text-xs text-indigo-600 font-semibold mt-0.5">React • Vite • Tailwind • Lucide</p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Recruiter portal providing intuitive job management, candidate analytics, interactive score cards, and responsive workflow.
            </p>
          </div>

          {/* Backend */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-violet-400 hover:shadow-lg transition group">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4 group-hover:scale-105 transition border border-violet-100">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. Backend Core</h3>
            <p className="text-xs text-violet-600 font-semibold mt-0.5">Node.js • Express • MongoDB • JWT</p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Secure REST API managing recruiter auth, job postings, multi-part file uploads (PDF/DOCX), and database records.
            </p>
          </div>

          {/* AI Service */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-pink-400 hover:shadow-lg transition group">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-105 transition border border-pink-100">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. AI Engine</h3>
            <p className="text-xs text-pink-600 font-semibold mt-0.5">Python • FastAPI • NLP Embeddings</p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Autonomous microservice responsible for semantic NLP matching, skills delta computation, and explainable match score generation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
