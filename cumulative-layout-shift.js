const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const Good3G = {
    'offline': false,
    'downloadThroughput': 1.5 * 1024 * 1024 / 8,
    'uploadThroughput': 750 * 1024 / 8,
    'latency': 40
  };
  
const phone = devices['Nexus 5X'];

function calcJank() {
  window.cumulativeLayoutShiftScore = 0;

  const observer = new PerformanceObserver((list) => {
   for (const entry of list.getEntries()) {
     if (!entry.hadRecentInput) {
       console.log("New observer entry for cls: " + entry.value);
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


async function getCLS(url) {
   const browser = await puppeteer.launch({ 
     args: ['--no-sandbox'],
     timeout: 10000
   });

  try {
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();

    await client.send('Network.enable');
    await client.send('ServiceWorker.enable');
    await client.send('Network.emulateNetworkConditions', Good3G);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.emulate(phone);
    // inject a function with the code from 
    // https://web.dev/cls/#measure-cls-in-javascript
    await page.evaluateOnNewDocument(calcJank);  
    await page.goto(url, { waitUntil: 'load', timeout: 60000});

    let cls = await page.evaluate(() => { 
        return window.cumulativeLayoutShiftScore;
    });
    return cls;
    browser.close();
  } catch (error) {
    console.log(error);
    browser.close();
  }
}

getCLS("https://pptr.dev").then(cls => console.log("CLS is: " + cls));