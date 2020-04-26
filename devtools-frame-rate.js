const puppeteer = require('puppeteer');

(async () => {
  const args = await puppeteer.defaultArgs().filter((flag) => flag !== '--enable-automation');
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    ignoreDefaultArgs: true,
    args,
  });
  const page = await browser.newPage();
  const devtoolsProtocolClient = await page.target().createCDPSession();
  await devtoolsProtocolClient.send('Overlay.setShowFPSCounter', {show: true});
  await page.goto('https://pptr.dev');
  await page.screenshot({path: './image.jpg', type: 'jpeg'});
  await page.close();
  await browser.close();
})();
