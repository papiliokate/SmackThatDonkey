import puppeteer from 'puppeteer';

async function test() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://127.0.0.1:5173/?autoplay=standard', { waitUntil: 'domcontentloaded' });
    
    let gameWon = false;
    for (let i = 0; i < 240; i++) { 
        gameWon = await page.evaluate(() => window._VIDEO_RECORDING_DONE === true);
        if (gameWon) {
            console.log("GAME WON!");
            break;
        }
        await new Promise(r => setTimeout(r, 500));
    }
    if (!gameWon) console.log("TIMED OUT");
    
    await browser.close();
}
test();
