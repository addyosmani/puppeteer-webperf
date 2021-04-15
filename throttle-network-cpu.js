
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  // Simulated network throttling (Slow 3G)
  await page.emulateNetworkConditions(puppeteer.networkConditions['Slow 3G']);
  await client.send('Emulation.setCPUThrottlingRate', {rate: 4});
  await browser.close();
})();
