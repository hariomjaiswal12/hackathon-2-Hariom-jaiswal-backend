const puppeteer = require('../../h2frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:5174/ask';
const OUT_DIR = path.resolve(__dirname, '..', '..', 'docs', 'verification_screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  console.log('Navigating to Ask CompanyIQ page...');
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Selecting NVIDIA from target company dropdown...');
  await page.select('select', 'nvidia');
  await new Promise(r => setTimeout(r, 1000));

  console.log('Entering question about NVIDIA...');
  const inputSelector = 'input[type="text"]';
  await page.waitForSelector(inputSelector);
  await page.type(inputSelector, 'How is compensation and learning culture at NVIDIA?');
  await page.keyboard.press('Enter');

  console.log('Submitted question, waiting for Gemini response...');
  await new Promise(r => setTimeout(r, 8000));

  const responsePath = path.join(OUT_DIR, '02_ask_nvidia_response.png');
  await page.screenshot({ path: responsePath, fullPage: true });
  console.log('Screenshot saved to:', responsePath);

  const brainDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5ee9963d-118b-4466-baeb-00c6be16bf4f\\screenshots';
  if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir, { recursive: true });
  fs.copyFileSync(responsePath, path.join(brainDir, 'ask_nvidia_response.png'));
  console.log('Copied to brain artifacts.');

  await browser.close();
  console.log('Browser test complete successfully.');
})();
