const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation();
  await page.goto('https://pptr.dev');

  await navigationPromise;

  const firstPaint = JSON.parse(
      await page.evaluate(() =>
        JSON.stringify(performance.getEntriesByName('first-paint')),
      ),
  );

  const firstContentfulPaint = JSON.parse(
      await page.evaluate(() =>
        JSON.stringify(performance.getEntriesByName('first-contentful-paint')),
      ),
  );

  console.log(`First paint: ${firstPaint[0].startTime}`);
  console.log(`First paint: ${firstContentfulPaint[0].startTime}`);

  await browser.close();
})();
