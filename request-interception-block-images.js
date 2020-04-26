import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    
    page.on('request', (req) => {
        if (req.resourceType() === 'image'){
            req.abort();
        }
        else {
            req.continue();
        }
    });

    await page.goto('https://bbc.com');
    await page.screenshot({path: 'no-images.png', fullPage: true});
    await browser.close();
})();