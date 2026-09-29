const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api';

// Minimal valid PDF generator
function createSamplePdf(name, email, phone, skills, edu, exp) {
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

async function runResumeTests() {
  console.log('--- Starting Phase 6 & 7 Resume Upload & Extraction Test Suite ---\n');

  try {
    // 1. Authenticate Recruiter
    console.log('[1/7] Registering recruiter for resume pipeline testing...');
    const recruiterData = {
      name: 'Elena Rostova (Lead Recruiter)',
      email: `resumerecruiter_${Date.now()}@aitalent.com`,
      password: 'Password123!',
      company: 'TalentAI Labs'
    };
    const authRes = await axios.post(`${BASE_URL}/auth/register`, recruiterData);
    const token = authRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Recruiter authenticated with token');

    // 2. Create Job
    console.log('\n[2/7] Creating target job posting (POST /api/jobs)...');
    const jobRes = await axios.post(
      `${BASE_URL}/jobs`,
      {
        title: 'Full Stack Developer',
        department: 'Engineering',
        description: 'Building scalable microservices and React web applications.',
        requiredSkills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
        preferredSkills: ['FastAPI', 'Docker', 'AWS'],
        experience: { min: 1, max: 4 },
        education: 'B.Tech / B.E. Computer Science',
        location: 'Bangalore, India',
        employmentType: 'Full-time'
      },
      authHeaders
    );
    const jobId = jobRes.data.job._id;
    console.log('✅ Target job created:', jobRes.data.job.title, `(ID: ${jobId})`);

    // 3. Prepare Sample PDF Resumes
    console.log('\n[3/7] Generating sample test resumes (Rahul Sharma & Priya Singh)...');
    const tempDir = path.join(__dirname, 'temp_test_resumes');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const pdf1Path = path.join(tempDir, 'Rahul_Sharma_Resume.pdf');
    fs.writeFileSync(
      pdf1Path,
      createSamplePdf(
        'Rahul Sharma',
        'rahul.sharma@example.com',
        '+91 9876543210',
        'React, Node.js, MongoDB, JavaScript, Express',
        'B.Tech Computer Science',
        '2 years of experience as Full Stack Engineer'
      )
    );

    const pdf2Path = path.join(tempDir, 'Priya_Singh_Resume.pdf');
    fs.writeFileSync(
      pdf2Path,
      createSamplePdf(
        'Priya Singh',
        'priya.singh@example.com',
        '+91 9811223344',
        'Python, FastAPI, Docker, PostgreSQL, React',
        'M.Tech Computer Engineering',
        '3.5 years of experience in backend development'
      )
    );

    console.log('✅ Sample PDF resumes generated on disk');

    // 4. Multi-File Upload & Text Extraction
    console.log('\n[4/7] Uploading multi-file batch (POST /api/jobs/:jobId/resumes)...');
    const form = new FormData();
    form.append('resumes', fs.createReadStream(pdf1Path));
    form.append('resumes', fs.createReadStream(pdf2Path));

    const uploadRes = await axios.post(`${BASE_URL}/jobs/${jobId}/resumes`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Upload & Processing SUCCESS:', uploadRes.status);
    console.log(`   Processed ${uploadRes.data.processedCount} resumes:`);
    uploadRes.data.results.forEach((r, idx) => {
      console.log(`   Candidate ${idx + 1}: ${r.name} (${r.email})`);
      console.log(`     Skills Found: ${r.skillsFound} (${r.matchedSkills.join(', ')})`);
      console.log(`     Baseline Match Score: ${r.baselineScore}%`);
    });

    // 5. Query Candidates for Job
    console.log(`\n[5/7] Querying Candidate Applications (GET /api/jobs/${jobId}/candidates)...`);
    const candidatesRes = await axios.get(`${BASE_URL}/jobs/${jobId}/candidates`, authHeaders);
    console.log('✅ Candidate applications retrieved:', candidatesRes.data.count, 'applicants found');
    const firstApplication = candidatesRes.data.applications[0];
    const candidateId = firstApplication.candidate._id;
    const applicationId = firstApplication._id;

    // 6. Query Single Candidate Profile
    console.log(`\n[6/7] Querying Candidate Profile (GET /api/candidates/${candidateId})...`);
    const singleCandRes = await axios.get(`${BASE_URL}/candidates/${candidateId}`, authHeaders);
    console.log('✅ Candidate profile retrieved:');
    console.log('   Name:', singleCandRes.data.candidate.name);
    console.log('   Extracted Education:', singleCandRes.data.candidate.education);
    console.log('   Years Exp:', singleCandRes.data.candidate.yearsOfExperience);
    console.log('   Resume Download URL:', singleCandRes.data.candidate.resumeDownloadUrl);

    // 7. Update Application Status (Recruiter Review)
    console.log(`\n[7/7] Updating Candidate Status to 'Shortlisted' (PUT /api/applications/${applicationId}/status)...`);
    const statusRes = await axios.put(
      `${BASE_URL}/applications/${applicationId}/status`,
      { status: 'Shortlisted' },
      authHeaders
    );
    console.log('✅ Status update SUCCESS:', statusRes.data.message);
    console.log('   New Application Status:', statusRes.data.application.status);

    // Clean up temporary resumes
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log('\n🎉 ALL 7 RESUME UPLOAD & EXTRACTION PIPELINE TESTS PASSED PERFECTLY!');
  } catch (error) {
    console.error('Resume test suite failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runResumeTests();
