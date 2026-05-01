import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as googleTTS from 'google-tts-api';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const FORMAT = 'tts'; // Always TTS for this version
const TTS_PATH = path.resolve('public/tts.mp3');
const RAW_VIDEO = path.resolve('raw_bad_donkey_long.mp4');
const FINAL_VIDEO = path.resolve(process.env.USERPROFILE || 'C:/Users/papil', 'Downloads', 'bad_donkey_43s.mp4');

const AUDIO_BARNYARD = path.resolve('public/audio/barnyard.wav');
const AUDIO_SMACK = path.resolve('public/audio/smack.wav');
const AUDIO_DONKEY = path.resolve('public/audio/donkey.ogg');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    const server = spawn('node', ['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort', '--host', '127.0.0.1', '--clearScreen', 'false'], {
        cwd: process.cwd(),
        shell: false
    });
    
    server.stderr.on('data', (data) => console.error("VITE ERROR:", data.toString()));
    server.stdout.on('data', (data) => console.log("VITE:", data.toString()));

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

    console.log(`Generating 43s bad donkey video...`);

    const ttsText = "Bad donkey. You are a bad bad donkey.";
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
        await page.goto(`http://127.0.0.1:5173/`, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
        console.warn("Navigation timeout reached.", e.message);
    }

    console.log("Starting Puppeteer Screen Recorder...");
    await recorder.start(RAW_VIDEO);

    console.log("Injecting endless smack logic for 43 seconds...");
    
    const timestamps = await page.evaluate(async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        const startTime = Date.now();
        const maxDuration = 43000; // CHANGED to 43 seconds
        let smacks = [];
        
        function clickAnimated(node) {
            if (!node) return;
            const rect = node.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            const customCursor = document.getElementById('custom-cursor');
            if (customCursor) {
                customCursor.style.display = 'block';
                customCursor.style.transition = 'left 0.05s ease-out, top 0.05s ease-out';
                customCursor.style.left = x + 'px';
                customCursor.style.top = y + 'px';
            }
            
            node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
            setTimeout(() => {
                node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
                node.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
            }, 50);
            
            smacks.push(Date.now() - startTime);
        }

        while ((Date.now() - startTime) < maxDuration) {
            const donkeys = document.querySelectorAll('.donkey');
            if (donkeys.length > 0) {
                const randomDonkey = donkeys[Math.floor(Math.random() * donkeys.length)];
                clickAnimated(randomDonkey);
            }
            let delay = Math.random() < 0.8 
                ? Math.floor(Math.random() * 150) + 50 
                : Math.floor(Math.random() * 600) + 200;
            await sleep(delay);
        }
        
        await sleep(500); 
        return smacks;
    });

    console.log(`Captured ${timestamps.length} smack events. Stopping recording...`);
    await recorder.stop();
    
    try { await browser.close(); } catch(e) {}
    server.kill();

    console.log("Compositing TikTok video using FFmpeg...");
    
    await new Promise((resolve, reject) => {
        let f = ffmpeg().input(RAW_VIDEO);
        
        f = f.input(AUDIO_BARNYARD).inputOptions(['-stream_loop', '-1']);
        
        let nextInputIndex = 2;
        let ttsIndex = -1;
        
        // Loop the TTS!
        f = f.input(TTS_PATH).inputOptions(['-stream_loop', '-1']);
        ttsIndex = nextInputIndex;
        nextInputIndex++;

        let filterParts = [];
        let amixInputs = [];
        
        const numAmixInputs = 1 + (ttsIndex !== -1 ? 1 : 0) + (timestamps.length * 2);
        
        filterParts.push(`[1:a]volume=${0.3 * numAmixInputs}[bgm]`);
        amixInputs.push('[bgm]');
        
        if (ttsIndex !== -1) {
            // Keep the initial delay? If we loop, adelay on the looped input might delay every loop, or just the start?
            // Actually, `adelay` delays the start of the stream. It's fine to delay the start by 500ms.
            // Wait, if I loop it, the TTS file is probably very short. We might want a small pause between repeats.
            // A simple way to add a pause is using apad before looping, but -stream_loop loops the file before filters.
            // So if there's no silence at the end of the TTS, it'll repeat instantly.
            // Let's just use it as is; robot-like repeating can be funny.
            filterParts.push(`[${ttsIndex}:a]adelay=500|500,volume=${2.0 * numAmixInputs}[tts]`);
            amixInputs.push('[tts]');
        }
        
        for (let i = 0; i < timestamps.length; i++) {
            const delayMs = timestamps[i];
            
            const isLeft = i % 2 === 0;
            const panFilter = isLeft 
                ? `pan=stereo|c0=c0|c1=0.1*c0`
                : `pan=stereo|c0=0.1*c0|c1=c0`;
            
            f = f.input(AUDIO_SMACK);
            const smackIdx = nextInputIndex++;
            filterParts.push(`[${smackIdx}:a]adelay=${delayMs}|${delayMs},${panFilter},volume=${0.15 * numAmixInputs}[s${i}]`);
            amixInputs.push(`[s${i}]`);
            
            f = f.input(AUDIO_DONKEY);
            const donkIdx = nextInputIndex++;
            filterParts.push(`[${donkIdx}:a]adelay=${delayMs}|${delayMs},${panFilter},volume=${0.1 * numAmixInputs}[d${i}]`);
            amixInputs.push(`[d${i}]`);
        }
        
        filterParts.push(`${amixInputs.join('')}amix=inputs=${amixInputs.length}:duration=first:dropout_transition=0[audio_out]`);
        
        f.complexFilter(filterParts)
        .outputOptions([
            '-y',
            '-map 0:v',
            '-map [audio_out]',
            '-t 43', // Trim video to exactly 43 seconds
            '-c:v libx264',
            '-pix_fmt yuv420p',
            '-preset fast',
            '-crf 23',
            '-c:a aac',
            '-b:a 192k'
        ])
        .save(FINAL_VIDEO)
        .on('end', () => {
            console.log(`Successfully generated TikTok video at: ${FINAL_VIDEO}`);
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
