/**
 * Phase 6 - Comprehensive Real End-to-End Test Suite
 *
 * Verifies all 10 required test cases against live backend (port 5000) and frontend (port 5174):
 *   1. Valid demo credentials -> successful login (200 OK)
 *   2. Invalid password -> HTTP 401 and appropriate error message
 *   3. Unknown email -> safe authentication failure (401)
 *   4. Demo endpoint -> successful authentication (200 OK)
 *   5. Authenticated /api/v1/auth/me -> correct demo identity
 *   6. Protected dashboard -> successful authenticated response (200 OK)
 *   7. Logout -> session/token lifecycle works as designed
 *   8. Unauthenticated protected request -> rejected (401)
 *   9. Frontend login form -> dashboard navigation and successful data loading
 *   10. Demo button -> successful login without manual credentials
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const puppeteer = require('C:/Users/HP/Desktop/h2/h2frontend/node_modules/puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const BACKEND_URL = 'http://localhost:5000/api/v1';
const FRONTEND_URL = 'http://localhost:5174';
const DEMO_EMAIL = 'demo@companyiq.internal';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

async function postJSON(endpoint, body, headers = {}) {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, ok: res.ok, body: json };
}

async function getJSON(endpoint, headers = {}) {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const json = await res.json();
  return { status: res.status, ok: res.ok, body: json };
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🧪 COMPANYIQ PHASE 6 REAL END-TO-END VERIFICATION SUITE');
  console.log('================================================================\n');

  if (!DEMO_PASSWORD) {
    console.error('❌ FATAL: DEMO_PASSWORD is not set in h2backend/.env');
    process.exit(1);
  }

  const results = [];
  let testNum = 1;

  function report(name, passed, details = '') {
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`[Test ${testNum}] ${status}: ${name}`);
    if (details) console.log(`   ${details}`);
    results.push({ testNum, name, status, details });
    testNum++;
  }

  try {
    // 1. Valid demo credentials -> successful login
    const loginRes = await postJSON('/auth/login', {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    const t1Passed =
      loginRes.status === 200 &&
      loginRes.body.success === true &&
      !!loginRes.body.data?.tokens?.accessToken &&
      loginRes.body.data?.user?.email === DEMO_EMAIL;
    report(
      'Valid demo credentials -> successful login (200 OK)',
      t1Passed,
      `HTTP ${loginRes.status}, user: ${loginRes.body.data?.user?.name} (${loginRes.body.data?.user?.email})`
    );

    const validAccessToken = loginRes.body.data?.tokens?.accessToken;
    const validRefreshToken = loginRes.body.data?.tokens?.refreshToken;

    // 2. Invalid password -> HTTP 401 and appropriate error message
    const invalidPwdRes = await postJSON('/auth/login', {
      email: DEMO_EMAIL,
      password: 'IncorrectPassword999!',
    });
    const t2Passed =
      invalidPwdRes.status === 401 &&
      invalidPwdRes.body.success === false &&
      invalidPwdRes.body.error?.message === 'Invalid email or password';
    report(
      'Invalid password -> HTTP 401 and appropriate error message',
      t2Passed,
      `HTTP ${invalidPwdRes.status}, error.message: "${invalidPwdRes.body.error?.message}"`
    );

    // 3. Unknown email -> safe authentication failure
    const unknownRes = await postJSON('/auth/login', {
      email: 'nonexistent_account_xyz@companyiq.internal',
      password: 'SomePassword123!',
    });
    const t3Passed =
      unknownRes.status === 401 &&
      unknownRes.body.success === false &&
      unknownRes.body.error?.message === 'Invalid email or password';
    report(
      'Unknown email -> safe authentication failure (401)',
      t3Passed,
      `HTTP ${unknownRes.status}, error.message: "${unknownRes.body.error?.message}"`
    );

    // 4. Demo endpoint -> successful authentication
    const demoEndpointRes = await postJSON('/auth/demo');
    const t4Passed =
      demoEndpointRes.status === 200 &&
      demoEndpointRes.body.success === true &&
      demoEndpointRes.body.data?.user?.email === DEMO_EMAIL &&
      demoEndpointRes.body.data?.user?.isDemoUser === true &&
      !!demoEndpointRes.body.data?.tokens?.accessToken;
    report(
      'Demo endpoint (POST /auth/demo) -> successful authentication (200 OK)',
      t4Passed,
      `HTTP ${demoEndpointRes.status}, isDemoUser: ${demoEndpointRes.body.data?.user?.isDemoUser}`
    );

    const demoAccessToken = demoEndpointRes.body.data?.tokens?.accessToken;
    const demoRefreshToken = demoEndpointRes.body.data?.tokens?.refreshToken;

    // 5. Authenticated /api/v1/auth/me -> correct demo identity
    const meRes = await getJSON('/auth/me', {
      Authorization: `Bearer ${demoAccessToken}`,
    });
    const t5Passed =
      meRes.status === 200 &&
      meRes.body.success === true &&
      meRes.body.data?.email === DEMO_EMAIL &&
      meRes.body.data?.name === 'Demo Guest' &&
      meRes.body.data?.isDemoUser === true;
    report(
      'Authenticated /api/v1/auth/me -> correct demo identity',
      t5Passed,
      `HTTP ${meRes.status}, email: ${meRes.body.data?.email}, name: ${meRes.body.data?.name}`
    );

    // 6. Protected dashboard -> successful authenticated response
    const dashRes = await getJSON('/dashboard', {
      Authorization: `Bearer ${demoAccessToken}`,
    });
    const t6Passed =
      dashRes.status === 200 &&
      dashRes.body.success === true &&
      !!dashRes.body.data;
    report(
      'Protected dashboard -> successful authenticated response (200 OK)',
      t6Passed,
      `HTTP ${dashRes.status}, targetRole: ${dashRes.body.data?.careerDNA?.targetRole}`
    );

    // 7. Logout -> session/token lifecycle works as designed
    const logoutRes = await postJSON(
      '/auth/logout',
      { refreshToken: demoRefreshToken },
      { Authorization: `Bearer ${demoAccessToken}` }
    );
    const tryRefresh = await postJSON('/auth/refresh', {
      refreshToken: demoRefreshToken,
    });
    const t7Passed =
      logoutRes.status === 200 &&
      logoutRes.body.success === true &&
      tryRefresh.status === 401; // invalidated
    report(
      'Logout -> session/token lifecycle works as designed',
      t7Passed,
      `Logout HTTP ${logoutRes.status}; Token refresh after logout rejected with HTTP ${tryRefresh.status} (invalidated)`
    );

    // 8. Unauthenticated protected request -> rejected
    const unauthRes = await getJSON('/auth/me');
    const t8Passed = unauthRes.status === 401 && unauthRes.body.success === false;
    report(
      'Unauthenticated protected request -> rejected (401)',
      t8Passed,
      `HTTP ${unauthRes.status}, message: "${unauthRes.body.error?.message}"`
    );

    // 9. Frontend login form -> dashboard navigation and successful data loading
    console.log('\n--- Running UI Browser Tests via Puppeteer ---');
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    });

    try {
      const page1 = await browser.newPage();
      await page1.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });

      // Click "Sign In" button in header
      await page1.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find((b) => b.innerText.trim() === 'Sign In');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 800));

      // Fill in demo credentials
      await page1.type('#auth-email', DEMO_EMAIL);
      await page1.type('#auth-password', DEMO_PASSWORD);

      // Submit form
      await page1.evaluate(() => {
        const btn = document.querySelector('form#auth-form button[type="submit"]');
        if (btn) btn.click();
      });

      // Wait for navigation to /dashboard
      await page1.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));

      const page1Url = page1.url();
      const hasDashboardContent = await page1.evaluate(() => {
        const text = document.body.innerText;
        return (
          text.includes('Dashboard') ||
          text.includes('Career DNA') ||
          text.includes('Recommended Companies') ||
          text.includes('Intelligence')
        );
      });
      const t9Passed = page1Url.includes('/dashboard') && hasDashboardContent;
      report(
        'Frontend login form -> dashboard navigation and data loading',
        t9Passed,
        `Final URL: ${page1Url}, dashboard loaded: ${hasDashboardContent}`
      );
      await page1.close();

      // 10. Demo button -> successful login without manual credentials
      const page2 = await browser.newPage();
      await page2.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });

      // Click "Explore with Demo Account" button on landing page
      await page2.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find((b) => b.innerText.includes('Explore with Demo Account'));
        if (btn) btn.click();
      });

      await page2.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));

      const page2Url = page2.url();
      const hasDemoContent = await page2.evaluate(() => {
        const text = document.body.innerText;
        return (
          text.includes('Dashboard') ||
          text.includes('Career DNA') ||
          text.includes('Recommended Companies') ||
          text.includes('Intelligence')
        );
      });
      const t10Passed = page2Url.includes('/dashboard') && hasDemoContent;
      report(
        'Demo button -> successful login without manual credentials',
        t10Passed,
        `Final URL: ${page2Url}, dashboard loaded: ${hasDemoContent}`
      );
      await page2.close();

    } finally {
      await browser.close();
    }

    console.log('\n================================================================');
    const allPassed = results.every((r) => r.status === 'PASS');
    if (allPassed) {
      console.log(`🎉 ALL ${results.length}/${results.length} PHASE 6 END-TO-END TESTS PASSED!`);
    } else {
      console.log(`❌ SOME TESTS FAILED: ${results.filter((r) => r.status === 'FAIL').length} failed`);
    }
    console.log('================================================================\n');

    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

runAllTests();

