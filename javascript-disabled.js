const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on('request', (request) => {
    if (request.resourceType() === 'script') {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto('https://reddit.com');
  await page.screenshot({path: 'pptr-nojs.png'});

  await browser.close();
})();
