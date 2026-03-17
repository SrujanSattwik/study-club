// Test script for backend authentication system
// Run with: node test-auth-system.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

// Test utilities
function log(message, data = null) {
  console.log(`\n✅ ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function error(message, err) {
  console.error(`\n❌ ${message}`);
  console.error(err.response?.data || err.message);
}

// Test 1: Login
async function testLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    authToken = response.data.token;
    log('Login successful', response.data);
    return true;
  } catch (err) {
    error('Login failed', err);
    return false;
  }
}

// Test 2: Dashboard (without auth)
async function testDashboardNoAuth() {
  try {
    await axios.get(`${BASE_URL}/api/dashboard`);
    error('Dashboard should require authentication!', {});
    return false;
  } catch (err) {
    if (err.response?.status === 401) {
      log('Dashboard correctly requires authentication');
      return true;
    }
    error('Unexpected error', err);
    return false;
  }
}

// Test 3: Dashboard (with auth)
async function testDashboard() {
  try {
    const response = await axios.get(`${BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log('Dashboard data retrieved', response.data);
    return true;
  } catch (err) {
    error('Dashboard request failed', err);
    return false;
  }
}

// Test 4: Track view
async function testTrackView() {
  try {
    const materialId = 'test-material-123';
    const response = await axios.post(
      `${BASE_URL}/api/materials/${materialId}/view`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('View tracked successfully', response.data);
    return true;
  } catch (err) {
    error('Track view failed', err);
    return false;
  }
}

// Test 5: Track download
async function testTrackDownload() {
  try {
    const materialId = 'test-material-123';
    const response = await axios.post(
      `${BASE_URL}/api/materials/${materialId}/download`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('Download tracked successfully', response.data);
    return true;
  } catch (err) {
    error('Track download failed', err);
    return false;
  }
}

// Test 6: Update progress
async function testUpdateProgress() {
  try {
    const materialId = 'test-material-123';
    const response = await axios.post(
      `${BASE_URL}/api/materials/${materialId}/progress`,
      { progress: 75 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('Progress updated successfully', response.data);
    return true;
  } catch (err) {
    error('Update progress failed', err);
    return false;
  }
}

// Test 7: Dashboard after activity
async function testDashboardAfterActivity() {
  try {
    const response = await axios.get(`${BASE_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log('Dashboard data after activity', response.data);
    return true;
  } catch (err) {
    error('Dashboard request failed', err);
    return false;
  }
}

// Test 8: Logout
async function testLogout() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('Logout successful', response.data);
    return true;
  } catch (err) {
    error('Logout failed', err);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Backend Authentication System Tests\n');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // Test sequence
  results.push(await testLogin());
  results.push(await testDashboardNoAuth());
  results.push(await testDashboard());
  results.push(await testTrackView());
  results.push(await testTrackDownload());
  results.push(await testUpdateProgress());
  results.push(await testDashboardAfterActivity());
  results.push(await testLogout());
  
  // Summary
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed. Check the output above.');
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
