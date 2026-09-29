const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const testRecruiter = {
  name: 'Sarah Connor Recruiter',
  email: `jobrecruiter_${Date.now()}@techdefense.org`,
  password: 'Password123!',
  company: 'Cyberdyne Systems'
};

async function runJobTests() {
  console.log('--- Starting Phase 4 & 5 Job Management & Dashboard Test Suite ---\n');

  try {
    // 1. Register recruiter and get token
    console.log('[1/7] Registering recruiter for testing...');
    const authRes = await axios.post(`${BASE_URL}/auth/register`, testRecruiter);
    const token = authRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Recruiter authenticated with token');

    // 2. Create Job Posting
    console.log('\n[2/7] Creating Job Posting (POST /api/jobs)...');
    const newJobPayload = {
      title: 'Senior Full Stack AI Engineer',
      department: 'Engineering',
      description: 'Lead development of next-gen AI search pipelines and scalable web applications.',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Python'],
      preferredSkills: ['FastAPI', 'Docker', 'AWS'],
      experience: { min: 2, max: 6 },
      education: 'B.Tech / B.E. Computer Science or equivalent',
      location: 'Bangalore, India (Hybrid)',
      employmentType: 'Full-time'
    };

    const createRes = await axios.post(`${BASE_URL}/jobs`, newJobPayload, authHeaders);
    console.log('✅ Job created:', createRes.status, createRes.data.job.title);
    const jobId = createRes.data.job._id;

    // 3. Fetch all jobs
    console.log('\n[3/7] Fetching Recruiter Jobs (GET /api/jobs)...');
    const getRes = await axios.get(`${BASE_URL}/jobs`, authHeaders);
    console.log('✅ Jobs fetched:', getRes.data.count, 'jobs found');
    console.log('   First job metrics:', getRes.data.jobs[0].metrics);

    // 4. Fetch job by ID
    console.log(`\n[4/7] Fetching Single Job (GET /api/jobs/${jobId})...`);
    const singleRes = await axios.get(`${BASE_URL}/jobs/${jobId}`, authHeaders);
    console.log('✅ Job fetched by ID:', singleRes.data.job.title, `(${singleRes.data.job.department})`);

    // 5. Update Job
    console.log(`\n[5/7] Updating Job (PUT /api/jobs/${jobId})...`);
    const updateRes = await axios.put(
      `${BASE_URL}/jobs/${jobId}`,
      {
        title: 'Lead Full Stack AI Engineer',
        preferredSkills: ['FastAPI', 'Docker', 'AWS', 'Kubernetes']
      },
      authHeaders
    );
    console.log('✅ Job updated title:', updateRes.data.job.title);
    console.log('   Preferred skills count:', updateRes.data.job.preferredSkills.length);

    // 6. Fetch Dashboard Statistics
    console.log('\n[6/7] Fetching Dashboard Metrics (GET /api/dashboard/stats)...');
    const statsRes = await axios.get(`${BASE_URL}/dashboard/stats`, authHeaders);
    console.log('✅ Dashboard stats fetched:');
    console.log('   Total jobs:', statsRes.data.stats.totalJobs);
    console.log('   Active jobs:', statsRes.data.stats.activeJobs);
    console.log('   Total candidates:', statsRes.data.stats.totalCandidates);

    // 7. Delete Job
    console.log(`\n[7/7] Deleting Job (DELETE /api/jobs/${jobId})...`);
    const delRes = await axios.delete(`${BASE_URL}/jobs/${jobId}`, authHeaders);
    console.log('✅ Job deleted successfully:', delRes.data.message);

    console.log('\n🎉 ALL 7 JOB CRUD & DASHBOARD STATS TESTS PASSED PERFECTLY!');
  } catch (error) {
    console.error('Job test suite failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runJobTests();
