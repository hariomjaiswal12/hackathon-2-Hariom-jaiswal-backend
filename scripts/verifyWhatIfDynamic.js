const puppeteer = require('../../h2frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.resolve(__dirname, '..', '..', 'docs', 'verification_screenshots');
const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5ee9963d-118b-4466-baeb-00c6be16bf4f\\screenshots';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(BRAIN_DIR)) fs.mkdirSync(BRAIN_DIR, { recursive: true });

async function saveScreenshot(filename, page) {
  const localPath = path.join(OUT_DIR, filename);
  const brainPath = path.join(BRAIN_DIR, filename);
  await page.screenshot({ path: localPath, fullPage: true });
  fs.copyFileSync(localPath, brainPath);
  console.log(`[Screenshot Saved] ${filename}`);
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('--- STARTING DYNAMIC WHAT-IF SIMULATOR BROWSER VERIFICATION ---');
  const tempProfileDir = path.resolve(__dirname, '..', '..', '.tmp_chrome_whatif_profile');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: tempProfileDir,
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

    // 1. Navigate to What-If Simulator
    console.log('[Step 1] Navigating to What-If Simulator...');
    await page.goto(`${BASE_URL}/what-if`, { waitUntil: 'domcontentloaded' });
    await wait(2500);
    await saveScreenshot('whatif_01_initial_baseline.png', page);

    // 2. Open Add Company Modal & Search VKAPS
    console.log('[Step 2] Opening Add Company modal and searching VKAPS...');
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.textContent.includes('Add Company') && b.offsetWidth > 0);
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Add Company') && b.offsetWidth > 0);
      if (btn) btn.click();
    });

    await wait(800);

    // Type "VKAPS" in search
    const searchInput = await page.waitForSelector('input[placeholder*="Search by company name"]', { timeout: 8000 });
    await searchInput.type('VKAPS');
    await wait(800);
    await saveScreenshot('whatif_02_search_vkaps_modal.png', page);

    // Click "Select" for VKAPS
    console.log('[Step 3] Selecting VKAPS IT Solutions...');
    await page.evaluate(() => {
      const selectBtns = Array.from(document.querySelectorAll('button')).filter((b) => b.textContent.trim() === 'Select' && b.offsetWidth > 0);
      if (selectBtns.length > 0) selectBtns[0].click();
    });
    await wait(1500);

    // 3. Click VKAPS vs TCS Preset
    console.log('[Step 4] Clicking VKAPS vs TCS preset cohort...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const preset = btns.find((b) => b.textContent.includes('VKAPS vs TCS'));
      if (preset) preset.click();
    });
    await wait(1500);
    await saveScreenshot('whatif_03_vkaps_vs_tcs.png', page);

    // 4. Quick Preset — Cloud & Big Tech
    console.log('[Step 5] Selecting Cloud & Big Tech cohort...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const preset = btns.find((b) => b.textContent.includes('Cloud & Big Tech'));
      if (preset) preset.click();
    });
    await wait(1500);
    await saveScreenshot('whatif_04_cloud_bigtech.png', page);

    // 5. Large Cohort — Top 10 Verified
    console.log('[Step 6] Selecting Top 10 Verified companies cohort...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const preset = btns.find((b) => b.textContent.includes('Top 10 Verified'));
      if (preset) preset.click();
    });
    await wait(2000);
    await saveScreenshot('whatif_05_10_companies_cohort.png', page);

    // 6. Simulate: Set WLB to 100
    console.log('[Step 7] Simulating WLB = 100...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const wlbBtn = btns.find((b) => b.textContent.includes('Work-Life Balance to 100'));
      if (wlbBtn) wlbBtn.click();
    });
    await wait(2000);

    // Open first company breakdown accordion
    console.log('[Step 8] Opening category breakdown accordion...');
    await page.evaluate(() => {
      const toggleBtns = Array.from(document.querySelectorAll('button[title*="category breakdown"]'));
      if (toggleBtns.length > 0) toggleBtns[0].click();
    });
    await wait(1000);
    await saveScreenshot('whatif_06_wlb_100_simulation_breakdown.png', page);

    // 7. Add a registry company with Insufficient Evidence (e.g. Vanguard)
    console.log('[Step 9] Adding Vanguard to test Insufficient Evidence handling...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Add Company') && b.offsetWidth > 0);
      if (btn) btn.click();
    });
    await wait(800);

    const input2 = await page.waitForSelector('input[placeholder*="Search by company name"]', { timeout: 8000 });
    await input2.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await input2.type('Vanguard');
    await wait(800);

    await page.evaluate(() => {
      const selectBtns = Array.from(document.querySelectorAll('button')).filter((b) => b.textContent.trim() === 'Select' && b.offsetWidth > 0);
      if (selectBtns.length > 0) selectBtns[0].click();
    });
    await wait(1500);

    // Expand breakdown on Vanguard
    await page.evaluate(() => {
      const toggleBtns = Array.from(document.querySelectorAll('button[title*="category breakdown"]'));
      // Find toggle for last item
      if (toggleBtns.length > 0) toggleBtns[toggleBtns.length - 1].click();
    });
    await wait(1000);
    await saveScreenshot('whatif_07_insufficient_evidence_state.png', page);

    // 8. Save Scenario
    console.log('[Step 10] Saving scenario...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find((b) => b.textContent.includes('Save scenario') && b.offsetWidth > 0);
      if (saveBtn) saveBtn.click();
    });
    await wait(1500);
    await saveScreenshot('whatif_08_scenario_saved_toast.png', page);

    console.log('--- BROWSER VERIFICATION COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during browser verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
