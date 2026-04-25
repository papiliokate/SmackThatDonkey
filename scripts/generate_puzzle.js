import fs from 'fs';
import path from 'path';

function generatePuzzle() {
    try {
        const dbPath = path.resolve('./public/puzzles_db.json');
        
        if (!fs.existsSync(dbPath)) {
            console.error("puzzles_db.json not found! Please run the bulk_generate_puzzles script first.");
            process.exit(1);
        }
        
        const rawDB = fs.readFileSync(dbPath, 'utf-8');
        const puzzlesDB = JSON.parse(rawDB);
        
        if (!Array.isArray(puzzlesDB) || puzzlesDB.length === 0) {
            console.error("puzzles_db.json is empty or invalid.");
            process.exit(1);
        }
        
        const DAY_MS = 24 * 60 * 60 * 1000;
        const OFFSET = 1; // Advanced by 1 for production testing
        const daysSinceEpoch = Math.floor(Date.now() / DAY_MS) + OFFSET;
        const puzzleIndex = daysSinceEpoch % puzzlesDB.length;
        
        const todayPuzzleSet = puzzlesDB[puzzleIndex];
        
        // We include the full pool for binge functionality on the frontend
        const payload = {
            date: new Date().toISOString().split('T')[0],
            dailyIndex: puzzleIndex,
            puzzles: todayPuzzleSet,
            pool: puzzlesDB
        };
        
        const outDir = path.resolve('./public');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }
        
        const outPath = path.join(outDir, 'daily_puzzle.json');
        fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
        
        console.log(`Successfully generated daily puzzles from static DB! (Index: ${puzzleIndex})`);
    } catch (e) {
        console.error("Failed to generate puzzle from DB:", e);
        process.exit(1);
    }
}

generatePuzzle();
