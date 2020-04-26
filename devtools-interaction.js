const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation();
  await page.goto('https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=outline');
  await page.setViewport({width: 1440, height: 714});

  await navigationPromise;
  const selector = 'body > sidebar-component > sidebar-item:nth-child(3) > .pptr-sidebar-item';
  await page.waitForSelector(selector);
  await page.tracing.start({path: 'trace.json', screenshots: true});
  await page.click(selector);
  await page.tracing.stop();

  await browser.close();
})();
