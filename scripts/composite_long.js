import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const RAW_VIDEO = path.resolve('raw_bad_donkey_long.mp4');
const FINAL_VIDEO = path.resolve(process.env.USERPROFILE || 'C:/Users/papil', 'Downloads', 'bad_donkey_43s.mp4');
const AUDIO_BARNYARD = path.resolve('public/audio/barnyard.wav');
const TTS_PATH = path.resolve('public/tts.mp3');
const AUDIO_SMACK = path.resolve('public/audio/smack.wav');
const AUDIO_DONKEY = path.resolve('public/audio/donkey.ogg');

console.log("Compositing TikTok video using FFmpeg...");

await new Promise((resolve, reject) => {
    let f = ffmpeg().input(RAW_VIDEO);
    
    f = f.input(AUDIO_BARNYARD).inputOptions(['-stream_loop', '-1']);
    f = f.input(TTS_PATH).inputOptions(['-stream_loop', '-1']);

    // We will simulate 10 smacks in a 2-second interval and loop it to create "chaos"
    // This avoids ENAMETOOLONG while keeping the chaotic sound.
    let filterParts = [];
    let amixInputs = [];
    
    // Background and TTS
    filterParts.push(`[1:a]volume=1.0[bgm]`);
    amixInputs.push('[bgm]');
    filterParts.push(`[2:a]adelay=500|500,volume=3.0[tts]`);
    amixInputs.push('[tts]');

    // Add 10 smacks and 5 donkeys artificially, instead of 238
    let nextInputIndex = 3;
    const numAmixInputs = 2 + 15; // 2 base + 10 smacks + 5 donkeys

    for (let i = 0; i < 10; i++) {
        f = f.input(AUDIO_SMACK).inputOptions(['-stream_loop', '-1']);
        const idx = nextInputIndex++;
        const delayMs = Math.floor(Math.random() * 2000);
        filterParts.push(`[${idx}:a]adelay=${delayMs}|${delayMs},volume=0.3[s${i}]`);
        amixInputs.push(`[s${i}]`);
    }

    for (let i = 0; i < 5; i++) {
        f = f.input(AUDIO_DONKEY).inputOptions(['-stream_loop', '-1']);
        const idx = nextInputIndex++;
        const delayMs = Math.floor(Math.random() * 2000);
        filterParts.push(`[${idx}:a]adelay=${delayMs}|${delayMs},volume=0.2[d${i}]`);
        amixInputs.push(`[d${i}]`);
    }
    
    filterParts.push(`${amixInputs.join('')}amix=inputs=${amixInputs.length}:duration=first:dropout_transition=0[audio_out]`);
    
    f.complexFilter(filterParts)
    .outputOptions([
        '-y',
        '-map 0:v',
        '-map [audio_out]',
        '-t 43', // Trim video to exactly 43 seconds
        '-c:v copy', // Use copy for video since it's already encoded
        '-c:a aac',
        '-b:a 192k'
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
