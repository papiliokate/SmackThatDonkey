import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function removeBackground(inputPath, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Read local image to base64
    const base64 = fs.readFileSync(inputPath).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    const resultDataUrl = await page.evaluate(async (dataUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                // Simple Flood Fill from 0,0
                const stack = [[0, 0]];
                const visited = new Set();
                
                const getInd = (x, y) => (y * canvas.width + x) * 4;
                const tolerance = 5; // allow small compression artifacts
                
                // background color at 0,0
                const bgR = data[0];
                const bgG = data[1];
                const bgB = data[2];

                const isBg = (x, y) => {
                    const i = getInd(x, y);
                    if (data[i+3] === 0) return false; // already transparent
                    return Math.abs(data[i] - bgR) < tolerance &&
                           Math.abs(data[i+1] - bgG) < tolerance &&
                           Math.abs(data[i+2] - bgB) < tolerance;
                };

                while (stack.length > 0) {
                    const [x, y] = stack.pop();
                    const key = `${x},${y}`;
                    if (visited.has(key)) continue;
                    visited.add(key);

                    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

                    const i = getInd(x, y);
                    if (isBg(x, y)) {
                        data[i+3] = 0; // make transparent
                        
                        stack.push([x+1, y]);
                        stack.push([x-1, y]);
                        stack.push([x, y+1]);
                        stack.push([x, y-1]);
                    }
                }
                
                ctx.putImageData(imgData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = dataUrl;
        });
    }, dataUrl);

    await browser.close();

    const base64Data = resultDataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(outputPath, base64Data, 'base64');
    console.log(`Processed ${outputPath}`);
}

(async () => {
    // donkey rump
    const donkeyIn = path.join(__dirname, '..', '..', '..', '.gemini', 'antigravity', 'brain', '3e263bdc-1d8f-4215-b908-e194090b5f41', 'donkey_rump_1776718873568.png');
    const donkeyOut = path.join(__dirname, '..', 'public', 'donkey_new.png');
    
    // hay bale
    const baleIn = path.join(__dirname, '..', '..', '..', '.gemini', 'antigravity', 'brain', '3e263bdc-1d8f-4215-b908-e194090b5f41', 'round_hay_bale_solid_white_1776715016341.png');
    const baleOut = path.join(__dirname, '..', 'public', 'hay_bale.png');
    
    await removeBackground(donkeyIn, donkeyOut);
    await removeBackground(baleIn, baleOut);
})();
