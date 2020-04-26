const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // URL to test
  const remoteURL = 'https://pptr.dev/index.html';
  // URL to replace
  const remoteFilePath = 'https://pptr.dev/style.css';
  // Local (override) file to use instead
  const localFilePath = path.join(__dirname, './assets/style.css');

  await page.setRequestInterception(true);

  page.on('request', (interceptedRequest) => {
    const url = interceptedRequest.url();
    console.log(`Intercepted ${url}`);

    if (url === remoteFilePath && !url.match(localFilePath)) {
      interceptedRequest.respond({
        body: fs.readFileSync(
            localFilePath,
        ),
      });
    } else {
      interceptedRequest.continue();
    }
  });

  await page.goto(remoteURL, {
    waitUntil: 'networkidle2',
  });

  await page.screenshot({path: 'override.png', fullPage: true});
  await browser.close();
})();
