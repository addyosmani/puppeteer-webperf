const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://pptr.dev');
  const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
  );
  console.log('performanceTiming', performanceTiming)
  await browser.close();
})();