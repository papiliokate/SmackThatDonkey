import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as googleTTS from 'google-tts-api';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const TTS_PATH = path.resolve('public/tts.mp3');
const DOOR_CREAK_PATH = path.resolve('../StudioHub/public/assets/door_creak.mp3');
const bgmDir = path.resolve('public/bgm');
let BGM_PATH = '';
if (fs.existsSync(bgmDir)) {
    const bgmFiles = fs.readdirSync(bgmDir).filter(f => f.endsWith('.mp3'));
    if (bgmFiles.length > 0) {
        const randomBgm = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
        BGM_PATH = path.resolve(bgmDir, randomBgm);
        console.log(`Selected BGM: ${randomBgm}`);
    }
} else {
    // Fallback if no bgm dir
    BGM_PATH = path.resolve('public/audio/barnyard.wav');
}

const RAW_VIDEO = path.resolve('raw_glitch.mp4');
const FINAL_VIDEO = path.resolve(process.env.USERPROFILE, 'Downloads', 'glitch_video.mp4');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort', '--host', '127.0.0.1', '--clearScreen', 'false'], {
        cwd: process.cwd(),
        shell: false
    });
    
    server.stderr.on('data', (data) => console.error("VITE ERROR:", data.toString()));
    
    console.log("Waiting for Vite dev server to boot...");
    let viteReady = false;
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch("http://127.0.0.1:5173/");
            if (res.ok) { viteReady = true; break; }
        } catch (e) {}
        await sleep(500);
    }
    if (!viteReady) throw new Error("Vite server failed to start.");
    console.log("Server is ready!");

    const ttsPools = {
        standard: [
            "Can you smack that donkey in the right order? Check out the link in our bio to play all our games for free!",
            "Here is today's Smack That puzzle. Pay attention, and head to our profile to play for free!",
            "Let's see if you can solve this sequence. Give it a try at the link in our bio!",
            "A new day, a new sequence to smack. Check out the link in our bio to play yourself!",
            "Do you have what it takes to beat today's challenge? Play free from our profile!"
        ]
    };
    const ttsText = ttsPools.standard[Math.floor(Math.random() * ttsPools.standard.length)];

    console.log("Generating TTS audio...");
    try {
        const ttsUrl = googleTTS.getAudioUrl(ttsText, { lang: 'en', slow: false, host: 'https://translate.google.com' });
        const ttsResponse = await fetch(ttsUrl);
        const ttsBuffer = await ttsResponse.arrayBuffer();
        fs.writeFileSync(TTS_PATH, Buffer.from(ttsBuffer));
        console.log("TTS audio successfully generated.");
    } catch (err) {
        console.warn("Failed to generate TTS audio, continuing without it.", err);
        fs.writeFileSync(TTS_PATH, Buffer.from([]));
    }

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

    console.log("Navigating to game and starting recording...");
    try {
        await page.goto(`http://127.0.0.1:5173/?autoplay=standard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
        console.warn("Navigation timeout reached.", e.message);
    }

    console.log("Starting Puppeteer Screen Recorder...");
    await recorder.start(RAW_VIDEO);

    console.log("Recording... Waiting for glitch moment (approx 4 seconds in)");
    await sleep(4000);
    
    console.log("TRIGGERING GLITCH IN UI...");
    await page.evaluate(() => {
        const style = document.createElement('style');
        style.id = 'glitch-style';
        style.innerHTML = `
            body { 
                filter: invert(1) hue-rotate(180deg) contrast(200%) saturate(300%) !important;
                background: #000 !important;
            }
            .donkey .letter { 
                color: #0f0 !important; 
                font-family: monospace !important; 
                transform: scale(1.5) rotate(15deg) !important; 
                opacity: 1 !important; 
                text-shadow: 2px 2px #f00, -2px -2px #00f !important;
            }
            .hay-bale { 
                background: #000 !important; 
                color: #0f0 !important; 
                font-family: monospace !important; 
                border: 2px dashed #0f0 !important; 
            }
            #trivia-question { 
                font-family: monospace !important; 
                color: red !important; 
                font-size: 2rem !important; 
                text-transform: uppercase;
            }
        `;
        document.head.appendChild(style);
        
        // Grab a cypher code, hardcoded for visual effect
        const cypher = "X9K2"; 
        document.querySelectorAll('.letter').forEach((el, i) => {
            el.dataset.oldText = el.textContent;
            el.textContent = cypher.charAt(i % cypher.length);
        });
        document.querySelectorAll('.hay-bale').forEach((el, i) => {
            el.dataset.oldText = el.textContent;
            el.textContent = cypher.charAt(i % cypher.length);
        });
        
        const trivia = document.getElementById('trivia-question');
        trivia.dataset.oldText = trivia.textContent;
        trivia.textContent = "SYSTEM BREACH DETECTED: VAULT " + cypher;
        
        // Add random displacement
        document.getElementById('game-container').style.transform = 'scale(1.1) translateX(10px) translateY(-10px)';
    });

    await sleep(700); // Glitch duration

    console.log("REVERTING GLITCH IN UI...");
    await page.evaluate(() => {
        document.getElementById('glitch-style').remove();
        document.querySelectorAll('.letter').forEach(el => {
            if(el.dataset.oldText) el.textContent = el.dataset.oldText;
        });
        document.querySelectorAll('.hay-bale').forEach(el => {
            if(el.dataset.oldText) el.textContent = el.dataset.oldText;
            else el.textContent = ''; // Empty bales
        });
        const trivia = document.getElementById('trivia-question');
        if(trivia.dataset.oldText) trivia.textContent = trivia.dataset.oldText;
        
        document.getElementById('game-container').style.transform = ''; // reset scaling
        // Fire resize event to trigger rescaleGame logic
        window.dispatchEvent(new Event('resize'));
    });

    console.log("Waiting for game completion.");
    let gameWon = false;
    for (let i = 0; i < 240; i++) { 
        gameWon = await page.evaluate(() => window._VIDEO_RECORDING_DONE === true);
        if (gameWon) break;
        await sleep(500);
    }

    console.log("Gameplay finished. Saving video...");
    await recorder.stop();
    
    try { await browser.close(); } catch(e) {}
    server.kill();

    console.log("Compositing TikTok Glitch video using FFmpeg...");
    
    await new Promise((resolve, reject) => {
        let f = ffmpeg().input(RAW_VIDEO);
        
        f = f.input(BGM_PATH).inputOptions(['-stream_loop', '-1']);
        f = f.input(TTS_PATH);
        
        if (fs.existsSync(DOOR_CREAK_PATH)) {
             f = f.input(DOOR_CREAK_PATH);
             // 0:v (video), 1:a (bgm), 2:a (tts), 3:a (door creak)
             // We add a volume drop to the BGM during the glitch (around 4 seconds in)
             // And we play the door creak at 4 seconds.
             f = f.complexFilter([
                 "[1:a]volume=0.3,volume=0.0:enable='between(t,4,5)',volume=0.3:enable='gt(t,5)'[bgm_quiet]",
                 '[2:a]volume=1.5[tts_loud]',
                 '[3:a]volume=2.0,adelay=4000|4000[creak]',
                 '[bgm_quiet][tts_loud][creak]amix=inputs=3:duration=first:dropout_transition=0[audio_out]'
             ])
             .outputOptions([
                 '-y',
                 '-map 0:v',
                 '-map [audio_out]',
                 '-c:v libx264',
                 '-pix_fmt yuv420p',
                 '-preset fast',
                 '-crf 18',
                 '-c:a aac',
                 '-b:a 192k',
                 '-shortest'
             ]);
        } else {
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
                 '-preset fast',
                 '-crf 18',
                 '-c:a aac',
                 '-b:a 192k',
                 '-shortest'
             ]);
        }

        f.save(FINAL_VIDEO)
        .on('end', () => {
            console.log(`Successfully generated Glitch video at: ${FINAL_VIDEO}`);
            resolve();
        })
        .on('error', (err) => {
            console.error("FFmpeg Error:", err);
            reject(err);
        });
    });
}

main().then(() => {
    if (!fs.existsSync(FINAL_VIDEO) || fs.statSync(FINAL_VIDEO).size < 1024) {
        throw new Error("Final video was not created or is empty!");
    }
    console.log("Process complete. Exiting natively.");
    process.exit(0);
}).catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
});
