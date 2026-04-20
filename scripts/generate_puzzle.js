import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("GEMINI_API_KEY environment variable is missing!");
    process.exit(1);
}

const prompt = `Generate exactly 3 easy, single-word general knowledge trivia questions suitable for a young teen.
The answers MUST be exactly 4 letters for the first, 6 letters for the second, and 8 letters for the third.
Output ONLY valid JSON in the exact format shown below, with no markdown wrappers or backticks:
{
  "puzzles": [
    { "q": "What body part do you use to smell?", "a": "NOSE" },
    { "q": "What yellow fruit do monkeys love?", "a": "BANANA" },
    { "q": "What animal has a large trunk?", "a": "ELEPHANT" }
  ]
}`;

async function generatePuzzle() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
           throw new Error("HTTP Error: " + response.status);
        }
        
        const data = await response.json();
        let content = data.candidates[0].content.parts[0].text;
        
        // Strip markdown blocks if accidentally returned
        content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const puzzle = JSON.parse(content);
        
        const payload = {
            date: new Date().toISOString().split('T')[0],
            puzzles: puzzle.puzzles
        };
        
        const outDir = path.resolve('./public');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }
        
        const outPath = path.join(outDir, 'daily_puzzle.json');
        fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
        
        console.log(`Successfully generated 3 daily puzzles!`);
    } catch (e) {
        console.error("Failed to generate puzzle:", e);
        process.exit(1);
    }
}

generatePuzzle();
