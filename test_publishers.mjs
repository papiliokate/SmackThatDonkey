import puppeteer from 'puppeteer';

async function testPublishers() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    
    page.on('pageerror', err => {
        console.log('PAGE ERROR:', err.message);
        console.log('STACK:', err.stack);
    });

    console.log("Navigating directly to lightning-words embed...");
    await page.goto('https://oops-games.com/lightning-words/?mode=embed', { waitUntil: 'networkidle0' });
    
    await browser.close();
}

testPublishers().catch(console.error);
