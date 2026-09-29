const axios = require('axios');
require('dotenv').config();
const connectDB = require('./config/db');

const AI_URL = 'http://127.0.0.1:8000';
const BACKEND_URL = 'http://localhost:5000/api';

async function runAiMatchingTests() {
  await connectDB();
  console.log('--- Starting Phase 9 & 10 AI Matching & Microservice Test Suite ---\n');

  try {
    // 1. Check AI Microservice Health
    console.log('[1/4] Checking FastAPI AI Service Health (GET /health)...');
    const healthRes = await axios.get(`${AI_URL}/health`);
    console.log('✅ FastAPI AI Service is online:', healthRes.data);

    // 2. Direct AI Microservice Analysis Test
    console.log('\n[2/4] Testing Direct AI Analysis Endpoint (POST /analyze)...');
    const testPayload = {
      resume_text: `
        Rahul Sharma
        Senior Frontend & Backend Engineer
        Email: rahul.sharma@example.com Phone: +91 9876543210
        Summary: 2 years experienced software engineer building web applications with React, Node.js, and MongoDB.
        Education: B.Tech Computer Science and Engineering
        Skills: React, Node.js, MongoDB, JavaScript, Express, Git
        Projects: Built an E-Commerce portal with real-time checkout and MongoDB indexing.
      `,
      job_description: `
        Seeking a Full Stack Developer proficient in React, Node.js, MongoDB, and JavaScript.
        Candidate should possess AWS cloud experience and Docker knowledge.
      `,
      required_skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
      preferred_skills: ['AWS', 'Docker'],
      required_experience: 2.0
    };

    const analyzeRes = await axios.post(`${AI_URL}/analyze`, testPayload);
    const aiData = analyzeRes.data;

    console.log('✅ AI Match Analysis Successful:');
    console.log(`   Match Score: ${aiData.match_score}%`);
    console.log(`   Recommendation: ${aiData.recommendation}`);
    console.log(`   Matched Required Skills: ${aiData.matched_skills.join(', ')}`);
    console.log(`   Missing Skills: ${aiData.missing_skills.length > 0 ? aiData.missing_skills.join(', ') : 'None'}`);
    console.log(`   Experience Analysis: ${aiData.experience_analysis}`);
    console.log(`   Education Analysis: ${aiData.education_analysis}`);
    console.log(`   Project Analysis: ${aiData.project_analysis}`);
    console.log(`   Natural Language Explanation:\n   "${aiData.explanation}"`);

    // 3. Node.js AI Service Wrapper Test
    console.log('\n[3/4] Testing Node.js aiService Client Wrapper...');
    const { analyzeResumeWithAI } = require('./services/aiService');
    const clientResult = await analyzeResumeWithAI({
      resumeText: testPayload.resume_text,
      jobDescription: testPayload.job_description,
      requiredSkills: testPayload.required_skills,
      preferredSkills: testPayload.preferred_skills,
      requiredExperience: testPayload.required_experience
    });
    console.log('✅ Node.js client received response from source:', clientResult.source);
    console.log(`   Calculated Match Score: ${clientResult.data.match_score}%`);

    // 4. End-to-End Application Re-analysis Endpoint Test
    console.log('\n[4/4] Testing Application AI Analysis API (POST /api/applications/:id/analyze)...');
    // Register recruiter and create job + application to test re-analysis
    const recruiterData = {
      name: 'AI Test Recruiter',
      email: `airecruiter_${Date.now()}@test.org`,
      password: 'Password123!',
      company: 'AI Recruitment Inc'
    };
    const authRes = await axios.post(`${BACKEND_URL}/auth/register`, recruiterData);
    const token = authRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const jobRes = await axios.post(
      `${BACKEND_URL}/jobs`,
      {
        title: 'Full Stack Developer',
        department: 'Engineering',
        description: testPayload.job_description,
        requiredSkills: testPayload.required_skills,
        preferredSkills: testPayload.preferred_skills,
        education: 'B.Tech',
        location: 'Remote',
        employmentType: 'Full-time'
      },
      authHeaders
    );

    const Candidate = require('./models/Candidate');
    const Application = require('./models/Application');

    const candidate = await Candidate.create({
      name: 'Rahul Sharma',
      email: `rahul_${Date.now()}@example.com`,
      resumePath: 'test.pdf',
      extractedText: testPayload.resume_text,
      skills: ['React', 'Node.js', 'MongoDB', 'JavaScript']
    });

    const application = await Application.create({
      candidate: candidate._id,
      job: jobRes.data.job._id,
      matchScore: 0,
      status: 'New'
    });

    const reanalyzeRes = await axios.post(
      `${BACKEND_URL}/applications/${application._id}/analyze`,
      {},
      authHeaders
    );

    console.log('✅ Backend Re-analyze API SUCCESS:');
    console.log(`   Updated Application Match Score: ${reanalyzeRes.data.application.matchScore}%`);
    console.log(`   AI Recommendation: ${reanalyzeRes.data.application.aiAnalysis.recommendation}`);
    console.log(`   Explanation: "${reanalyzeRes.data.application.explanation.substring(0, 80)}..."`);

    // Cleanup test records
    await Application.deleteOne({ _id: application._id });
    await Candidate.deleteOne({ _id: candidate._id });

    console.log('\n🎉 ALL 4 AI SERVICE & SEMANTIC MATCHING TESTS PASSED PERFECTLY!');
  } catch (error) {
    console.error('AI Matching test suite failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runAiMatchingTests();
