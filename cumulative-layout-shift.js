const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const phone = devices.devicesMap['Nexus 5X'];

/**
 * Measure layout shifts
 */
function calculateShifts() {
  window.cumulativeLayoutShiftScore = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        console.log('New observer entry for cls: ' + entry.value);
        window.cumulativeLayoutShiftScore += entry.value;
      }
    }
  });

  observer.observe({type: 'layout-shift', buffered: true});

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      observer.takeRecords();
      observer.disconnect();
      console.log('CLS:', window.cumulativeLayoutShiftScore);
    }
  });
}


/**
 * Get cumulative layout shift for a URL
 * @param {String} url - url to measure
 * @return {Number} - cumulative layout shift
 */
async function getCLS(url) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    timeout: 10000,
  });

  try {
    const page = await browser.newPage();
    await page.emulateNetworkConditions(puppeteer.networkConditions['Good 3G']);
    await page.emulateCPUThrottling(4);
    await page.emulate(phone);
    // inject a function with the code from
    // https://web.dev/cls/#measure-cls-in-javascript
    await page.evaluateOnNewDocument(calculateShifts);
    await page.goto(url, {waitUntil: 'load', timeout: 60000});

    const cls = await page.evaluate(() => {
      return window.cumulativeLayoutShiftScore;
    });
    browser.close();
    return cls;
  } catch (error) {
    console.log(error);
    browser.close();
  }
}

getCLS('https://pptr.dev').then((cls) => console.log('CLS is: ' + cls));
