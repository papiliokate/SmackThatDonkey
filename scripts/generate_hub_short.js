import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as googleTTS from 'google-tts-api';
import { spawn } from 'child_process';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const TTS_PATH = path.resolve('public/tts_hub.mp3');
const bgmDir = path.resolve('public/bgm');
let BGM_PATH = '';
if (fs.existsSync(bgmDir)) {
    const bgmFiles = fs.readdirSync(bgmDir).filter(f => f.endsWith('.mp3'));
    if (bgmFiles.length > 0) {
        const randomBgm = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
        BGM_PATH = path.resolve(bgmDir, randomBgm);
        console.log(`Selected BGM: ${randomBgm}`);
    }
}
const RAW_VIDEO = path.resolve('raw_hub_teaser.mp4');
const FINAL_VIDEO = path.resolve('C:/Users/papil/Downloads/hub_teaser.mp4');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    const ttsText = "Check out our brand new Oops-Games hub! Play all your favorite free logic games in one place. But wait... what are these mysterious cypher inputs? Can you uncover the secret?";

    console.log("Generating TTS audio...");
    try {
        const ttsUrl = googleTTS.getAudioUrl(ttsText, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
        });
        const ttsResponse = await fetch(ttsUrl);
        const ttsBuffer = await ttsResponse.arrayBuffer();
        fs.writeFileSync(TTS_PATH, Buffer.from(ttsBuffer));
        console.log("TTS audio successfully generated.");
    } catch (err) {
        console.warn("Failed to generate TTS audio.", err);
        fs.writeFileSync(TTS_PATH, Buffer.from([]));
    }

    console.log("Starting StudioHub server...");
    const server = spawn('cmd.exe', ['/c', 'npx', 'vite', '--port', '5008'], { 
        cwd: 'C:/Users/papil/Documents/StudioHub',
        stdio: 'ignore'
    });

    await sleep(3000); // Wait for vite to start

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--window-size=720,1280',
            '--autoplay-policy=no-user-gesture-required',
            '--disable-web-security',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 720, height: 1280 });
    
    // Add custom cursor styling
    await page.evaluateOnNewDocument(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            * { cursor: none !important; }
            .puppeteer-cursor {
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.4);
                border: 2px solid white;
                border-radius: 50%;
                position: fixed;
                pointer-events: none;
                z-index: 999999;
                transform: translate(-50%, -50%);
                transition: transform 0.1s ease;
            }
        `;
        document.head.appendChild(style);
        
        window.addEventListener('DOMContentLoaded', () => {
            const cursor = document.createElement('div');
            cursor.classList.add('puppeteer-cursor');
            document.body.appendChild(cursor);
            
            window.addEventListener('mousemove', e => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            });
            window.addEventListener('mousedown', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
                cursor.style.background = 'rgba(255, 255, 255, 0.8)';
            });
            window.addEventListener('mouseup', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.background = 'rgba(255, 255, 255, 0.4)';
            });
        });
    });

    const recorder = new PuppeteerScreenRecorder(page, {
        fps: 30,
        ffmpeg_Path: ffmpegInstaller.path,
        videoFrame: { width: 720, height: 1280 },
        aspectRatio: '9:16',
    });

    console.log("Navigating to StudioHub...");
    await page.goto(`http://localhost:5008/`, { waitUntil: 'networkidle2' });

    // Apply standard UI scaler to fix proportions for 720x1280 video before recording
    await page.evaluate(() => {
        const container = document.querySelector('.hub-container');
        if (container) {
            container.style.transform = `scale(${720 / 400})`;
            container.style.transformOrigin = 'top center';
        }
        window.scrollBy(0, 350);
    });

    // Give time for layout rendering to complete
    await sleep(1000);

    console.log("Starting recording...");
    await recorder.start(RAW_VIDEO);

    // Initial pause in the video
    await sleep(1000);

    // Move cursor around games
    await page.mouse.move(360, 150, { steps: 20 });
    await sleep(1000);
    await page.mouse.move(360, 300, { steps: 20 });
    await sleep(1000);
    await page.mouse.move(360, 450, { steps: 20 });
    await sleep(1000);

    // Move cursor over cypher input
    const cypherBox = await page.$('#cypher-1');
    if (cypherBox) {
        const box = await cypherBox.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
        await sleep(500);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        
        await sleep(500);
        await cypherBox.type("?");
        await sleep(500);
        await cypherBox.type("?");
        await sleep(1000);
    }
    
    // Tease the vault page directly, but just briefly
    await page.goto(`http://localhost:5008/vault.html`, { waitUntil: 'load' });
    
    // Apply scaler to vault
    await page.evaluate(() => {
        const container = document.querySelector('.vault-container') || document.body;
        if (container) {
            container.style.transform = `scale(${720 / 400})`;
            container.style.transformOrigin = 'top center';
        }
    });
    
    // Just hover around the vault
    await sleep(1000);
    await page.mouse.move(360, 400, { steps: 20 });
    await sleep(2000);

    console.log("Gameplay finished. Saving video...");
    await recorder.stop();
    await browser.close();
    server.kill(); // Stop vite

    console.log("Compositing YouTube Short video using FFmpeg...");
    
    await new Promise((resolve, reject) => {
        let f = ffmpeg().input(RAW_VIDEO);
        if (BGM_PATH) {
            f = f.input(BGM_PATH).inputOptions(['-stream_loop', '-1']);
            f = f.input(TTS_PATH);
            f = f.complexFilter([
                '[1:a]volume=0.3[bgm_quiet]',
                '[2:a]volume=1.5[tts_loud]',
                '[bgm_quiet][tts_loud]amix=inputs=2:duration=first:dropout_transition=3[audio_out]'
            ])
            .outputOptions([
                '-y',
                '-map 0:v',
                '-map [audio_out]',
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-preset slow',
                '-crf 18',
                '-c:a aac',
                '-b:a 192k',
                '-shortest'
            ]);
        } else {
            f = f.input(TTS_PATH).outputOptions([
                '-y',
                '-map 0:v',
                '-map 1:a',
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-preset slow',
                '-crf 18',
                '-c:a aac',
                '-b:a 192k',
                '-shortest'
            ]);
        }

        f.save(FINAL_VIDEO)
        .on('end', () => {
            console.log(`Successfully generated Video at: ${FINAL_VIDEO}`);
            resolve();
        })
        .on('error', (err) => {
            console.error("FFmpeg Error:", err);
            reject(err);
        });
    });
}

main().then(() => {
    console.log("Done.");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
