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

const RAW_VIDEO = path.resolve('raw_custom.mp4');
const FINAL_VIDEO = 'C:\\Users\\papil\\Downloads\\smack_that_oops.mp4';
const AUDIO_MALE_1 = path.resolve('public/male1.mp3');
const AUDIO_MALE_2 = path.resolve('public/male2.mp3');
const AUDIO_FEMALE_1 = path.resolve('public/female1.mp3');
const AUDIO_FEMALE_2 = path.resolve('public/female2.mp3');
const SMACK_AUDIO = path.resolve('public/audio/smack.wav');
const BRAY_AUDIO = path.resolve('public/audio/donkey.ogg');

async function generateTTS() {
    console.log("Generating TTS audio...");
    // Male: ChristopherNeural, Female: AriaNeural (both sound robotic/TTS style)
    const ttsMale = new EdgeTTS({ voice: 'en-US-ChristopherNeural', lang: 'en-US', outputFormat: 'audio-24khz-48kbitrate-mono-mp3' });
    const ttsFemale = new EdgeTTS({ voice: 'en-US-AriaNeural', lang: 'en-US', outputFormat: 'audio-24khz-48kbitrate-mono-mp3' });
    
    await ttsMale.ttsPromise("Deloris, may I smack your", AUDIO_MALE_1);
    await ttsMale.ttsPromise("donkey?", AUDIO_MALE_2);
    await ttsFemale.ttsPromise("Yes John, you can smack my", AUDIO_FEMALE_1);
    await ttsFemale.ttsPromise("donkey.", AUDIO_FEMALE_2);
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
    
    // Hide UI elements that shouldn't be there (if any), and inject custom subtitle container
    await page.evaluate(() => {
        const oopsSubtitle = document.createElement('h2');
        oopsSubtitle.innerText = 'oops-games';
        oopsSubtitle.style.margin = '0';
        oopsSubtitle.style.fontFamily = "'Outfit', sans-serif";
        oopsSubtitle.style.fontSize = '1.2rem';
        oopsSubtitle.style.color = '#FFD166'; // Let's use accent color to make it pop
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
    });

    console.log("Starting recording...");
    await recorder.start(RAW_VIDEO);
    
    const startTime = Date.now();
    
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

    // Timeline implementation
    // 0.0s: Video starts (no text)
    // 0.5s: Male 1 starts
    await sleep(500);
    await showText("Male: Deloris, may I smack your...");
    
    // 2.5s: Male 2 starts
    await sleep(2000);
    await showText("Male: Deloris, may I smack your... donkey?");
    
    // 4.5s: Female 1 starts
    await sleep(2000);
    await showText("Female: Yes John, you can smack my...");
    
    // 6.5s: Female 2 starts
    await sleep(2000);
    await showText("Female: Yes John, you can smack my... donkey.");
    
    // 8.5s: Endless smack starts, hide text
    await sleep(2000);
    await showText("");

    console.log("Starting endless smack...");
    // Inject and run endless smack logic
    page.evaluate(() => {
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

        async function endlessSmack() {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            while (true) {
                const donkeys = document.querySelectorAll('.donkey');
                if (donkeys.length > 0) {
                    const randomDonkey = donkeys[Math.floor(Math.random() * donkeys.length)];
                    clickAnimated(randomDonkey);
                }
                
                // Rhythm: about 3 smacks per second = ~333ms delay
                let delay = Math.floor(Math.random() * 100) + 250;
                await sleep(delay);
            }
        }
        
        endlessSmack();
    });

    // Record until 20 seconds total
    const elapsed = Date.now() - startTime;
    const remaining = 20000 - elapsed;
    if (remaining > 0) {
        await sleep(remaining);
    }
    
    console.log("Stopping recording...");
    await recorder.stop();
    await browser.close();
    server.kill();

    console.log("Compositing video using FFmpeg...");
    
    // Ensure final directory exists
    const downloadsDir = path.dirname(FINAL_VIDEO);
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    // Find smack and bray audio
    let smackAudioPath = SMACK_AUDIO;
    if (!fs.existsSync(smackAudioPath)) {
        smackAudioPath = path.resolve('dist/audio/smack.wav');
    }
    
    let brayAudioPath = BRAY_AUDIO;
    if (!fs.existsSync(brayAudioPath)) {
        brayAudioPath = path.resolve('dist/audio/donkey.ogg');
    }
    
    await new Promise((resolve, reject) => {
        let cmd = ffmpeg().input(RAW_VIDEO)
            .input(AUDIO_MALE_1)
            .input(AUDIO_MALE_2)
            .input(AUDIO_FEMALE_1)
            .input(AUDIO_FEMALE_2);
            
        let filterComplex = [
            '[1:a]adelay=500|500[a1]',
            '[2:a]adelay=2500|2500[a2]',
            '[3:a]adelay=4500|4500[a3]',
            '[4:a]adelay=6500|6500[a4]'
        ];
        
        let amixInputs = 4;
        let mixInputsStr = '[a1][a2][a3][a4]';
        
        if (fs.existsSync(smackAudioPath)) {
            // Loop smack audio and delay it to 8500ms
            cmd.input(smackAudioPath).inputOptions(['-stream_loop', '-1']);
            filterComplex.push('[5:a]adelay=8500|8500,volume=0.5[a5]');
            mixInputsStr += '[a5]';
            amixInputs++;
        }
        
        if (fs.existsSync(brayAudioPath)) {
            // Loop bray audio and delay it to 8500ms
            cmd.input(brayAudioPath).inputOptions(['-stream_loop', '-1']);
            // If smack exists, bray is input 6, else it's input 5
            const brayIdx = fs.existsSync(smackAudioPath) ? 6 : 5;
            filterComplex.push(`[${brayIdx}:a]adelay=8500|8500,volume=0.5[a${brayIdx}]`);
            mixInputsStr += `[a${brayIdx}]`;
            amixInputs++;
        }

        if (amixInputs > 4) {
            filterComplex.push(`${mixInputsStr}amix=inputs=${amixInputs}:duration=longest:dropout_transition=0[audio_out]`);
        } else {
            console.warn("Smack/Bray audio not found. Proceeding without it.");
            filterComplex.push(`${mixInputsStr}amix=inputs=4:duration=longest:dropout_transition=0[audio_out]`);
        }

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
                '-t 20' // Hardcode total duration to 20 seconds
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
