require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const mongoose = require('mongoose');
const { app } = require('./server');

// Minimal valid PDF generator for testing
function createTestPdf(name, email, phone, skills, edu, exp, projectSummary) {
  const content = `BT
/F1 12 Tf
72 712 Td
(${name}) Tj
0 -20 Td
(Email: ${email} Phone: ${phone}) Tj
0 -20 Td
(Technical Skills: ${skills}) Tj
0 -20 Td
(Education: ${edu}) Tj
0 -20 Td
(Experience: ${exp}) Tj
0 -20 Td
(Projects: ${projectSummary}) Tj
ET`;

  const streamLength = Buffer.byteLength(content, 'utf8');

  return `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamLength} >> stream
${content}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;
}

async function runEndToEndTests() {
  console.log('================================================================');
  console.log('🚀 AI RESUME SCREENER — COMPLETE END-TO-END SYSTEM INTEGRATION TEST');
  console.log('================================================================\n');

  let testServer;
  let testPort = 5055;
  const baseUrl = `http://localhost:${testPort}/api`;

  try {
    // Wait until MongoDB connection is fully established
    while (mongoose.connection.readyState !== 1) {
      await new Promise((r) => setTimeout(r, 150));
    }

    // Start in-process server for deterministic testing
    testServer = await new Promise((resolve) => {
      const s = app.listen(testPort, () => {
        console.log(`📡 In-process test server listening on http://localhost:${testPort}`);
        resolve(s);
      });
    });

    // 1. HEALTH CHECK
    console.log('\n[STAGE 1/11] System Health & Database Connectivity Check...');
    const healthRes = await axios.get(`${baseUrl}/health`);
    if (healthRes.status === 200 && healthRes.data.database?.connected === true) {
      console.log('✅ Health Check Passed: System and MongoDB are fully operational.');
    } else {
      throw new Error(`Health check failed: ${JSON.stringify(healthRes.data)}`);
    }

    // 2. RECRUITER REGISTRATION
    console.log('\n[STAGE 2/11] Recruiter Account Registration (POST /api/auth/register)...');
    const timestamp = Date.now();
    const testRecruiter = {
      name: 'Dr. Jane Foster (Talent Director)',
      email: `e2e_recruiter_${timestamp}@talentai.edu`,
      password: 'Password123!',
      company: 'TechSphere Global'
    };
    const regRes = await axios.post(`${baseUrl}/auth/register`, testRecruiter);
    const token = regRes.data.token;
    if (!token) throw new Error('Failed to obtain JWT token on registration');
    console.log(`✅ Recruiter registered: "${regRes.data.user.name}" (${regRes.data.user.email})`);
    console.log(`✅ JWT Token issued: ${token.substring(0, 24)}...`);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 3. RECRUITER LOGIN & PROFILE VERIFICATION
    console.log('\n[STAGE 3/11] Recruiter Login & Protected Profile Retrieval...');
    const loginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: testRecruiter.email,
      password: testRecruiter.password
    });
    if (loginRes.data.token) {
      console.log('✅ Login verified with bcrypt password matching.');
    }
    const meRes = await axios.get(`${baseUrl}/auth/me`, authHeaders);
    console.log(`✅ Protected route /api/auth/me confirmed for user: ${meRes.data.user.name}`);

    // 4. CREATE JOB POSTING
    console.log('\n[STAGE 4/11] Creating New Job Posting (POST /api/jobs)...');
    const newJob = {
      title: 'Full Stack AI Developer',
      department: 'Platform Engineering',
      description: 'We are seeking a Full Stack AI Developer proficient in React, Node.js, MongoDB, and Python. Experience with Docker, FastAPI, and Cloud deployments is preferred. Minimum 2 years of relevant experience.',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Python'],
      preferredSkills: ['FastAPI', 'Docker', 'AWS'],
      experience: { min: 2, max: 5 },
      education: 'B.Tech / B.E. Computer Science or equivalent',
      location: 'Remote',
      employmentType: 'Full-time'
    };
    const jobRes = await axios.post(`${baseUrl}/jobs`, newJob, authHeaders);
    const job = jobRes.data.job;
    const jobId = job._id;
    console.log(`✅ Job created successfully: "${job.title}" [ID: ${jobId}]`);
    console.log(`   Required Skills: ${job.requiredSkills.join(', ')}`);
    console.log(`   Preferred Skills: ${job.preferredSkills.join(', ')}`);

    // 5. RESUME SYNTHESIS & MULTI-CANDIDATE UPLOAD
    console.log('\n[STAGE 5/11] Synthesizing & Uploading Multi-Candidate Resumes (POST /api/jobs/:id/resumes)...');
    const tempDir = path.join(__dirname, 'temp_test_resumes');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Candidate 1: High Match
    const cand1Pdf = path.join(tempDir, 'candidate_high_match.pdf');
    fs.writeFileSync(
      cand1Pdf,
      createTestPdf(
        'Aarav Sharma',
        `aarav_${timestamp}@gmail.com`,
        '+91 9876543210',
        'React, Node.js, MongoDB, Python, Docker, JavaScript, Git',
        'B.Tech in Computer Science and Engineering',
        '3 years software developer building scalable microservices and React frontends',
        'Built full-stack AI resume screener and microservices portal'
      )
    );

    // Candidate 2: Low/Partial Match
    const cand2Pdf = path.join(tempDir, 'candidate_low_match.pdf');
    fs.writeFileSync(
      cand2Pdf,
      createTestPdf(
        'Vikram Roy',
        `vikram_${timestamp}@gmail.com`,
        '+91 9123456789',
        'C++, SQL, PHP, HTML',
        'Diploma in IT',
        '1 year of junior web assistance',
        'Maintained static landing pages in WordPress and PHP'
      )
    );

    const formData = new FormData();
    formData.append('resumes', fs.createReadStream(cand1Pdf));
    formData.append('resumes', fs.createReadStream(cand2Pdf));

    const uploadRes = await axios.post(`${baseUrl}/jobs/${jobId}/resumes`, formData, {
      headers: {
        ...authHeaders.headers,
        ...formData.getHeaders()
      }
    });

    console.log(`✅ Multi-resume upload processed: ${uploadRes.data.processedCount} resumes.`);
    uploadRes.data.results.forEach((r, idx) => {
      console.log(`   Candidate ${idx + 1}: ${r.name} (${r.email}) -> Match Score: ${r.baselineScore}%, Recommendation: "${r.recommendation}"`);
    });

    // Clean up temporary files
    try {
      fs.unlinkSync(cand1Pdf);
      fs.unlinkSync(cand2Pdf);
      fs.rmdirSync(tempDir);
    } catch (_) {}

    // 6. PIPELINE VERIFICATION & AI SCORING
    console.log('\n[STAGE 6/11] Inspecting AI Scoring & Pipeline Ordering (GET /api/jobs/:id/candidates)...');
    const pipelineRes = await axios.get(`${baseUrl}/jobs/${jobId}/candidates`, authHeaders);
    const applications = pipelineRes.data.applications;
    console.log(`✅ Retrieved ${applications.length} applications in candidate pipeline.`);

    const app1 = applications[0]; // Highest score first
    const app2 = applications[1];

    console.log(`   Top Candidate: ${app1.candidate.name} with Score ${app1.matchScore}%`);
    console.log(`   Matched Skills: [${app1.matchedSkills.join(', ')}]`);
    console.log(`   Missing Skills: [${app1.missingSkills.join(', ')}]`);
    console.log(`   AI Natural Language Explanation: "${app1.explanation?.substring(0, 100)}..."`);

    if (app1.matchScore < app2.matchScore) {
      throw new Error('Default sorting failed: Candidates not ranked descending by match score');
    }
    console.log('✅ Candidate ranking verified: Highest match score sorted first.');

    // 7. MINIMUM SCORE THRESHOLD FILTERING
    console.log('\n[STAGE 7/11] Testing Threshold Filtering (minScore=70)...');
    const filteredRes = await axios.get(`${baseUrl}/jobs/${jobId}/candidates?minScore=70`, authHeaders);
    console.log(`✅ Filtered applications (minScore >= 70%): ${filteredRes.data.applications.length} candidates returned.`);
    filteredRes.data.applications.forEach(a => {
      if (a.matchScore < 70) throw new Error(`Threshold filter error: found score ${a.matchScore} < 70`);
    });

    // 8. INDIVIDUAL CANDIDATE STATUS UPDATE (SHORTLIST)
    console.log('\n[STAGE 8/11] Human-in-the-Loop Recruiter Shortlisting (PUT /api/applications/:id/status)...');
    const shortlistRes = await axios.put(
      `${baseUrl}/applications/${app1._id}/status`,
      { status: 'Shortlisted' },
      authHeaders
    );
    console.log(`✅ Candidate "${app1.candidate.name}" status updated to: ${shortlistRes.data.application.status}`);

    // 9. BATCH APPLICATION STATUS UPDATE
    console.log('\n[STAGE 9/11] Batch Candidate Status Update (PUT /api/applications/batch-status)...');
    const batchRes = await axios.put(
      `${baseUrl}/applications/batch-status`,
      {
        applicationIds: [app2._id],
        status: 'Under Review'
      },
      authHeaders
    );
    console.log(`✅ Batch update completed: ${batchRes.data.message}`);

    // 10. CANDIDATE PROFILE & AI RE-ANALYSIS
    console.log('\n[STAGE 10/11] Candidate Profile Inspection & Re-Analysis (POST /api/applications/:id/analyze)...');
    const candDetailRes = await axios.get(`${baseUrl}/candidates/${app1.candidate._id}`, authHeaders);
    console.log(`✅ Candidate Profile Retrieved: ${candDetailRes.data.candidate.name}`);
    console.log(`   Resume Download URL: ${candDetailRes.data.candidate.resumeDownloadUrl}`);

    const reanalyzeRes = await axios.post(`${baseUrl}/applications/${app1._id}/analyze`, {}, authHeaders);
    console.log(`✅ AI Re-Analysis Succeeded: Score ${reanalyzeRes.data.application.matchScore}%, Source: ${reanalyzeRes.data.aiAnalysisSource}`);

    // 11. DASHBOARD ANALYTICS & STATS
    console.log('\n[STAGE 11/11] Recruiter Dashboard Metrics (GET /api/dashboard/stats)...');
    const statsRes = await axios.get(`${baseUrl}/dashboard/stats`, authHeaders);
    const stats = statsRes.data.stats;
    console.log('✅ Dashboard Analytics:');
    console.log(`   Total Jobs Created: ${stats.totalJobs}`);
    console.log(`   Active Jobs: ${stats.activeJobs}`);
    console.log(`   Total Candidates: ${stats.totalCandidates}`);
    console.log(`   Shortlisted: ${stats.shortlistedCandidates}`);
    console.log(`   Under Review: ${stats.underReviewCandidates}`);
    console.log(`   Shortlist Rate: ${stats.shortlistRate}%`);

    console.log('\n================================================================');
    console.log('🎉 ALL 11 END-TO-END INTEGRATION TEST STAGES COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ E2E Integration Test Failed with error:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    if (testServer) {
      testServer.close();
      console.log('🛑 In-process test server shut down cleanly.');
    }
    // Close mongoose connection if active
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

runEndToEndTests();
