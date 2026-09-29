import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobsList from './pages/JobsList';
import JobCreate from './pages/JobCreate';
import JobDetails from './pages/JobDetails';
import ResumeUpload from './pages/ResumeUpload';
import JobCandidates from './pages/JobCandidates';
import CandidateDetails from './pages/CandidateDetails';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <JobsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/create"
                element={
                  <ProtectedRoute>
                    <JobCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id"
                element={
                  <ProtectedRoute>
                    <JobDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id/upload"
                element={
                  <ProtectedRoute>
                    <ResumeUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id/candidates"
                element={
                  <ProtectedRoute>
                    <JobCandidates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidates/:id"
                element={
                  <ProtectedRoute>
                    <CandidateDetails />
                  </ProtectedRoute>
                }
              />
              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
            <p>AI-Based Resume Screening and Candidate Shortlisting System • College Project 2026</p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}
