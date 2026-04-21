import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.log("Starting Vite server...");
    const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort', '--host', '127.0.0.1', '--clearScreen', 'false'], {
        cwd: process.cwd(),
        shell: false
    });
    
    server.stderr.on('data', (data) => console.error("VITE ERROR:", data.toString()));
    server.stdout.on('data', (data) => console.log("VITE:", data.toString()));

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
        headless: 'new',
        args: [
            '--window-size=720,1280',
            '--autoplay-policy=no-user-gesture-required',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 720, height: 1280 });
    
    const recorder = new PuppeteerScreenRecorder(page, {
        fps: 30,
        ffmpeg_Path: ffmpegInstaller.path,
        videoFrame: { width: 720, height: 1280 },
        aspectRatio: '9:16',
    });

    console.log("Navigating to game in autoplay mode...");
    await page.goto(`http://127.0.0.1:5173/?autoplay=standard`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Hide links/overlays (modals and buttons)
    await page.addStyleTag({content: `
        .modal { display: none !important; }
        .header-actions { display: none !important; }
    `});

    const DOWNLOADS_DIR = path.join(process.env.USERPROFILE || 'c:\\Users\\papil', 'Downloads');
    if (!fs.existsSync(DOWNLOADS_DIR)) {
        fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }
    const outputFile = path.join(DOWNLOADS_DIR, 'smack_that_gameplay.mp4');

    console.log(`Recording gameplay to ${outputFile}...`);
    await recorder.start(outputFile);

    // Run for exactly 20 seconds
    let secondsElapsed = 0;
    while (secondsElapsed < 20) {
        await sleep(1000);
        secondsElapsed++;
        console.log(`Recorded: ${secondsElapsed}s / 20s`);
    }

    console.log("Stopping recording...");
    await recorder.stop();
    
    await browser.close();
    server.kill();

    console.log(`Video saved successfully at: ${outputFile}`);
    process.exit(0);
}

main().catch(err => {
    console.error("Recording failed:", err);
    process.exit(1);
});
