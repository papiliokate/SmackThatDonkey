import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { EdgeTTS } from 'node-edge-tts';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const RAW_VIDEO = path.resolve('raw_custom_2.mp4');
const FINAL_VIDEO = 'C:\\Users\\papil\\Downloads\\smack_that_sore_oops.mp4';

const AUDIO_F1 = path.resolve('public/f1.mp3');
const AUDIO_F2 = path.resolve('public/f2.mp3');
const AUDIO_M1 = path.resolve('public/m1.mp3');
const AUDIO_M2 = path.resolve('public/m2.mp3');
const AUDIO_F3 = path.resolve('public/f3.mp3');
const AUDIO_OW = path.resolve('public/ow.mp3');

const SMACK_AUDIO = path.resolve('public/audio/smack.wav');
const BRAY_AUDIO = path.resolve('public/audio/donkey.ogg');

async function generateTTS() {
    console.log("Generating TTS audio...");
    const ttsMale = new EdgeTTS({ voice: 'en-US-ChristopherNeural', lang: 'en-US', outputFormat: 'audio-24khz-48kbitrate-mono-mp3' });
    const ttsFemale = new EdgeTTS({ voice: 'en-US-AriaNeural', lang: 'en-US', outputFormat: 'audio-24khz-48kbitrate-mono-mp3' });
    
    await ttsFemale.ttsPromise("John, why did you stop smacking my", AUDIO_F1);
    await ttsFemale.ttsPromise("Donkey. You know I love it.", AUDIO_F2);
    
    await ttsMale.ttsPromise("Sorry Deloris. You know I love smacking your", AUDIO_M1);
    await ttsMale.ttsPromise("Donkey. But my hand is sore.", AUDIO_M2);
    
    await ttsFemale.ttsPromise("Don't be lame John. Smack that Donkey. Smack it hard.", AUDIO_F3);
    
    await ttsMale.ttsPromise("ow. ow ow. ow. ow. ow. ow. ow. ow. ow. ow. ow. ow.", AUDIO_OW);
    console.log("TTS audio generated.");
}

