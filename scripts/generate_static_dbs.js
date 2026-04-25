import fs from 'fs';
import path from 'path';

// --- SHE SELLS SEA SHELLS GENERATION ---
function generateSheSellsPuzzles() {
    const prefixes = [
        "we need a", "go to the", "open the", "settle the", "hear the loud", 
        "mopping the", "right from the", "down on the", "up on the", "look at the", 
        "show me some", "give me some", "buy from the", "run to the", "sleep on the", 
        "knock on the", "point to the", "walk to the", "swim to the", "jump on the", 
        "fall on the", "hide in the", "play on the", "stand by the", "sit on the", 
        "waiting for", "looking for", "asking for", "paying for", "hoping for"
    ];
    
    const rhymes = [
        "door", "floor", "store", "score", "core", "chore", 
        "roar", "boar", "snore", "sore", "pore", "lore", "more"
    ];
    
    let combinations = [];
    for (let p of prefixes) {
        for (let r of rhymes) {
            combinations.push(`${p} ${r}`);
        }
    }
    
    // Shuffle deterministically or pseudo-randomly
    combinations.sort(() => Math.random() - 0.5);
    
    const outPath = path.resolve('../SheSellsSeaShells/public/puzzles_db.json');
    if (!fs.existsSync(path.dirname(outPath))) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
    }
    fs.writeFileSync(outPath, JSON.stringify(combinations.slice(0, 400), null, 2));
    console.log(`Generated She Sells Sea Shells db at ${outPath}`);
}

// --- SMACK THAT DONKEY GENERATION ---
function generateSmackThatPuzzles() {
    const q4 = [
        { q: "What body part do you use to smell?", a: "NOSE" },
        { q: "What shines in the day?", a: "SUNS" }, // wait suns is 4
        { q: "What shines in the day?", a: "STAR" },
        { q: "What do you read?", a: "BOOK" },
        { q: "What falls in winter?", a: "SNOW" },
        { q: "What barks?", a: "DOGS" },
        { q: "Meow animal?", a: "CATS" },
        { q: "Opposite of cold?", a: "WARM" },
        { q: "Opposite of bad?", a: "GOOD" },
        { q: "It swims in water?", a: "FISH" },
        { q: "It flies in the sky?", a: "BIRD" },
        { q: "You sleep in it?", a: "BEDS" },
        { q: "Four wheeled vehicle?", a: "CARS" },
        { q: "It has leaves and bark?", a: "TREE" },
        { q: "You wear it on your head?", a: "HATS" },
        { q: "You wear them on feet?", a: "SHOE" },
        { q: "It tells time?", a: "TIME" }, // clock is 5, wait
        { q: "It tells time?", a: "DIAL" },
        { q: "A primary color?", a: "BLUE" },
        { q: "A loud ringing thing?", a: "BELL" },
        { q: "You open it to enter?", a: "DOOR" },
        { q: "You walk on it?", a: "PATH" }
    ];

    const q6 = [
        { q: "Yellow fruit for monkeys?", a: "BANANA" },
        { q: "Orange vegetable?", a: "CARROT" },
        { q: "Used to paint?", a: "BRUSH" }, // brush is 5, wait
        { q: "Used to paint?", a: "COLORS" },
        { q: "It grows on your head?", a: "HAIR" }, // 4, wait
        { q: "It grows on heads?", a: "STRAND" },
        { q: "Keeps you dry in rain?", a: "PONCHO" },
        { q: "Used to erase pencil?", a: "ERASER" },
        { q: "You sit on it?", a: "CHAIRS" },
        { q: "Round object in space?", a: "PLANET" },
        { q: "Has pages and a spine?", a: "NOVELS" },
        { q: "You look through it?", a: "WINDOW" },
        { q: "You drink water from?", a: "BOTTLE" },
        { q: "You wear it in winter?", a: "JACKET" },
        { q: "Holds your pants up?", a: "BUCKLE" },
        { q: "It holds your food?", a: "PLATES" },
        { q: "A place to learn?", a: "SCHOOL" },
        { q: "A doctor's building?", a: "CLINIC" },
        { q: "You use it to type?", a: "BUTTON" },
        { q: "A sticky substance?", a: "GLUE" }, // wait 4
        { q: "A sticky substance?", a: "CEMENT" },
        { q: "You chew it?", a: "BUBBLE" }
    ];

    const q8 = [
        { q: "Animal with a trunk?", a: "ELEPHANT" },
        { q: "Used to browse the web?", a: "INTERNET" },
        { q: "You use it to call?", a: "CELLULAR" },
        { q: "A huge body of water?", a: "SEASCAPE" },
        { q: "A tall structure?", a: "BUILDING" },
        { q: "It flies to space?", a: "SPACESHIP" }, // 9, wait
        { q: "It flies to space?", a: "ROCKET" }, // 6, wait
        { q: "It flies to space?", a: "STARSHIP" },
        { q: "Used for computing?", a: "COMPUTER" },
        { q: "You watch movies on?", a: "TELEVISE" },
        { q: "Used to carry things?", a: "BACKPACK" },
        { q: "A place to buy food?", a: "GROCER" }, // 6, wait
        { q: "A place to buy food?", a: "MARKET" }, // 6, wait
        { q: "A place to buy food?", a: "BOUTIQUE" },
        { q: "Used to take photos?", a: "POLAROID" },
        { q: "A musical instrument?", a: "KEYBOARD" },
        { q: "A tool to see stars?", a: "TELESCOP" }, // 8
        { q: "Used to protect eyes?", a: "SUNGLASS" },
        { q: "Worn on your wrist?", a: "BRACELET" },
        { q: "A sweet baked good?", a: "BROWNIES" },
        { q: "Used to write notes?", a: "NOTEBOOK" },
        { q: "Keeps your head safe?", a: "HEADGEAR" },
        { q: "You sleep under it?", a: "BLANKETS" },
        { q: "Used to cut paper?", a: "SCISSORS" }
    ];

    let combinations = [];
    for (let p1 of q4) {
        for (let p2 of q6) {
            for (let p3 of q8) {
                if (combinations.length < 400) {
                    combinations.push([p1, p2, p3]);
                } else {
                    break;
                }
            }
        }
    }
    
    // Shuffle
    combinations.sort(() => Math.random() - 0.5);

    const outPath = path.resolve('./public/puzzles_db.json');
    if (!fs.existsSync(path.dirname(outPath))) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
    }
    fs.writeFileSync(outPath, JSON.stringify(combinations, null, 2));
    console.log(`Generated Smack That Donkey db at ${outPath}`);
}

generateSheSellsPuzzles();
generateSmackThatPuzzles();
