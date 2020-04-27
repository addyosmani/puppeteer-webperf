
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  // Simulated network throttling (Slow 3G)
  await client.send('Network.emulateNetworkConditions', {
    // Network connectivity is absent
    'offline': false,
    // Download speed (bytes/s)
    'downloadThroughput': 500 * 1024 / 8 * .8,
    // Upload speed (bytes/s)
    'uploadThroughput': 500 * 1024 / 8 * .8,
    // Latency (ms)
    'latency': 400 * 5,
  });
  await client.send('Emulation.setCPUThrottlingRate', {rate: 4});
  await browser.close();
})();
