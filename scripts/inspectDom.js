const puppeteer = require('../../h2frontend/node_modules/puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/company/vkaps-it-solutions', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const content = await page.evaluate(() => {
    return {
      title: document.title,
      bodyText: document.body.innerText.slice(0, 500),
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()),
    };
  });

  console.log('DOM Info:', JSON.stringify(content, null, 2));
  await browser.close();
})();
