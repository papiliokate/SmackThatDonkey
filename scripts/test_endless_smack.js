import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.log("Starting Vite server...");
    const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort', '--host', '127.0.0.1', '--clearScreen', 'false'], {
        cwd: process.cwd(),
        shell: false
    });
    
    let viteReady = false;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch("http://127.0.0.1:5173/");
            if (res.ok) { viteReady = true; break; }
        } catch (e) {}
        await sleep(500);
    }
    
    if (!viteReady) {
        console.error("Vite server failed to start.");
        server.kill();
        process.exit(1);
    }

    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
        headless: false, // Show the browser so we can hear and see it
        defaultViewport: null, // use window size
        args: [
            '--window-size=720,1280',
            '--autoplay-policy=no-user-gesture-required',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();
    
    console.log("Navigating to game...");
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' });

    console.log("Starting endless smack test...");
    
    // Inject the smacking logic directly into the page
    await page.evaluate(async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        
        function clickAnimated(node) {
            if (!node) return;
            const rect = node.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            const customCursor = document.getElementById('custom-cursor');
            if (customCursor) {
                customCursor.style.display = 'block';
                // Fast transition for rapid intermittent cadence
                customCursor.style.transition = 'left 0.05s ease-out, top 0.05s ease-out';
                customCursor.style.left = x + 'px';
                customCursor.style.top = y + 'px';
            }
            
            node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
            setTimeout(() => {
                node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
                node.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
            }, 50);
        }

        async function endlessSmack() {
            while (true) {
                const donkeys = document.querySelectorAll('.donkey');
                if (donkeys.length > 0) {
                    const randomDonkey = donkeys[Math.floor(Math.random() * donkeys.length)];
                    clickAnimated(randomDonkey);
                }
                
                // Rapid intermittent cadence
                // Mostly fast (50-200ms), sometimes pauses (up to 800ms)
                let delay = Math.random() < 0.8 
                    ? Math.floor(Math.random() * 150) + 50 
                    : Math.floor(Math.random() * 600) + 200;
                    
                await sleep(delay);
            }
        }
        
        endlessSmack();
    });

    console.log("Test is running. Close the browser window to stop the test.");
    
    // Wait until browser is closed
    await new Promise(resolve => {
        browser.on('disconnected', resolve);
    });
    
    console.log("Browser closed. Stopping Vite server...");
    server.kill();
    process.exit(0);
}

main().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
