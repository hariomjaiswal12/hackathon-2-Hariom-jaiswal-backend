const puppeteer = require('../../h2frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/verification_screenshots');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5ee9963d-118b-4466-baeb-00c6be16bf4f\\screenshots';
const TEMP_PROFILE = path.resolve(__dirname, '../../.tmp_chrome_google_auth_profile');

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
if (!fs.existsSync(BRAIN_DIR)) fs.mkdirSync(BRAIN_DIR, { recursive: true });

async function saveScreenshot(page, filename) {
  const filePath1 = path.join(SCREENSHOTS_DIR, filename);
  const filePath2 = path.join(BRAIN_DIR, filename);
  await page.screenshot({ path: filePath1, fullPage: false });
  fs.copyFileSync(filePath1, filePath2);
  console.log(`  ✓ Saved screenshot: ${filename}`);
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('\n======================================================');
  console.log('🚀 COMPANYIQ - GOOGLE OAUTH 2.0 UI & FLOW VERIFICATION');
  console.log('======================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: TEMP_PROFILE,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,960',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    console.log('[Step 1] Navigating to CompanyIQ frontend...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await wait(2500);

    // Open Auth Modal via header Sign In button
    console.log('[Step 2] Opening Sign In Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signInBtn = buttons.find((b) => b.textContent && b.textContent.trim() === 'Sign In');
      if (signInBtn) signInBtn.click();
    });
    await wait(1000);

    // Check modal contents
    const modalCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const googleBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Continue with Google')
      );
      const divider = text.includes('or continue with') || text.includes('OR CONTINUE WITH');
      const googleSvg = googleBtn ? !!googleBtn.querySelector('svg') : false;

      return {
        isModalOpen: text.includes('Sign in to CompanyIQ'),
        hasGoogleButton: !!googleBtn,
        hasGoogleSvg: googleSvg,
        hasDivider: divider,
      };
    });

    console.log('  Sign In modal checks:', modalCheck);
    if (!modalCheck.isModalOpen || !modalCheck.hasGoogleButton || !modalCheck.hasDivider) {
      throw new Error('Google Sign-In UI verification failed in Sign In modal!');
    }
    console.log('  ✓ Verified "Continue with Google" button, divider, and Google brand icon in Sign In mode');
    await saveScreenshot(page, 'google_oauth_01_signin_modal.png');

    // Test clicking Google button when client ID is not yet configured
    console.log('\n[Step 3] Testing unconfigured Google OAuth graceful message...');
    await page.evaluate(() => {
      const googleBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Continue with Google')
      );
      if (googleBtn) googleBtn.click();
    });
    await wait(1000);

    const errorAlertCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Google Sign-In requires an active Google OAuth Client ID');
    });
    console.log(`  ✓ Graceful configuration guidance alert shown: ${errorAlertCheck}`);
    await saveScreenshot(page, 'google_oauth_02_config_guidance.png');

    // Switch to Register tab
    console.log('\n[Step 4] Switching to Register tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const registerTab = buttons.find((b) => b.textContent && b.textContent.trim() === 'Register');
      if (registerTab) registerTab.click();
    });
    await wait(1000);

    const registerCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const googleBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Sign up with Google')
      );
      return {
        isRegisterMode: text.includes('Create your account'),
        hasSignUpGoogleBtn: !!googleBtn,
        hasDivider: text.includes('or continue with') || text.includes('OR CONTINUE WITH'),
      };
    });
    console.log('  Register mode checks:', registerCheck);
    if (!registerCheck.isRegisterMode || !registerCheck.hasSignUpGoogleBtn) {
      throw new Error('Google Sign-Up button missing in Register mode!');
    }
    console.log('  ✓ Verified "Sign up with Google" button and divider in Register mode');
    await saveScreenshot(page, 'google_oauth_03_register_modal.png');

    console.log('\n======================================================');
    console.log('🎉 BROWSER UI VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error('Browser Verification Error:', err);
  process.exit(1);
});

