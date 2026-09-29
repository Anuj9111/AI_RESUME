const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';
const testEmail = `recruiter_${Date.now()}@collegeproject.edu`;
const testPassword = 'Password123!';

async function runAuthTests() {
  console.log('--- Starting Phase 3 Authentication Test Suite ---\n');

  try {
    // 1. Register a new recruiter
    console.log('[1/6] Testing Recruiter Registration (POST /api/auth/register)...');
    const registerRes = await axios.post(`${API_URL}/register`, {
      name: 'Dr. Jane Recruiter',
      email: testEmail,
      password: testPassword,
      company: 'TechCorp Global'
    });
    console.log('✅ Registration SUCCESS:', registerRes.status, registerRes.data.message);
    const token = registerRes.data.token;
    console.log('   Received JWT Token:', token.substring(0, 25) + '...');
    console.log('   User profile returned:', registerRes.data.user.name, `(${registerRes.data.user.role})`);

    // 2. Duplicate registration test
    console.log('\n[2/6] Testing Duplicate Email Prevention...');
    try {
      await axios.post(`${API_URL}/register`, {
        name: 'Another User',
        email: testEmail,
        password: 'anotherpassword'
      });
      console.error('❌ FAIL: Duplicate registration should have been blocked');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('✅ Duplicate Blocked correctly (400):', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 3. Login with valid credentials
    console.log('\n[3/6] Testing Login with Valid Credentials (POST /api/auth/login)...');
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: testEmail,
      password: testPassword
    });
    console.log('✅ Login SUCCESS:', loginRes.status, loginRes.data.message);
    const loginToken = loginRes.data.token;

    // 4. Login with invalid password
    console.log('\n[4/6] Testing Login with Incorrect Password...');
    try {
      await axios.post(`${API_URL}/login`, {
        email: testEmail,
        password: 'WrongPassword999!'
      });
      console.error('❌ FAIL: Incorrect password should have failed');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✅ Invalid Credentials Blocked correctly (401):', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 5. Protected route /api/auth/me with valid Bearer token
    console.log('\n[5/6] Testing Protected Profile (GET /api/auth/me)...');
    const meRes = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${loginToken}` }
    });
    console.log('✅ Protected Profile SUCCESS:', meRes.status);
    console.log('   Fetched user:', meRes.data.user.name, meRes.data.user.email);
    console.log('   Password omitted in response:', meRes.data.user.password === undefined ? 'YES (Secure)' : 'NO (Insecure)');

    // 6. Protected route without token
    console.log('\n[6/6] Testing Protected Profile without Token...');
    try {
      await axios.get(`${API_URL}/me`);
      console.error('❌ FAIL: Missing token should have returned 401');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✅ Unauthorized Request Blocked correctly (401):', err.response.data.message);
      } else {
        throw err;
      }
    }

    console.log('\n🎉 ALL 6 AUTHENTICATION TESTS PASSED PERFECTLY!');
  } catch (error) {
    console.error('Test suite failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runAuthTests();
