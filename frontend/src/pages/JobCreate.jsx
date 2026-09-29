import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Plus
} from 'lucide-react';

export default function JobCreate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    requiredSkills: '',
    preferredSkills: '',
    minExp: 0,
    maxExp: 3,
    education: '',
    location: '',
    employmentType: 'Full-time',
    status: 'Active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // One-click demo loader for College Project Viva
  const handleLoadExample = () => {
    setFormData({
      title: 'Full Stack Developer',
      department: 'Engineering',
      description:
        'Seeking an experienced Full Stack Developer to build and maintain modern web applications. The candidate will work with React, Node.js, and MongoDB to deliver high-performance microservices, REST APIs, and responsive recruiter workflows.',
      requiredSkills: 'React, Node.js, MongoDB, JavaScript',
      preferredSkills: 'Docker, AWS, Python, Tailwind CSS',
      minExp: 2,
      maxExp: 5,
      education: 'B.Tech / B.E. in Computer Science or equivalent',
      location: 'Bangalore, India (Hybrid)',
      employmentType: 'Full-time',
      status: 'Active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.department || !formData.description) {
      setError('Please fill in all mandatory job details');
      return;
    }

    const reqSkills = formData.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (reqSkills.length === 0) {
      setError('Please provide at least one required skill');
      return;
    }

    const prefSkills = formData.preferredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        department: formData.department.trim(),
        description: formData.description.trim(),
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        experience: {
          min: Number(formData.minExp),
          max: Number(formData.maxExp)
        },
        education: formData.education,
        location: formData.location,
        employmentType: formData.employmentType,
        status: formData.status
      };

      const res = await axios.post('/api/jobs', payload);
      if (res.data?.success) {
        navigate(`/jobs/${res.data.job._id}`);
      }
    } catch (err) {
      console.error('Job creation error:', err);
      setError(err.response?.data?.message || 'Failed to create job posting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/jobs"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Jobs</span>
        </Link>

        <button
          type="button"
          onClick={handleLoadExample}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Load Project Example (Section 5)</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Job Posting</h1>
          <p className="text-sm text-slate-500 mt-1">
            Define requirements, required technical competencies, and criteria for AI matching
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-700 text-sm">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Full Stack Developer"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Engineering, Product, Data Science"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Job Description *
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Outline role responsibilities, tech stack, and goals against which resumes will be evaluated..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition resize-y"
            ></textarea>
          </div>

          {/* Row 2: Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Required Skills *
              </label>
              <span className="block text-[11px] text-slate-500 mb-2">
                Comma-separated (e.g. React, Node.js, MongoDB, JavaScript)
              </span>
              <input
                type="text"
                name="requiredSkills"
                required
                value={formData.requiredSkills}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB, JavaScript"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Preferred / Nice-to-Have Skills
              </label>
              <span className="block text-[11px] text-slate-500 mb-2">
                Comma-separated (e.g. AWS, Docker, Python)
              </span>
              <input
                type="text"
                name="preferredSkills"
                value={formData.preferredSkills}
                onChange={handleChange}
                placeholder="AWS, Docker, Microservices"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>
          </div>

          {/* Row 3: Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Min Experience (Years)
              </label>
              <input
                type="number"
                name="minExp"
                min={0}
                max={30}
                value={formData.minExp}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Max Experience (Years)
              </label>
              <input
                type="number"
                name="maxExp"
                min={0}
                max={30}
                value={formData.maxExp}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Required Education *
              </label>
              <input
                type="text"
                name="education"
                required
                value={formData.education}
                onChange={handleChange}
                placeholder="B.Tech / B.E. Computer Science"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>
          </div>

          {/* Row 4: Location, Employment Type & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Job Location *
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="Bangalore, India (Remote / Hybrid)"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Employment Type
              </label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Posting Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition"
              >
                <option value="Active">Active (Open for Screening)</option>
                <option value="Draft">Draft (Private)</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end space-x-4">
            <Link
              to="/jobs"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-md shadow-indigo-600/20 disabled:opacity-60 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{loading ? 'Creating Job...' : 'Publish Job Posting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
