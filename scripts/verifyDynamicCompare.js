const puppeteer = require('../../h2frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5174';
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

async function clickExactButton(page, text) {
  await page.waitForFunction(
    (t) => Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === t && b.offsetWidth > 0),
    { timeout: 8000 },
    text
  );
  await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === t && b.offsetWidth > 0);
    if (!btn) throw new Error(`Exact button "${t}" not found`);
    btn.click();
  }, text);
}

async function clickButtonContaining(page, text) {
  await page.waitForFunction(
    (t) => Array.from(document.querySelectorAll('button')).some(b => b.textContent.toLowerCase().includes(t.toLowerCase()) && b.offsetWidth > 0),
    { timeout: 8000 },
    text
  );
  await page.evaluate((t) => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes(t.toLowerCase()) && b.offsetWidth > 0);
    if (!btn) throw new Error(`Button containing "${t}" not found`);
    btn.click();
  }, text);
}

async function clearAndType(page, selector, text) {
  const input = await page.waitForSelector(selector);
  await input.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await input.type(text);
}

(async () => {
  console.log('--- STARTING DYNAMIC COMPARE & BATTLE MODE BROWSER VERIFICATION ---');
  const tempProfileDir = path.resolve(__dirname, '..', '..', '.tmp_chrome_profile');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: tempProfileDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1600,1100',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });

  // 1. Initial Empty State on /compare
  console.log('\nStep 1: Navigating to /compare (Empty Default State)...');
  await page.goto(`${BASE_URL}/compare`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('01_compare_initial_empty.png', page);

  // 2. Open Add Company Modal & Search VKAPS
  console.log('\nStep 2: Clicking "Add Company" and searching for "VKAPS"...');
  await clickExactButton(page, 'Add Company');
  await new Promise(r => setTimeout(r, 1000));

  await clearAndType(page, 'input[placeholder*="Search by company name"]', 'VKAPS');
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('02_compare_modal_search_vkaps.png', page);

  // 3. Select VKAPS IT Solutions
  console.log('\nStep 3: Selecting VKAPS IT Solutions...');
  await clickExactButton(page, 'Select');
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('03_one_company_selected.png', page);

  // 4. Add Second Company (TCS)
  console.log('\nStep 4: Opening modal to add TCS...');
  await clickButtonContaining(page, 'Add second company');
  await new Promise(r => setTimeout(r, 1000));

  await clearAndType(page, 'input[placeholder*="Search by company name"]', 'TCS');
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('04_compare_modal_search_tcs.png', page);

  console.log('Selecting TCS...');
  await clickExactButton(page, 'Select');
  await new Promise(r => setTimeout(r, 3500)); // wait for API comparison calculation
  await saveScreenshot('05_compare_vkaps_vs_tcs_table.png', page);

  // 5. Activate Battle Mode (VKAPS vs TCS)
  console.log('\nStep 5: Activating Battle Mode for VKAPS IT Solutions vs TCS...');
  await clickButtonContaining(page, 'Battle mode');
  await new Promise(r => setTimeout(r, 2500));
  await saveScreenshot('06_battle_mode_vkaps_vs_tcs.png', page);

  // 6. Add 3rd Company (Infosys) to test 3-way Battle Mode
  console.log('\nStep 6: Adding 3rd company (Infosys) for 3-way Battle Mode...');
  await clickExactButton(page, 'Add Company');
  await new Promise(r => setTimeout(r, 1000));

  await clearAndType(page, 'input[placeholder*="Search by company name"]', 'Infosys');
  await new Promise(r => setTimeout(r, 1500));

  await clickExactButton(page, 'Select');
  await new Promise(r => setTimeout(r, 4000));
  await saveScreenshot('07_battle_mode_3_companies.png', page);

  // 7. Save Comparison Scenario
  console.log('\nStep 7: Saving Comparison Scenario...');
  await clickButtonContaining(page, 'Save comparison');
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('08_save_comparison_feedback.png', page);

  // 8. Navigate to Saved Comparisons via Sidebar
  console.log('\nStep 8: Navigating to Saved Comparisons via Sidebar...');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Saved Comparisons'));
    link?.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('09_saved_comparisons_page.png', page);

  // 9. Reopen Saved Comparison
  console.log('\nStep 9: Reopening comparison from saved list...');
  await clickButtonContaining(page, 'Open comparison');
  await new Promise(r => setTimeout(r, 3000));
  await saveScreenshot('10_reopened_from_saved.png', page);

  // 10. Test Big Tech Battle (Microsoft vs Google)
  console.log('\nStep 10: Testing Microsoft vs Google cohort...');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === 'Compare');
    link?.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Switch to table view first if in battle view
  try {
    const tableToggle = await page.evaluateHandle(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Standard table view'))
    );
    if (tableToggle) await tableToggle.click();
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {}

  // Remove existing companies one by one to reveal empty state cohorts
  while (true) {
    const removeBtn = await page.$('button[title*="Remove"]');
    if (!removeBtn) break;
    await removeBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // Click "Microsoft vs. Google" quick cohort
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('h4')).some(h => h.textContent.includes('Microsoft vs. Google')),
    { timeout: 8000 }
  );
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h4')).find(e => e.textContent.includes('Microsoft vs. Google'));
    el?.click();
  });
  await new Promise(r => setTimeout(r, 3500));

  // Toggle to battle mode
  await clickButtonContaining(page, 'Battle mode');
  await new Promise(r => setTimeout(r, 2500));
  await saveScreenshot('11_battle_microsoft_vs_google.png', page);

  await browser.close();
  console.log('\nALL 11 BROWSER VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
})().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
