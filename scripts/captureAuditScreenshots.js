const puppeteer = require('../../h2frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const TARGET_URL = `${BASE_URL}/company/vkaps-it-solutions`;

const BRAIN_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5ee9963d-118b-4466-baeb-00c6be16bf4f\\screenshots';
if (!fs.existsSync(BRAIN_DIR)) fs.mkdirSync(BRAIN_DIR, { recursive: true });

async function run() {
  console.log('Launching Chrome browser via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1200'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200 });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  // Helper to click tab by matching button text
  const clickTab = async (label) => {
    const success = await page.evaluate((targetLabel) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const match = buttons.find((b) => b.textContent && b.textContent.trim().toLowerCase().startsWith(targetLabel.toLowerCase()));
      if (match) {
        match.scrollIntoView();
        match.click();
        return true;
      }
      return false;
    }, label);

    if (!success) {
      console.warn(`Could not click tab with label: ${label}`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  };

  // 1. Overview tab screenshot
  console.log('Capturing Screenshot 1: Overview tab...');
  const overviewPath = path.join(BRAIN_DIR, 'audit_01_vkaps_overview_identity.png');
  await page.screenshot({ path: overviewPath, fullPage: true });
  console.log('Saved:', overviewPath);

  // 2. Profile tab screenshot
  console.log('Clicking Company Profile tab...');
  await clickTab('Company Profile');
  const profilePath = path.join(BRAIN_DIR, 'audit_02_vkaps_profile_legal_entity.png');
  await page.screenshot({ path: profilePath, fullPage: true });
  console.log('Saved:', profilePath);

  // 3. Leadership tab screenshot
  console.log('Clicking Leadership tab...');
  await clickTab('Leadership');
  const leadershipPath = path.join(BRAIN_DIR, 'audit_03_vkaps_leadership_mca_directors.png');
  await page.screenshot({ path: leadershipPath, fullPage: true });
  console.log('Saved:', leadershipPath);

  // 4. Career Fit tab screenshot
  console.log('Clicking Career Fit tab...');
  await clickTab('Career Fit');
  const fitPath = path.join(BRAIN_DIR, 'audit_04_vkaps_career_fit_zero_hallucination.png');
  await page.screenshot({ path: fitPath, fullPage: true });
  console.log('Saved:', fitPath);

  // 5. Sources tab screenshot
  console.log('Clicking Sources & Verification tab...');
  await clickTab('Sources & Verification');
  const sourcesPath = path.join(BRAIN_DIR, 'audit_05_vkaps_sources_provenance.png');
  await page.screenshot({ path: sourcesPath, fullPage: true });
  console.log('Saved:', sourcesPath);

  await browser.close();
  console.log('All 5 audit screenshots captured successfully with full page depth!');
}

run().catch((err) => {
  console.error('Error running screenshot capture:', err);
  process.exit(1);
});
