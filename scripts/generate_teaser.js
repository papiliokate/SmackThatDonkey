import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as googleTTS from 'google-tts-api';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const TTS_PATH = path.resolve('public/tts.mp3');
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
const RAW_VIDEO = path.resolve('raw_teaser.mp4');
const FINAL_VIDEO = path.resolve('C:/Users/papil/Downloads/marketing_teaser.mp4');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    const ttsText = "We just launched a massive secret across all our games. Find the hidden cyphers and team up to unlock the master vault! Prove you are a master. Link in bio to play!";

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

    const browser = await puppeteer.launch({
        headless: 'new', // changed to new for newer puppeteer
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
    
    const recorder = new PuppeteerScreenRecorder(page, {
        fps: 30,
        ffmpeg_Path: ffmpegInstaller.path,
        videoFrame: { width: 720, height: 1280 },
        aspectRatio: '9:16',
    });

    // We assume Vite servers are running on 5178 and 5000 
    console.log("Starting recording...");
    await recorder.start(RAW_VIDEO);

    console.log("Navigating to SmackThatDonkey...");
    await page.goto(`http://localhost:5178/?autoplay=standard`, { waitUntil: 'load' });

    let gameWon = false;
    for (let i = 0; i < 240; i++) { 
        gameWon = await page.evaluate(() => window._VIDEO_RECORDING_DONE === true);
        if (gameWon) break;
        await sleep(500);
    }
    
    // Chill on win screen to show cypher
    await sleep(2500);

    console.log("Navigating to StudioHub...");
    await page.goto(`http://localhost:5000/`, { waitUntil: 'load' });
    await page.evaluate(() => localStorage.setItem('vault_unlocked', 'true'));
    await page.goto(`http://localhost:5000/vault.html`, { waitUntil: 'load' });
    
    await sleep(1500);

    const combo = "BTMYW2C84XW8"; 
    // Type the combo slowly
    const vaultBoxes = await page.$$('.vault-box');
    for (let i=0; i<combo.length && i<vaultBoxes.length; i++) {
        await vaultBoxes[i].type(combo[i], { delay: 100 });
        await sleep(100);
    }
    
    await sleep(500);
    const submitBtn = await page.$('#vault-submit');
    if (submitBtn) {
        await submitBtn.click();
    }
    
    // Wait for confetti and celebration
    await sleep(6000);

    console.log("Gameplay finished. Saving video...");
    await recorder.stop();
    await browser.close();

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
