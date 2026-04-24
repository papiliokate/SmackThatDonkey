import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
    console.log("Starting PWA Fallback Test...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Start a simple static server or just use file:// protocol. 
    // We'll use file:// since Vite might not be running.
    const projectRoot = join(__dirname, '..');
    const indexPath = `file://${join(projectRoot, 'index.html').replace(/\\/g, '/')}`;

    console.log("Testing iOS User Agent...");
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
    await page.goto(indexPath, { waitUntil: 'networkidle0' });
    
    // Evaluate if iOS modal exists and opens
    const iosResult = await page.evaluate(() => {
        // Find the install button
        const btn = document.getElementById('btn-install') || document.getElementById('btn-remind-tomorrow') || document.querySelector('.btn-install');
        if (!btn) return "FAIL: Install button not found";
        
        // Ensure modal is hidden initially
        const modal = document.getElementById('ios-install-modal');
        if (!modal) return "FAIL: ios-install-modal not found in DOM";
        
        btn.click();
        
        // Check if modal is active
        if (modal.classList.contains('active') || modal.classList.contains('show') || !modal.classList.contains('hidden') || modal.style.display === 'flex' || modal.style.display === 'block') {
            return "SUCCESS: iOS Modal shown";
        } else {
            return "FAIL: iOS Modal not shown on click";
        }
    });
    console.log("iOS Test Result:", iosResult);

    console.log("\nTesting Android User Agent...");
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36');
    await page.goto(indexPath, { waitUntil: 'networkidle0' });
    
    const androidResult = await page.evaluate(() => {
        const btn = document.getElementById('btn-install') || document.getElementById('btn-remind-tomorrow') || document.querySelector('.btn-install');
        if (!btn) return "FAIL: Install button not found";
        
        const modal = document.getElementById('ios-install-modal');
        
        // We simulate beforeinstallprompt since Puppeteer doesn't fire it natively
        const event = new Event('beforeinstallprompt');
        event.prompt = () => { window.__promptCalled = true; };
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);
        
        btn.click();
        
        if (modal && (modal.classList.contains('active') || modal.classList.contains('show'))) {
            return "FAIL: iOS Modal shown on Android";
        }
        
        if (window.__promptCalled) {
            return "SUCCESS: deferredPrompt.prompt() called";
        } else {
            // It might fallback to alert if event isn't supported, but we dispatched it
            return "WARN: Prompt not called, might fallback to alert.";
        }
    });
    console.log("Android Test Result:", androidResult);

    await browser.close();
    console.log("Test script finished.");
})();