async function main() {
    await generateTTS();
    
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
        headless: 'new',
        args: [
            `--window-size=720,1280`,
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

    console.log("Navigating to game...");
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
    
    // Inject custom subtitle container and smacking logic
    await page.evaluate(() => {
        const oopsSubtitle = document.createElement('h2');
        oopsSubtitle.innerText = 'oops-games';
        oopsSubtitle.style.margin = '0';
        oopsSubtitle.style.fontFamily = "'Outfit', sans-serif";
        oopsSubtitle.style.fontSize = '1.2rem';
        oopsSubtitle.style.color = '#FFD166';
        oopsSubtitle.style.marginTop = '0px';
        oopsSubtitle.style.marginBottom = '5px';
        const header = document.querySelector('header');
        const actions = document.querySelector('.header-actions');
        header.insertBefore(oopsSubtitle, actions);

        const subtitleContainer = document.createElement('div');
        subtitleContainer.id = 'subtitle-container';
        subtitleContainer.style.position = 'absolute';
        subtitleContainer.style.bottom = '15%';
        subtitleContainer.style.left = '50%';
        subtitleContainer.style.transform = 'translateX(-50%)';
        subtitleContainer.style.width = '90%';
        subtitleContainer.style.textAlign = 'center';
        subtitleContainer.style.color = '#fff';
        subtitleContainer.style.fontFamily = 'monospace';
        subtitleContainer.style.fontSize = '32px';
        subtitleContainer.style.fontWeight = 'bold';
        subtitleContainer.style.textShadow = '3px 3px 6px #000';
        subtitleContainer.style.zIndex = '9999';
        subtitleContainer.style.padding = '15px';
        subtitleContainer.style.backgroundColor = 'rgba(0,0,0,0.6)';
        subtitleContainer.style.borderRadius = '10px';
        subtitleContainer.style.display = 'none'; // hidden initially
        document.body.appendChild(subtitleContainer);

        window.smackingInterval = null;

        window.startSmacking = function() {
            if (window.smackingInterval) return;
            window.smackingInterval = setInterval(() => {
                const donkeys = document.querySelectorAll('.donkey');
                if (donkeys.length > 0) {
                    const randomDonkey = donkeys[Math.floor(Math.random() * donkeys.length)];
                    clickAnimated(randomDonkey);
                }
            }, 300);
        };

        window.stopSmacking = function() {
            if (window.smackingInterval) {
                clearInterval(window.smackingInterval);
                window.smackingInterval = null;
            }
        };

        function clickAnimated(node) {
            if (!node) return;
            const rect = node.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            const customCursor = document.getElementById('custom-cursor');
            if (customCursor) {
                customCursor.style.display = 'block';
                customCursor.style.transition = 'left 0.15s ease-out, top 0.15s ease-out';
                customCursor.style.left = x + 'px';
                customCursor.style.top = y + 'px';
            }
            
            node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
            setTimeout(() => {
                node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
                node.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
            }, 50);
        }
    });

    const showText = async (text) => {
        await page.evaluate((t) => {
            const container = document.getElementById('subtitle-container');
            if (t) {
                container.style.display = 'block';
                container.innerText = t;
            } else {
                container.style.display = 'none';
            }
        }, text);
    };

    console.log("Starting recording...");
    await recorder.start(RAW_VIDEO);
    
    const startTime = Date.now();

    // Timeline implementation
    // 0.0s: Start smacking
    await page.evaluate(() => window.startSmacking());
    
    // 3.0s: Stop smacking, start dialog
    await sleep(3000);
    await page.evaluate(() => window.stopSmacking());
    await showText("Female: John, why did you stop smacking my...");

    // 6.5s (+3.5s)
    await sleep(3500);
    await showText("Female: John, why did you stop smacking my... Donkey. You know I love it.");

    // 10.0s (+3.5s)
    await sleep(3500);
    await showText("Male: Sorry Deloris. You know I love smacking your...");

    // 14.5s (+4.5s)
    await sleep(4500);
    await showText("Male: Sorry Deloris. You know I love smacking your... Donkey. But my hand is sore.");

    // 18.5s (+4.0s)
    await sleep(4000);
    await showText("Female: Don't be lame John. Smack that Donkey. Smack it hard.");

    // 23.5s (+5.0s)
    await sleep(5000);
    await showText("");
    await page.evaluate(() => window.startSmacking());

    // Wait until 42s total
    const elapsed = Date.now() - startTime;
    const remaining = 42000 - elapsed;
    if (remaining > 0) {
        await sleep(remaining);
    }
    
    console.log("Stopping recording...");
    await recorder.stop();
    await browser.close();
    server.kill();

    console.log("Compositing video using FFmpeg...");
    
    const downloadsDir = path.dirname(FINAL_VIDEO);
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    let smackAudioPath = SMACK_AUDIO;
    if (!fs.existsSync(smackAudioPath)) smackAudioPath = path.resolve('dist/audio/smack.wav');
    
    let brayAudioPath = BRAY_AUDIO;
    if (!fs.existsSync(brayAudioPath)) brayAudioPath = path.resolve('dist/audio/donkey.ogg');
    
    await new Promise((resolve, reject) => {
        let cmd = ffmpeg().input(RAW_VIDEO)
            .input(AUDIO_F1)
            .input(AUDIO_F2)
            .input(AUDIO_M1)
            .input(AUDIO_M2)
            .input(AUDIO_F3)
            .input(AUDIO_OW); // Input 7
            
        let filterComplex = [
            // F1: 3.0s (3000ms)
            '[1:a]adelay=3000|3000[a1]',
            // F2: 6.5s (6500ms)
            '[2:a]adelay=6500|6500[a2]',
            // M1: 10.0s (10000ms)
            '[3:a]adelay=10000|10000[a3]',
            // M2: 14.5s (14500ms)
            '[4:a]adelay=14500|14500[a4]',
            // F3: 18.5s (18500ms)
            '[5:a]adelay=18500|18500[a5]',
        ];
        
        // Let's redefine inputs properly for looped streams
        cmd = ffmpeg().input(RAW_VIDEO)
            .input(AUDIO_F1)
            .input(AUDIO_F2)
            .input(AUDIO_M1)
            .input(AUDIO_M2)
            .input(AUDIO_F3)
            .input(AUDIO_OW).inputOptions(['-stream_loop', '-1']);
            
        filterComplex.push('[6:a]adelay=23500|23500,volume=0.8[a6]'); // OW

        let mixInputsStr = '[a1][a2][a3][a4][a5][a6]';
        let amixInputs = 6;
        
        // Smack Sound: 0-3s AND 23.5s-28s
        // We can just add it looped starting at 0s and 23.5s, but it's easier to add two instances of smack audio
        if (fs.existsSync(smackAudioPath)) {
            // First smack block: 0-3s
            cmd.input(smackAudioPath).inputOptions(['-stream_loop', '-1']);
            filterComplex.push(`[7:a]atrim=0:3,volume=0.5[a7]`);
            
            // Second smack block: 23.5s onwards
            cmd.input(smackAudioPath).inputOptions(['-stream_loop', '-1']);
            filterComplex.push(`[8:a]adelay=23500|23500,volume=0.5[a8]`);
            
            mixInputsStr += '[a7][a8]';
            amixInputs += 2;
            
            if (fs.existsSync(brayAudioPath)) {
                // First bray block: 0-3s
                cmd.input(brayAudioPath).inputOptions(['-stream_loop', '-1']);
                filterComplex.push(`[9:a]atrim=0:3,volume=0.5[a9]`);
                
                // Second bray block: 23.5s onwards
                cmd.input(brayAudioPath).inputOptions(['-stream_loop', '-1']);
                filterComplex.push(`[10:a]adelay=23500|23500,volume=0.5[a10]`);
                
                mixInputsStr += '[a9][a10]';
                amixInputs += 2;
            }
        }

        filterComplex.push(`${mixInputsStr}amix=inputs=${amixInputs}:duration=longest:dropout_transition=0[audio_out]`);

        cmd.complexFilter(filterComplex)
            .outputOptions([
                '-y',
                '-map 0:v',
                '-map [audio_out]',
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-preset ultrafast',
                '-crf 18',
                '-c:a aac',
                '-b:a 192k',
                '-t 42' // 42 seconds total length
            ])
            .save(FINAL_VIDEO)
            .on('end', () => {
                console.log(`Successfully generated video at: ${FINAL_VIDEO}`);
                resolve();
            })
            .on('error', (err) => {
                console.error("FFmpeg Error:", err);
                reject(err);
            });
    });
}

main().then(() => {
    console.log("Process complete.");
    process.exit(0);
}).catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
});
