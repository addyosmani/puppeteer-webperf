/* eslint-disable */
const puppeteer = require('puppeteer');

// Helper by @chrisguttandin
const countObjects = async (page) => {
  const prototypeHandle = await page.evaluateHandle(() => Object.prototype);
  const objectsHandle = await page.queryObjects(prototypeHandle);
  const numberOfObjects = await page.evaluate((instances) => instances.length, objectsHandle);

  await Promise.all([
    prototypeHandle.dispose(),
    objectsHandle.dispose(),
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
      constructor() {
        this.numbers = {};
        for (let i = 0; i < 1000; i++) {
          this.numbers[Math.random()] = Math.random();
        }
      }
    }
    const someObject = new SomeObject();
    const onMessage = () => {/* ... */};
    window.addEventListener('message', onMessage);
  });

  const numberOfObjectsAfter = await countObjects(page);
  console.log(numberOfObjectsAfter);

  // Check if the number of retained objects is expected
  // expect(await countObjects(page)).to.equal(0);

  await browser.close();
})();
