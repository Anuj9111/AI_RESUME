import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, LogOut, User as UserIcon, LayoutDashboard, Briefcase, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
              AI Resume Screener
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              HR Portal
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <Link
            to="/"
            className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition ${
              isActive('/') ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                  isActive('/dashboard') ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/jobs"
                className={`flex items-center space-x-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                  isActive('/jobs') ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Jobs</span>
              </Link>

              <Link
                to="/jobs/create"
                className="hidden md:inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Post Job</span>
              </Link>

              <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-1"></div>

              <div className="flex items-center space-x-2 sm:space-x-3 pl-1 sm:pl-2">
                <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[110px]">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-indigo-600 capitalize font-medium">
                      {user?.role || 'Recruiter'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center space-x-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg transition shadow-sm shadow-indigo-600/20"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
