
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Simulated network throttling (Slow 3G)
  await page.emulateNetworkConditions(puppeteer.networkConditions['Slow 3G']);
  await page.emulateCPUThrottling(4);
  await browser.close();
})();
