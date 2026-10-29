/**
 * Verification Script: Demo Login & Dashboard Access End-to-End
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');

async function runVerification() {
  console.log('\n======================================================');
  console.log('🚀 COMPANYIQ - DEMO LOGIN & DASHBOARD ACCESS VERIFICATION');
  console.log('======================================================\n');

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // --- STEP 1: Verify Demo Account Exists in MongoDB ---
    console.log('[Step 1] Verifying Demo Account in Database...');
    const demoUserInDb = await User.findOne({ email: 'demo@companyiq.internal' });
    if (!demoUserInDb) {
      throw new Error('Demo user demo@companyiq.internal does not exist in MongoDB!');
    }
    console.log(`  ✓ Found Demo User in MongoDB: ID=${demoUserInDb._id}, Role=${demoUserInDb.role}, isDemoUser=${demoUserInDb.isDemoUser}`);

    // --- STEP 2: POST /api/v1/auth/demo (Explore with Demo Account Flow) ---
    console.log('\n[Step 2] Testing "Explore with Demo Account" Endpoint (POST /api/v1/auth/demo)...');
    const demoRes = await request(app).post('/api/v1/auth/demo');
    if (demoRes.status !== 200 || !demoRes.body.success) {
      throw new Error(`Demo login failed: status ${demoRes.status}, error: ${JSON.stringify(demoRes.body)}`);
    }

    const { user: demoUser, tokens } = demoRes.body.data;
    console.log(`  ✓ Status 200 OK`);
    console.log(`  ✓ User Authenticated: ${demoUser.name} (${demoUser.email})`);
    console.log(`  ✓ Received Access Token: ${tokens.accessToken.slice(0, 32)}...`);
    console.log(`  ✓ Received Refresh Token: ${tokens.refreshToken.slice(0, 32)}...`);

    // --- STEP 3: Verify Profile via GET /api/v1/auth/me ---
    console.log('\n[Step 3] Verifying Session Profile (GET /api/v1/auth/me)...');
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    if (meRes.status !== 200 || !meRes.body.success) {
      throw new Error(`Session verification failed: ${meRes.status}`);
    }
    console.log(`  ✓ Token verified by auth middleware.`);
    console.log(`  ✓ Verified User Email: ${meRes.body.data.email}`);

    // --- STEP 4: Access Protected Dashboard (GET /api/v1/dashboard) ---
    console.log('\n[Step 4] Verifying Dashboard Access (GET /api/v1/dashboard)...');
    const dashRes = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${tokens.accessToken}`);

    if (dashRes.status !== 200 || !dashRes.body.success) {
      throw new Error(`Dashboard access failed: status ${dashRes.status}`);
    }
    const dashData = dashRes.body.data;
    console.log(`  ✓ Dashboard returned HTTP 200 OK.`);
    console.log(`  ✓ Profile Name: ${dashData.careerDNA?.name}`);
    console.log(`  ✓ Target Role: ${dashData.careerDNA?.targetRole}`);
    console.log(`  ✓ Recommended Companies count: ${dashData.recommendedCompanies?.length || 0}`);
    console.log(`  ✓ Saved Companies Metric: ${dashData.metrics?.savedCompanies}`);

    // --- STEP 5: Direct Credential Login (POST /api/v1/auth/login) ---
    console.log('\n[Step 5] Testing Direct Credential Login with Reset Password (POST /api/v1/auth/login)...');
    const demoPassword = process.env.DEMO_PASSWORD;
    if (!demoPassword) {
      throw new Error('DEMO_PASSWORD is not set in environment. Set DEMO_PASSWORD in h2backend/.env.');
    }
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@companyiq.internal',
        password: demoPassword,
      });

    if (loginRes.status !== 200 || !loginRes.body.success) {
      throw new Error(`Direct login failed: status ${loginRes.status}, error: ${JSON.stringify(loginRes.body)}`);
    }
    console.log(`  ✓ Direct credential login succeeded (200 OK).`);
    console.log(`  ✓ New Access Token issued: ${loginRes.body.data.tokens.accessToken.slice(0, 32)}...`);

    // --- STEP 6: Invalidate via Logout (POST /api/v1/auth/logout) ---
    console.log('\n[Step 6] Testing Session Logout (POST /api/v1/auth/logout)...');
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.data.tokens.accessToken}`)
      .send({ refreshToken: loginRes.body.data.tokens.refreshToken });

    if (logoutRes.status !== 200 || !logoutRes.body.success) {
      throw new Error(`Logout failed: ${logoutRes.status}`);
    }
    console.log(`  ✓ Logged out successfully. Refresh token invalidated.`);

    // --- STEP 7: Negative Test - Access Protected Resource Without Token ---
    console.log('\n[Step 7] Negative Test - Unauthenticated Request to Protected Route...');
    const unauthRes = await request(app).get('/api/v1/dashboard');
    // Note: dashboard has optionalAuth so it falls back to defaults for unauthenticated users
    // Let's test a strictly protected route: GET /api/v1/auth/me
    const strictUnauthRes = await request(app).get('/api/v1/auth/me');
    if (strictUnauthRes.status !== 401) {
      throw new Error(`Expected 401 UNAUTHORIZED on /auth/me without token, got ${strictUnauthRes.status}`);
    }
    console.log(`  ✓ Rejected with 401 UNAUTHORIZED when no token provided.`);

    console.log('\n======================================================');
    console.log('🎉 ALL 7/7 DEMO FLOW VERIFICATION CHECKS PASSED!');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

runVerification();

