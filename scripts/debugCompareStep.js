const puppeteer = require('../../h2frontend/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5174';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--window-size=1600,1100']
  });
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/compare`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Click Add Company
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Company'));
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Type VKAPS
  const inp = await page.$('input[placeholder*="Search by company name"]');
  await inp.type('VKAPS');
  await new Promise(r => setTimeout(r, 1500));

  // Click Select
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Select');
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  console.log('After VKAPS selected, text on page:');
  const txt1 = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log(txt1);

  // Add second
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add second company'));
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const inp2 = await page.$('input[placeholder*="Search by company name"]');
  await inp2.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await inp2.type('TCS');
  await new Promise(r => setTimeout(r, 1500));

  const modalBtns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()));
  console.log('Modal buttons when TCS searched:', modalBtns);

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Select');
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  const allBtns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()));
  console.log('All buttons after TCS selected:', allBtns);

  const txt2 = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Page text after TCS selected:', txt2);

  await browser.close();
})();

