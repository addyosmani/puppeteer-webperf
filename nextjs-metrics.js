const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let selector = '';
  page.on('load', () => console.log('Loaded: ' + page.url()));
  page.on('framenavigated', (frame) => {
    console.log(`new url: ${frame.url()}`);
  });

  const navigationPromise = page.waitForNavigation({
    waitUntil: 'networkidle2',
  });

  // Navigate to random Next.js page
  await page.goto('https://new-app-3-op9eiblak.now.sh/');

  console.log('\n==== localStorage hydration entry ====\n');
  const hydrationData = await page.evaluate(() => {
    const data = {
      'before-hydrate-mark': localStorage.getItem('beforeRender'),
      'after-hydrate-mark':
        Number(localStorage.getItem('beforeRender')) +
        Number(localStorage.getItem('Next.js-hydration')),
      'hydration-duration': localStorage.getItem('Next.js-hydration'),
    };
    return data;
  });

  console.log(hydrationData);

  await page.screenshot({
    path: 'home-page.png',
    fullPage: true,
  });

  await navigationPromise;

  // Navigate to the Blog
  selector = '#__next > div > nav > ul > li:nth-child(1) > a';
  await Promise.all([
    await page.waitForSelector(selector),
    await page.click(selector, {
      delay: 300,
    }),
    await page.waitFor(4000),
    await navigationPromise,
  ]);

  console.log('\n==== localStorage route change performance entries ====\n');
  const routeChangeData = await page.evaluate(() => {
    const data = {
      'link-click-to-render-start-duration':
         localStorage.getItem('Next.js-route-change-to-render'),
      'render-duration': localStorage.getItem('Next.js-render'),
    };
    return data;
  });

  console.log(routeChangeData);

  await page.screenshot({
    path: 'blog-page.png',
    fullPage: true,
  });

  await browser.close();
})();
