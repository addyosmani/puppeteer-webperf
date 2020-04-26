const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.tracing.start({screenshots: true, path: 'trace.json'});
  await page.goto('https://netflix.com', {timeout: 60000});
  await page.tracing.stop();

  // Extract data from the trace
  const tracing = JSON.parse(fs.readFileSync('./trace.json', 'utf8'));
  const traceScreenshots = tracing.traceEvents.filter((x) => (
    x.cat === 'disabled-by-default-devtools.screenshot' &&
      x.name === 'Screenshot' &&
      typeof x.args !== 'undefined' &&
      typeof x.args.snapshot !== 'undefined'
  ));

  traceScreenshots.forEach(function(snap, index) {
    fs.writeFile(`trace-screenshot-${index}.png`, snap.args.snapshot, 'base64', function(err) {
      if (err) {
        console.log('writeFile error', err);
      }
    });
  });

  await browser.close();
})();
