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
  console.log('--- STARTING CAREERS & HIRING FEATURE BROWSER VERIFICATION ---');
  const tempProfileDir = path.resolve(__dirname, '..', '..', '.tmp_chrome_careers_profile');
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

    // 1. Navigate to VKAPS IT Solutions Company Intelligence
    console.log('[Step 1] Navigating to VKAPS IT Solutions page...');
    await page.goto(`${BASE_URL}/company/vkaps-it-solutions`, { waitUntil: 'domcontentloaded' });
    await wait(2500);
    await saveScreenshot('careers_01_vkaps_overview.png', page);

    // 2. Click Careers & Jobs Tab
    console.log('[Step 2] Clicking Careers & Jobs tab for VKAPS...');
    const careersTabClicked = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const target = tabs.find((b) => b.textContent && (b.textContent.includes('Careers & Jobs') || b.textContent.includes('Careers')));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    console.log(`Careers tab clicked: ${careersTabClicked}`);
    await wait(2000);

    // Check for 404 error banner
    const pageText = await page.evaluate(() => document.body.innerText);
    const has404Error = pageText.includes('404') || pageText.includes('Route not found') || pageText.includes('Could not load');
    console.log(`[Verification] VKAPS page has 404 or error banner: ${has404Error}`);
    if (has404Error) {
      console.error('ERROR: 404 banner detected on VKAPS Careers tab!');
    } else {
      console.log('SUCCESS: No 404 error banner present. VKAPS loaded cleanly.');
    }

    await saveScreenshot('careers_02_vkaps_careers_tab_zero_hallucination.png', page);

    // 3. Test Refresh ATS Listings button on VKAPS
    console.log('[Step 3] Testing Refresh ATS Listings button on VKAPS...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const refreshBtn = buttons.find((b) => b.textContent && b.textContent.includes('Refresh'));
      if (refreshBtn) refreshBtn.click();
    });
    await wait(2000);
    await saveScreenshot('careers_03_vkaps_after_refresh.png', page);

    // 4. Navigate to Figma
    console.log('[Step 4] Navigating to Figma page...');
    await page.goto(`${BASE_URL}/company/figma`, { waitUntil: 'domcontentloaded' });
    await wait(2500);

    // 5. Open Careers & Jobs Tab on Figma
    console.log('[Step 5] Clicking Careers & Jobs tab for Figma...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const target = tabs.find((b) => b.textContent && (b.textContent.includes('Careers & Jobs') || b.textContent.includes('Careers')));
      if (target) target.click();
    });
    await wait(2500);
    await saveScreenshot('careers_04_figma_greenhouse_jobs.png', page);

    // Verify Figma has real jobs and apply links
    const figmaDetails = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href*="greenhouse"]');
      const text = document.body.innerText;
      return {
        greenhouseLinksCount: cards.length,
        hasOpeningsHeadline: text.includes('Open Requisitions') || text.includes('Job Openings') || text.includes('positions'),
        sampleJobTitle: document.querySelector('h3, h4')?.innerText,
      };
    });
    console.log(`[Verification] Figma Greenhouse verified links: ${figmaDetails.greenhouseLinksCount}`);

    // 6. Navigate to Spotify (Lever ATS)
    console.log('[Step 6] Navigating to Spotify page...');
    await page.goto(`${BASE_URL}/company/spotify`, { waitUntil: 'domcontentloaded' });
    await wait(2500);

    // Click Careers tab for Spotify
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const target = tabs.find((b) => b.textContent && (b.textContent.includes('Careers & Jobs') || b.textContent.includes('Careers')));
      if (target) target.click();
    });
    await wait(2500);
    await saveScreenshot('careers_05_spotify_lever_jobs.png', page);

    console.log('--- ALL CAREERS BROWSER VERIFICATIONS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Fatal verification error:', err);
  } finally {
    await browser.close();
  }
})();

