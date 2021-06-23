<p align="center">
<img src="https://user-images.githubusercontent.com/110953/80448571-91919100-88d1-11ea-936a-a8fb1785311e.jpg" alt="Puppeteer WebPerf logo" width="70%"/>
<h1>Automating Web Perf measurement with Puppeteer</h1>
</p>

🕹 <a href="https://pptr.dev">Puppeteer</a> is a Node library which provides a high-level API to control headless Chrome or Chromium over the <a href="https://chromedevtools.github.io/devtools-protocol/">DevTools Protocol</a>. This repository has recipes for automating Web Performance measurement with Puppeteer.

## Table Of Contents

* [Get a DevTools performance trace for a page load](#devtools-profile)
* [Get a DevTools trace with screenshots](#devtools-screenshots)
* [Get a DevTools trace and extract filmstrip screenshots](#devtools-trace-screenshots)
* [Get a DevTools trace for a user interaction](#devtools-interaction)
* [Get Runtime performance metrics](#runtime-perf-metrics)
* [Generate a Lighthouse report](#lighthouse-report)
* [Extract Lighthouse performance metrics](#lighthouse-metrics)
* [Emulate a slow network](#throttle-network)
* [Emulate a slow network and CPU](#throttle-network-cpu)
* [Test your site renders with JavaScript disabled](#javascript-disabled)
* [Get Navigation Timing API metrics](#navigation-timing)
* [Measure First Paint and First Contentful Paint](#first-contentful-paint)
* [Measure Largest Contentful Paint w/PerformanceObserver](#largest-contentful-paint)
* [Measure Cumulative Layout Shift w/PerformanceObserver](#cumulative-layout-shift)
* [Measure SPA metrics with Next.js](#nextjs-metrics)
* [Get DevTools-specific metrics: Frames Per Second](#devtools-frame-rate)
* [Measure memory leaks](#measure-memory-leaks)
* [Override requests with Request Interception](#request-interception)
* [Block third-party domains](#block-third-parties)
* [Code Coverage for JavaScript and CSS](#code-coverage)
* [Save network requests to a HAR file](#har-file)

<h3 id="devtools-profile">Get a DevTools performance trace for a page load</h3>

Puppeteer API: [tracing.start()](https://pptr.dev/#?product=Puppeteer&show=api-tracingstartoptions)

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // Drag and drop this JSON file to the DevTools Performance panel!
  await page.tracing.start({path: 'profile.json'});
  await page.goto('https://pptr.dev');
  await page.tracing.stop();
  await browser.close();
})();
```

[Source](devtools-profile.js)

<img src="/assets/images/Performance-tracing0.png" alt="Screenshot of a DevTools performance profile from loading and rendering a page"/>

<h3 id="devtools-screenshots">Get a DevTools trace with screenshots</h3>

Puppeteer API: [tracing.start()](https://pptr.dev/#?product=Puppeteer&show=api-tracingstartoptions)

```js
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // Drag and drop this JSON file to the DevTools Performance panel!
    await page.tracing.start({ path: 'profile.json', screenshots: true });
    await page.goto('https://pptr.dev');
    await page.tracing.stop();
    await browser.close();
})();
```

[Source](devtools-screenshots.js)

<img src="/assets/images/Performance-tracing2.png" alt="DevTools screenshots in the performance panel"/>

<h3 id="devtools-trace-screenshots">Get a DevTools trace and extract filmstrip screenshots</h3>

If you would like to record a performance trace and extract filmstrip screenshots from that trace to a local directory, the below snippet should do the trick. It works by filtering trace events for screenshot entries. 

```js
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.tracing.start({ screenshots: true, path: 'trace.json' });
  await page.goto('https://netflix.com', { timeout: 60000 });
  await page.tracing.stop();

  // Extract data from the trace
  const tracing = JSON.parse(fs.readFileSync('./trace.json', 'utf8'));
  const traceScreenshots = tracing.traceEvents.filter(x => (
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
```

[Source](devtools-trace-screenshots.js)

![](/assets/images/trace-screenshots@2x.jpg)


<h3 id="devtools-interaction">Get a DevTools trace for a user interaction</h3>

Puppeteer API: [page.click()](https://pptr.dev/#?product=Puppeteer&show=api-pageclickselector-options)

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation();
  await page.goto('https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=outline');
  await page.setViewport({ width: 1440, height: 714 });
  
  await navigationPromise;
  const selector = 'body > sidebar-component > sidebar-item:nth-child(3) > .pptr-sidebar-item';
  await page.waitForSelector(selector);
  await page.tracing.start({path: 'trace.json', screenshots: true});
  await page.click(selector);
  await page.tracing.stop();
  
  await browser.close();
})();
```
[Source](devtools-interaction.js)

![](/assets/images/interaction@2x.png)

<h3 id="runtime-perf-metrics">Get Runtime performance metrics</h3>

The `page.metrics()` returns runtime metrics from the Chrome DevTools Protocol Performance.getMetrics() method, such as layout  duration, recalc-style durations and JS event listeners.

Puppeteer API: [metrics()](https://pptr.dev/#?product=Puppeteer&show=api-pagemetrics)

```js
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://pptr.dev');

    const metrics = await page.metrics();
    console.info(metrics);

    await browser.close();
})();
```

[Source](runtime-perf-metrics.js)

<img src="/assets/images/Performance-tracing8.png" alt="Runtime performance metrics shown in the terminal"/>

<h3 id="lighthouse-report">Generate a Lighthouse report</h3>

💡🏠 Lighthouse is an engine for analyzing web apps and web pages, collecting modern performance metrics and insights on developer best practices. It's available in the Chrome DevTools, PageSpeed Insights, a CLI and as a consumable module.

Generate a Lighthouse report for a URL and output it to a local HTML file. For more details, see the official guide to [using Puppeteer with Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/master/docs/puppeteer.md).

Puppeteer API: [connect()](https://pptr.dev/#?product=Puppeteer&show=api-puppeteerconnectoptions)

```js
const fs = require('fs');
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');

const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const request = require('request');
const util = require('util');

const options = {
  logLevel: 'info',
  disableDeviceEmulation: true,
  chromeFlags: ['--disable-mobile-emulation']
};

async function lighthouseFromPuppeteer(url, options, config = null) {
  // Launch chrome using chrome-launcher
  const chrome = await chromeLauncher.launch(options);
  options.port = chrome.port;

  // Connect chrome-launcher to puppeteer
  const resp = await util.promisify(request)(`http://localhost:${options.port}/json/version`);
  const { webSocketDebuggerUrl } = JSON.parse(resp.body);
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });

  // Run Lighthouse
  const { lhr } = await lighthouse(url, options, config);
  await browser.disconnect();
  await chrome.kill();

  const html = reportGenerator.generateReport(lhr, 'html');
  fs.writeFile('report.html', html, function (err) {
    if (err) throw err;
  });
}

lighthouseFromPuppeteer("https://pptr.dev", options);
```

[Source](lighthouse-report.js)

<img src="/assets/images/Performance-tracing3.png" alt="Lighthouse report generation from Puppeteer"/>

<h3 id="lighthouse-metrics">Extract Lighthouse performance metrics</h3>

[Lighthouse](https://developers.google.com/web/tools/lighthouse/) exposes a number of [user-centric performance metrics](https://web.dev/user-centric-performance-metrics/). It's possible to pluck these metrics values out from the JSON response, as demonstrated below.

```js
const fs = require('fs');
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');

const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const request = require('request');
const util = require('util');

const options = {
  logLevel: 'info',
  disableDeviceEmulation: true,
  chromeFlags: ['--disable-mobile-emulation']
};

async function lighthouseFromPuppeteer(url, options, config = null) {
  // Launch chrome using chrome-launcher
  const chrome = await chromeLauncher.launch(options);
  options.port = chrome.port;

  // Connect chrome-launcher to puppeteer
  const resp = await util.promisify(request)(`http://localhost:${options.port}/json/version`);
  const { webSocketDebuggerUrl } = JSON.parse(resp.body);
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });

  // Run Lighthouse
  const { lhr } = await lighthouse(url, options, config);
  await browser.disconnect();
  await chrome.kill();

  const json = reportGenerator.generateReport(lhr, 'json');

  const audits = JSON.parse(json).audits; // Lighthouse audits
  const first_contentful_paint = audits['first-contentful-paint'].displayValue;
  const total_blocking_time = audits['total-blocking-time'].displayValue;
  const time_to_interactive = audits['interactive'].displayValue;

  console.log(`\n
     Lighthouse metrics: 
     🎨 First Contentful Paint: ${first_contentful_paint}, 
     ⌛️ Total Blocking Time: ${total_blocking_time},
     👆 Time To Interactive: ${time_to_interactive}`);
}

lighthouseFromPuppeteer("https://bbc.com", options);
```
[Source](lighthouse-metrics.js)

![](/assets/images/lh-metrics@2x.png)

<h3 id="throttle-network">Emulate a slow network</h3>

If you need to throttle the network connection, use [Puppeteer’s `page.emulateNetworkConditions` API](https://github.com/puppeteer/puppeteer/blob/v8.0.0/docs/api.md#pageemulatenetworkconditionsnetworkconditions).

🚨 Real network performance can be impacted by latency to towers, traffic patterns and the current radio activity. The <a href="https://github.com/GoogleChrome/lighthouse/blob/master/docs/throttling.md">Lighthouse guide to network throttling</a> covers in more detail what the differences are between simulated, request-level and packet-level throttling.

You can use <a href="https://github.com/GoogleChrome/lighthouse/blob/master/docs/throttling.md#using-lighthouse-with-comcast">Lighthouse with the comcast module</a> for packet-level throttling.
</div>

Emulating a Slow 3G network is demonstrated below.

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  // Simulated network throttling (Slow 3G)
  await page.emulateNetworkConditions(puppeteer.networkConditions['Slow 3G']);
  await browser.close();
})();
```

[Source](throttle-network.js)

You can find details on the presets DevTools supports for Slow and Fast 3G in the [official source](https://github.com/ChromeDevTools/devtools-frontend/blob/80c102878fd97a7a696572054007d40560dcdd21/front_end/sdk/NetworkManager.js#L252-L274). If you are looking for the older presets around Regular 4G, WiFi etc, they are captured in [network throttling in Puppeteer](https://fdalvi.github.io/blog/2018-02-05-puppeteer-network-throttle/).

<h3 id="throttle-network-cpu">Emulate a slow network and CPU</h3>

CPU throttling allows you to simulate how a page performs on slower mobile devices. This can be done using Puppeteer’s `page.emulateNetworkConditions` API.

🚨 Real device CPU performance is impacted by many factors that are not trivial to emulate via the Chrome DevTools Protocol / Puppeteer. e.g core count, L1/L2 cache, thermal throttling impacting performance, architecture etc. Simulating CPU performance can be a good guideline, but ideally also verify any numbers you see on a real mobile device.

Building on top of Slow 3G network throttling, slow CPU throttling (4x slowdown - close to a median-quality device like the Moto G4), is shown below. 
</div>

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  // Simulated network throttling (Slow 3G)
  await page.emulateNetworkConditions(puppeteer.networkConditions['Slow 3G']);
  await page.emulateCPUThrottling(4);
  await browser.close();
})();
```
[Source](throttle-network-cpu.js)

<h3 id="javascript-disabled">Test your site renders with JavaScript disabled</h3>

Situations with intermittant
connectivity may mean JS is effectively disabled until it can be loaded. Testing a page with JS disabled allows you to simulate a 'worst case' for this.

Puppeteer API: [setRequestInterception()](https://pptr.dev/#?product=Puppeteer&show=api-pagesetrequestinterceptionvalue)

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on('request', request => {
    if (request.resourceType() === 'script') {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto('https://reddit.com');
  await page.screenshot({ path: 'pptr-nojs.png' });

  await browser.close();
})();
```
[Source](javascript-disabled.js)

<img src="/assets/images/Performance-tracing7.png" alt="Reddit rendered with JS disabled"/>

<h3 id="navigation-timing">Get Navigation Timing API metrics</h3>

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://pptr.dev');
  const performanceTiming = JSON.parse(
    await page.evaluate(() => JSON.stringify(window.performance.timing))
  );
  console.log('performanceTiming', performanceTiming)
  await browser.close();
})();
```
[Source](navigation-timing.js)

<img src="/assets/images/Performance-tracing4.png" alt="Navigation Timing API timings in iTerm from Puppeteer"/>

<h3 id="first-contentful-paint">Measure First Paint & First Contentful Paint</h3>

Metric: [First Contentful Paint - web.dev](https://web.dev/fcp)

First Contentful Paint (FCP) metric measures the time from a page starting to load to when any part of the page's content is rendered on the screen. 

The <a href="https://developer.mozilla.org/en-US/docs/Web/API/Performance_Timeline">Performance Timeline API</a> supports client-side latency measurements. <code>performance.getEntriesByName</code> returns recorded performance entries based on the provided name (e.g "first-paint") and optionally the performance type.

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const navigationPromise = page.waitForNavigation();
  await page.goto('https://pptr.dev');
  
  await navigationPromise;

  const firstPaint = JSON.parse(
    await page.evaluate(() =>
      JSON.stringify(performance.getEntriesByName('first-paint'))
    )
  );

  const firstContentfulPaint = JSON.parse(
    await page.evaluate(() =>
      JSON.stringify(performance.getEntriesByName('first-contentful-paint'))
    )
  );

  console.log(`First paint: ${firstPaint[0].startTime}`);
  console.log(`First paint: ${firstContentfulPaint[0].startTime}`);

  await browser.close();
})();
```
[Source](first-contentful-paint.js)

<h3 id="largest-contentful-paint">Measure Largest Contentful Paint (LCP) w/PerformanceObserver</h3>

Metric: [Largest Contentful Paint - web.dev](https://web.dev/lcp)

The Largest Contentful Paint (LCP) metric reports render time for the largest content element visible in the viewport.

🚨 Lighthouse 6.0 onwards supports measuring LCP and CLS in the lab using the approach in <a href="#lighthouse-metrics">Lighthouse metrics</a> covered earlier. PerformanceObserver is typically used to measure these metrics in the field.

<a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver"><code>PerformanceObserver</code></a> allows you to observe performance measurement events and get notified of new performance entries as they are recorded in the browser's performance timeline. When measuring modern metrics like LCP or CLS with <code>PerformanceObserver</code>, you probably want to wait until the page's <a href="https://developers.google.com/web/updates/2018/07/page-lifecycle-api">lifecycle state</a> has changed to hidden. This ensures that you log the most latest entry.

[Full Puppeteer snippet](https://gist.github.com/addyosmani/c053f68aead473d7585b45c9e8dce31e)

```js
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const phone = devices.devicesMap['Nexus 5X'];

function calcLCP() {
  window.largestContentfulPaint = 0;

  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    window.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      observer.takeRecords();
      observer.disconnect();
      console.log('LCP:', window.largestContentfulPaint);
    }
  });
}


async function getLCP(url) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    timeout: 10000
  });

  try {
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();

    await client.send('Network.enable');
    await client.send('ServiceWorker.enable');
    await page.emulateNetworkConditions(puppeteer.networkConditions['Good 3G']);
    await page.emulateCPUThrottling(4);
    await page.emulate(phone);

    await page.evaluateOnNewDocument(calcLCP);
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    const lcp = await page.evaluate(() => {
      return window.largestContentfulPaint;
    });
    browser.close();
    return lcp;
  } catch (error) {
    console.log(error);
    browser.close();
  }
}

getLCP("https://pptr.dev").then(lcp => console.log("LCP is: " + lcp));
```
[Source](largest-contentful-paint.js)

<img src="/assets/images/Performance-tracing9.png" alt="Largest Contentful Paint"/>


<h3 id="cumulative-layout-shift">Measure Cumulative Layout Shift (CLS) w/PerformanceObserver</h3>

Metric: [Cumulative Layout Shift - web.dev](https://web.dev/cls)

The Cumulative Layout Shift (CLS) metric measures the sum of individual layout shift scores for each unexpected layout shift that occurs between when the page begins loading and when its lifecycle state changes to hidden.

🚨 Lighthouse 6.0 onwards supports measuring CLS and LCP in the lab using the approach in <a href="#lighthouse-metrics">Lighthouse metrics</a> covered earlier. PerformanceObserver is typically used to measure these metrics in the field.

<a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver"><code>PerformanceObserver</code></a> allows you to observe performance measurement events and get notified of new performance entries as they are recorded in the browser's performance timeline. When measuring modern metrics like CLS or LCP with <code>PerformanceObserver</code>, you probably want to wait until the page's <a href="https://developers.google.com/web/updates/2018/07/page-lifecycle-api">lifecycle state</a> has changed to hidden. This ensures that you log the most latest entry.

[Full Puppeteer snippet](https://gist.github.com/martinschierle/0b43f3a56da39aa5aa8f8f9dc431f903).

```js
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
  
const phone = devices.devicesMap['Nexus 5X'];

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
    await page.emulateNetworkConditions(puppeteer.networkConditions['Good 3G']);
    await page.emulateCPUThrottling(4);
    await page.emulate(phone);
    // inject a function with the code from 
    // https://web.dev/cls/#measure-cls-in-javascript
    await page.evaluateOnNewDocument(calcJank);  
    await page.goto(url, { waitUntil: 'load', timeout: 60000});

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

getCLS("https://pptr.dev").then(cls => console.log("CLS is: " + cls));
```
[Source](cumulative-layout-shift.js)

<img src="/assets/images/Performance-tracing10.png" alt="Cumulative Layout Shift"/>

<h3 id="nextjs-metrics">Measure SPA metrics with Next.js</h3>

The <a href="https://web.dev/custom-metrics/">User Timing API</a> is a general purpose measurement API for time-based metrics. It allows you to arbitrarily mark points in time and then later measure the duration between those marks using <code>performance.mark()</code> and <code>performance.measure</code>.

Outside of the performance metrics made available via the Navigation Timing API, single-page apps (SPA) often also have custom metrics for tracking other key moments. In Next.js, these could correspond to Time-to-Hydrate, SPA route transitions and so on.

Next.js recently added the [`unstable_onPerformanceData`](https://github.com/zeit/next.js/pull/8480) helper for tracking client-side performance metrics using `performance.mark` and `performance.measure`. The below Puppeteer script allows us to collect this performance data once you patch your app to log key events to localStorage as in this [Glitch example](https://puppeteersandbox.com/w7u0RLhx) by Houssein Djirdeh.

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  let selector = '';
  page.on('load', () => console.log("Loaded: " + page.url()));
  page.on('framenavigated', frame => {
    console.log(`new url: ${frame.url()}`);
  });

  const navigationPromise = page.waitForNavigation({
    waitUntil: 'networkidle2'
  })

  // Navigate to random Next.js page
  await page.goto('https://new-app-3-op9eiblak.now.sh/')

  console.log('\n==== localStorage hydration entry ====\n');
  const hydrationData = await page.evaluate(() => {
    const data = {
      'before-hydrate-mark': localStorage.getItem('beforeRender'),
      'after-hydrate-mark': Number(localStorage.getItem('beforeRender')) + Number(localStorage.getItem('Next.js-hydration')),
      'hydration-duration': localStorage.getItem('Next.js-hydration'),
    };
    return data;
  });

  console.log(hydrationData);

  await page.screenshot({
    path: 'home-page.png',
    fullPage: true
  });

  await navigationPromise;

  // Navigate to the Blog
  selector = '#__next > div > nav > ul > li:nth-child(1) > a';
  await Promise.all([
    await page.waitForSelector(selector),
    await page.click(selector, {
      delay: 300
    }),
    await page.waitFor(4000),
    await navigationPromise
  ]);

  console.log('\n==== localStorage route change performance entries ====\n');
  const routeChangeData = await page.evaluate(() => {
    const data = {
      'link-click-to-render-start-duration': localStorage.getItem('Next.js-route-change-to-render'),
      'render-duration': localStorage.getItem('Next.js-render')
    };
    return data;
  });

  console.log(routeChangeData);

  await page.screenshot({
    path: 'blog-page.png',
    fullPage: true
  });

  await browser.close();
})();
```
[Source](nextjs-metrics.js)

<h3 id="devtools-frame-rate">Get DevTools-specific metrics: Frames Per Second</h3>

It's possible to open a remote debugging client and turn on DevTools-specific features, such as the frames-per-second (FPS) heads-up-display.

Puppeteer API: [createCDPSession()](https://pptr.dev/#?product=Puppeteer&show=api-targetcreatecdpsession)

```js
const puppeteer = require('puppeteer');

(async () => {
  const args = await puppeteer.defaultArgs().filter(flag => flag !== '--enable-automation');
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    ignoreDefaultArgs: true,
    args
  });
  const page = await browser.newPage();
  const devtoolsProtocolClient = await page.target().createCDPSession();
  await devtoolsProtocolClient.send('Overlay.setShowFPSCounter', { show: true });
  await page.goto('https://pptr.dev');
  await page.screenshot({ path: './image.jpg', type: 'jpeg' });
  await page.close();
  await browser.close();
})();
```
[Source](devtools-frame-rate.js)

<img src="/assets/images/Performance-tracing6a.png" alt="FPS meter from DevTools rendered via Puppeteer"/>

<h3 id="measure-memory-leaks">Measure memory leaks</h3>

Checking the number of objects retained on the heap can be a good basic start to measuring memory leaks in JavaScript. In Puppeteer, `queryObjects()` can be used to count all the objects with the same prototype somewhere in the prototype chain.

Puppeteer API: [queryObjects()](https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=api-pagequeryobjectsprototypehandle)

For a more detailed look at this topic, check out [automatically detecting memory-leaks with Puppeteer](https://media-codings.com/articles/automatically-detect-memory-leaks-with-puppeteer).

```js
const puppeteer = require('puppeteer');

// Helper by @chrisguttandin
const countObjects = async (page) => {
  const prototypeHandle = await page.evaluateHandle(() => Object.prototype);
  const objectsHandle = await page.queryObjects(prototypeHandle);
  const numberOfObjects = await page.evaluate((instances) => instances.length, objectsHandle);

  await Promise.all([
    prototypeHandle.dispose(),
    objectsHandle.dispose()
  ]);

  return numberOfObjects;
};

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.createIncognitoBrowserContext();

  const numberOfObjects = await countObjects(page);
  console.log(numberOfObjects);

  await page.evaluate(() => {
    class SomeObject {
      constructor () {
        this.numbers = {}
        for (let i = 0; i < 1000; i++) {
          this.numbers[Math.random()] = Math.random()
        }
      }
    }
    const someObject = new SomeObject();
    const onMessage = () => { /* ... */ };
    window.addEventListener('message', onMessage);
  });

  const numberOfObjectsAfter = await countObjects(page);
  console.log(numberOfObjectsAfter);

  // Check if the number of retained objects is expected
  // expect(await countObjects(page)).to.equal(0);

  await browser.close();
})();
```
[Source](measure-memory-leaks.js)

<h3 id="request-interception">Override requests with Request Interception</h3>

Request interception (overrides) allows you to modify network requests that are made by a page. 

Puppeteer API: [setRequestInterception()](https://pptr.dev/#?product=Puppeteer&version=v3.0.0&show=api-pagesetrequestinterceptionvalue)

<h4>Block requests for images</h4>

```js
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  
  page.on('request', (req) => {
    if (req.resourceType() === 'image'){
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto('https://bbc.com');
  await page.screenshot({path: 'no-images.png', fullPage: true});
  await browser.close();
})();
```
[Source](request-interception-block-images.js)

<h4>Replace a remote resource with a local one</h4>

In the below snippet, we override a remote resource for the Puppeteer site (pptr.dev/style.css) with a local version (assets/style.css). In the version served, you'll see the Puppeteer site is rendered with our green background colors instead.

```js
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
  const localFilePath = path.join(__dirname, "./assets/style.css");

  await page.setRequestInterception(true);

  page.on('request', interceptedRequest => {
    const url = interceptedRequest.url();
    console.log(`Intercepted ${url}`);

    if (url === remoteFilePath && !url.match(localFilePath)) {
      interceptedRequest.respond({
        body: fs.readFileSync(
          localFilePath
        )
      });
    } else {
      interceptedRequest.continue();
    }
  });

  await page.goto(remoteURL, {
    waitUntil: 'networkidle2'
  });

  await page.screenshot({path: 'override.png', fullPage: true});
  await browser.close();

})();
```
[Source](request-interception-replace-resources.js)

![Puppeteer comparison before and after request interception](/assets/images/pptr-comparison.jpg)

While this example doesn't demonstrate it, you could use network overrides to experiment with the before/after for a number of different performance optimizations.


<h3 id="block-third-parties">Block third-party domains</h3>

You can block specific requests using Puppeteer's request interception feature. This can be helpful for profiling performance with specific domains blocked to see the before/after.

Puppeteer API: [setRequestInterception](https://pptr.dev/#?product=Puppeteer&version=v2.1.1&show=api-pagesetrequestinterceptionvalue)

```js
const puppeteer = require('puppeteer');

(async() => {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  const options = {
    waitUntil: 'networkidle2',
    timeout: 30000
  };

  // Before: Normal navigtation
  await page.goto('https://theverge.com', options);
  await page.screenshot({path: 'before.png', fullPage: true});
  const metrics = await page.metrics();
  console.info(metrics);

  // After: Navigation with some domains blocked
  
  // Array of third-party domains to block
  const blockedDomains = [
    'https://pagead2.googlesyndication.com',
    'https://creativecdn.com',
    'https://www.googletagmanager.com',
    'https://cdn.krxd.net',
    'https://adservice.google.com',
    'https://cdn.concert.io',
    'https://z.moatads.com',
    'https://cdn.permutive.com'];
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url()
    if (blockedDomains.some(d => url.startsWith(d))) {
      request.abort();
    } else {
      request.continue();
    }
  });
  
  await page.goto('https://theverge.com', options);
  await page.screenshot({path: 'after.png', fullPage: true});

  const metricsAfter = await page.metrics();
  console.info(metricsAfter);

  await browser.close();
})();
```
[Source](request-interception-block-third-parties.js)

![The Verge before/after domain blocking](/assets/images/comparison-before-after@2x.jpg)

<h3 id="code-coverage">Code Coverage for JavaScript and CSS</h3>

Puppeteer API: [page.coverage.startJSCoverage()](https://pptr.dev/#?product=Puppeteer&version=v3.0.1&show=api-coveragestartjscoverageoptions)

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Gather coverage for JS and CSS files
  await Promise.all([page.coverage.startJSCoverage(), page.coverage.startCSSCoverage()]);

  await page.goto('https://pptr.dev');

  // Stops the coverage gathering
  const [jsCoverage, cssCoverage] = await Promise.all([
    page.coverage.stopJSCoverage(),
    page.coverage.stopCSSCoverage(),
  ]);

  // Calculates # bytes being used based on the coverage
  const calculateUsedBytes = (type, coverage) =>
    coverage.map(({url, ranges, text}) => {
      let usedBytes = 0;

      ranges.forEach((range) => (usedBytes += range.end - range.start - 1));

      return {
        url,
        type,
        usedBytes,
        totalBytes: text.length,
        percentUsed: `${(usedBytes / text.length * 100).toFixed(2)}%`
      };
    });

  console.info([
    ...calculateUsedBytes('js', jsCoverage),
    ...calculateUsedBytes('css', cssCoverage),
  ]);

  await browser.close();
})();
```

[Source](code-coverage.js)

Output preview:

```sh
  {
    url: 'https://pptr.dev/index.js',
    type: 'js',
    usedBytes: 59370,
    totalBytes: 141703,
    percentUsed: '41.90%'
  },
  {
    url: 'https://www.googletagmanager.com/gtag/js?id=UA-106086244-2',
    type: 'js',
    usedBytes: 20646,
    totalBytes: 81644,
    percentUsed: '25.29%'
  },
  {
    url: 'https://pptr.dev/style.css',
    type: 'css',
    usedBytes: 1409,
    totalBytes: 14326,
    percentUsed: '9.84%'
  }
```

<h3 id="har-file">Save network requests to a HAR file</h3>

💡 A [HAR](https://www.keycdn.com/support/what-is-a-har-file) (HTTP Archive) file is a JSON format for tracking performance issues. It keeps track of each resource loaded over the network by the browser including the timing information for each of these resources.

You can use the [puppeteer-har](https://github.com/Everettss/puppeteer-har) package to generate a HAR file as follows:

```js
const puppeteer = require('puppeteer');
const HAR = require('puppeteer-har');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const har = new HAR(page);
  await har.start({ path: 'results.har' });
  await page.goto('https://pptr.dev');
  await har.stop();
  await browser.close();
})();
```

[Source](generate-har.js)

HAR files can be imported back into Chrome DevTools for analysis or alternatively can be viewed in the [HAR Analyzer](https://toolbox.googleapps.com/apps/har_analyzer/) project.

![Generated HAR file being loaded into the Network panel in DevTools](/assets/images/puppeteer-har.png)


## Read more

* [Getting to know Puppeteer using practical examples](https://nitayneeman.com/posts/getting-to-know-puppeteer-using-practical-examples/)
* [Performance testing in the browser](https://github.com/llatinov/sample-performance-testing-in-browser)
* [Getting to Know Puppeteer Using Practical Examples](https://nitayneeman.com/posts/getting-to-know-puppeteer-using-practical-examples/)
* [End to end testing React apps with Puppeteer](https://blog.logrocket.com/end-to-end-testing-react-apps-with-puppeteer-and-jest-ce2f414b4fd7/)
* [using CDP with Puppeteer](https://medium.com/@jsoverson/using-chrome-devtools-protocol-with-puppeteer-737a1300bac0)
