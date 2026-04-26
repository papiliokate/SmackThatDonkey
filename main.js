import confetti from 'canvas-confetti';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";

let analytics;
if (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: "G-BJLK9339LN",
    };
    const app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    logEvent(analytics, 'session_start');
  } catch (e) {
    console.warn("Analytics error:", e);
  }
}

let bingeCount = parseInt(localStorage.getItem("bingeTokens") || "0");

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone && !localStorage.getItem('pwaBountyClaimed')) {
    localStorage.setItem('pwaBountyClaimed', 'true');
    bingeCount += 1;
    localStorage.setItem('bingeTokens', bingeCount);
    setTimeout(() => {
        const toast = document.getElementById('loss-toast');
        if (toast) {
            toast.textContent = "Bounty Claimed: +1 Binge Token!";
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }, 1000);
}// Meta-Cipher System (IDL Timezone)
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
function getSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}
function getDailyCypher(gameIndex) {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Kiritimati', year: 'numeric', month: '2-digit', day: '2-digit' });
    const dateStr = formatter.format(new Date());
    let seed = getSeed(dateStr);
    let rand = mulberry32(seed);
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let cyphers = [];
    for(let k=0; k<3; k++) {
        let str = "";
        for(let j=0; j<4; j++) { str += chars.charAt(Math.floor(rand() * chars.length)); }
        cyphers.push(str);
    }
    let assignment = [0,1,2];
    for (var i = assignment.length - 1; i > 0; i--) {
        var j = Math.floor(rand() * (i + 1));
        var temp = assignment[i];
        assignment[i] = assignment[j];
        assignment[j] = temp;
    }
    let result = ["","",""];
    result[assignment[0]] = cyphers[0];
    result[assignment[1]] = cyphers[1];
    result[assignment[2]] = cyphers[2];
    return result[gameIndex];
}

// Audio Framework (Ready for MP3 drops)
const audio = {
    donkey: new Audio('/audio/donkey.ogg'),
    whoop: new Audio('/audio/whoop.wav'),
    applause: new Audio('/audio/applause.mp3'),
    barnyard: new Audio('/audio/barnyard.wav'),
    smack: new Audio('/audio/smack.wav')
};
audio.whoop.loop = true;
audio.barnyard.loop = true;

const playAudio = (audioNode) => {
    if (!audioNode) return;
    audioNode.currentTime = 0;
    const playPromise = audioNode.play();
    if (playPromise !== undefined) {
        playPromise.catch(e => console.warn('Audio playback prevented or missing file:', e));
    }
};

const stopAudio = (audioNode) => {
    if (!audioNode) return;
    audioNode.pause();
    audioNode.currentTime = 0;
};

// Hard Canvas Rescale Engine
function rescaleGame() {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    // Base logical resolution
    const TARGET_WIDTH = 450;
    const TARGET_HEIGHT = 850;
    
    const windowX = window.innerWidth;
    const windowY = window.innerHeight;
    
    // Calculate uniform max scalar
    let scale = Math.min(windowX / TARGET_WIDTH, windowY / TARGET_HEIGHT);
    if (scale > 1.2) scale = 1.2; // Max cap to prevent blurry explosion
    
    container.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', rescaleGame);
window.addEventListener('load', rescaleGame);
rescaleGame();

// State
let state = {
    phase: 1, // 1: Discovery, 2: Smack Down
    currentPuzzleIndex: 0,
    dailyPuzzles: [],
    question: "",
    answer: "",
    letters: [],
    selectedLetters: [],
    startTime: 0,
    timerInterval: null,
    lossToastTimeout: null
};

// Elements
const dom = {
    board: document.getElementById('game-board'),
    hayBales: document.getElementById('hay-bales'),
    trivia: document.getElementById('trivia-question'),
    smackBtn: document.getElementById('smack-down-btn'),
    timerContainer: document.getElementById('timer-container'),
    lossToast: document.getElementById('loss-toast'),
    winModal: document.getElementById('win-modal'),
    winTime: document.getElementById('win-time'),
    btnNextPuzzle: document.getElementById('btn-next-puzzle'),
    btnRestart: document.getElementById('btn-restart'),
    btnShare: document.getElementById('btn-share'),
    btnInstall: document.getElementById('btn-install'),
    btnBinge: document.getElementById('btn-binge'),
    btnHub: document.getElementById('btn-hub'),
    btnTopReset: document.getElementById('btn-top-reset'),
    btnTutorial: document.getElementById('btn-tutorial'),
    btnCloseTutorial: document.getElementById('btn-close-tutorial'),
    tutorialModal: document.getElementById('tutorial-modal'),
    btnBingePlay: document.getElementById('btn-binge-play'),
    bingeCountText: document.getElementById('binge-count')
};

function updateBingeUI() {
    if (bingeCount > 0) {
        dom.btnBingePlay.classList.remove('hidden');
        dom.bingeCountText.textContent = bingeCount;
    } else {
        dom.btnBingePlay.classList.add('hidden');
    }
}
updateBingeUI();

// Auto-play logic handling
const urlParams = new URLSearchParams(window.location.search);
const autoplay = urlParams.get('autoplay');

let puzzlePool = [];
let dailyIndex = 0;

async function fetchPuzzleData() {
    try {
        const response = await fetch('/daily_puzzle.json');
        if (!response.ok) throw new Error("HTTP error " + response.status);
        const data = await response.json();
        const isCarousel = new URLSearchParams(window.location.search).get('carousel') === 'true';
        if (isCarousel) {
            const bonusPool6 = [
                 { q: "A highly intelligent person?", a: "GENIUS" },
                 { q: "Someone in charge or highly skilled?", a: "MASTER" }
            ];
            state.dailyPuzzles = [bonusPool6[Math.floor(Math.random() * bonusPool6.length)]];
        } else {
            state.dailyPuzzles = data.puzzles;
        }
        puzzlePool = data.pool || [];
        dailyIndex = data.dailyIndex || 0;
    } catch (e) {
        console.warn("Failed to load daily_puzzle.json, falling back:", e);
        state.dailyPuzzles = [
             {q: "What is the bright green color of an emerald?", a: "GREEN"},
             {q: "What curved yellow fruit is famously loved by monkeys?", a: "BANANA"},
             {q: "What massive grey animal has large ears and a long trunk?", a: "ELEPHANT"}
        ];
    }
}

async function initGame() {
    await fetchPuzzleData();
    state.isBingeMode = false;
    renderPuzzleBoard();
}

function renderPuzzleBoard() {
    if (state.currentPuzzleIndex >= state.dailyPuzzles.length) {
        state.currentPuzzleIndex = 0;
    }
    
    const currentData = state.dailyPuzzles[state.currentPuzzleIndex];
    const prefix = state.isBingeMode ? "Binge Puzzle" : "Daily Puzzle";
    state.question = `${prefix} ${state.currentPuzzleIndex + 1}: ${currentData.q}`;
    state.answer = currentData.a;

    // Basic setup for exact letters
    state.letters = state.answer.split('');
    const shuffledLetters = [...state.letters].sort(() => Math.random() - 0.5);
    
    dom.trivia.textContent = state.question;
    dom.board.innerHTML = '';
    dom.hayBales.innerHTML = '';
    
    // Dynamically adjust internal DOM footprint sizes to prevent wrap overflow on massive puzzles
    const doc = document.documentElement;
    if (state.letters.length === 6) {
        doc.style.setProperty('--donkey-width', '110px');
        doc.style.setProperty('--donkey-height', '132px');
        doc.style.setProperty('--bale-size', '55px');
    } else if (state.letters.length >= 8) {
        doc.style.setProperty('--donkey-width', '90px');
        doc.style.setProperty('--donkey-height', '108px');
        doc.style.setProperty('--bale-size', '45px');
    } else {
        doc.style.setProperty('--donkey-width', '140px');
        doc.style.setProperty('--donkey-height', '168px');
        doc.style.setProperty('--bale-size', '70px');
    }
    
    // Create Donkeys
    shuffledLetters.forEach((letter, index) => {
        const donkey = document.createElement('div');
        donkey.className = 'donkey';
        donkey.dataset.letter = letter;
        donkey.dataset.index = index;
        
        const letterSpan = document.createElement('span');
        letterSpan.className = 'letter';
        letterSpan.textContent = letter;
        
        donkey.appendChild(letterSpan);
        
        donkey.addEventListener('click', (e) => handleDonkeyClick(e, donkey, letter));
        dom.board.appendChild(donkey);
    });

    // Create empty hay bales
    state.letters.forEach(() => {
        const bale = document.createElement('div');
        bale.className = 'hay-bale';
        dom.hayBales.appendChild(bale);
    });

    // Reset phase 1
    setToPhase1();
}

function handleDonkeyClick(e, element, letter) {
    if (element.classList.contains('selected')) return;

    playAudio(audio.smack);
    playAudio(audio.donkey);

    // Visual Smack Reaction
    element.classList.remove('smacked');
    void element.offsetWidth; // trigger reflow
    element.classList.add('smacked');
    
    // Particles
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
        particleCount: 20,
        spread: 60,
        origin: { x, y },
        colors: ['#fff', '#ffd166', '#c34b4b'],
        disableForReducedMotion: true,
        zIndex: 100
    });

    if (state.phase === 1) {
        // Discovery: Pop letter then hide
        element.classList.add('revealed');
        setTimeout(() => {
            if(state.phase === 1) element.classList.remove('revealed');
        }, 1200);
    } else if (state.phase === 2) {
        // Smack Down: Select letter
        element.classList.add('selected');
        state.selectedLetters.push(letter);
        updateHayBales();
        checkProgress(element);
    }
}

function updateHayBales() {
    const bales = dom.hayBales.querySelectorAll('.hay-bale');
    bales.forEach((bale, i) => {
        if (state.selectedLetters[i]) {
            bale.textContent = state.selectedLetters[i];
        } else {
            bale.textContent = '';
        }
    });
}

function checkProgress(element) {
    const currentIndex = state.selectedLetters.length - 1;
    
    // Check if the current letter matches the intended answer's letter at the same position
    if (state.selectedLetters[currentIndex] !== state.letters[currentIndex]) {
        // Wrong letter picked - play error animation and pop the letter, but NO loss state.
        state.selectedLetters.pop();
        
        // Remove 'selected' from the exact element we just clicked, bypassing DOM ordering issues
        if (element) {
            element.classList.remove('selected');
        }
        
        // Show visual error
        dom.lossToast.textContent = "Oops! Not that one!";
        dom.lossToast.classList.add('show');
        clearTimeout(state.lossToastTimeout);
        state.lossToastTimeout = setTimeout(() => dom.lossToast.classList.remove('show'), 1000);
        
        updateHayBales();
        return;
    }
    
    // Win condition - all spelling correct
    if (state.selectedLetters.length === state.answer.length) {
        winGame();
    }
}

function setToPhase1() {
    state.phase = 1;
    state.selectedLetters = [];
    clearInterval(state.timerInterval);
    
    stopAudio(audio.whoop);
    stopAudio(audio.applause);
    playAudio(audio.barnyard);
    
    dom.smackBtn.style.visibility = 'visible';
    dom.timerContainer.classList.remove('active');
    dom.timerContainer.textContent = '00:00.00';
    
    // Reset Donkeys
    dom.board.querySelectorAll('.donkey').forEach(d => {
        d.classList.remove('selected', 'revealed');
    });
    
    updateHayBales();
}

function setToPhase2() {
    state.phase = 2;
    state.selectedLetters = [];
    updateHayBales();
    
    stopAudio(audio.barnyard);
    playAudio(audio.whoop);
    
    dom.smackBtn.style.visibility = 'hidden';
    dom.timerContainer.classList.add('active');
    
    dom.board.querySelectorAll('.donkey').forEach(d => {
        d.classList.remove('revealed', 'selected');
    });

    startTimer();
}

function showLoss() {
    clearInterval(state.timerInterval);
    dom.lossToast.classList.add('show');
    
    setTimeout(() => {
        dom.lossToast.classList.remove('show');
        setToPhase1();
    }, 2500);
}

function winGame() {
    clearInterval(state.timerInterval);
    stopAudio(audio.whoop);
    playAudio(audio.applause);
    const finalTime = dom.timerContainer.textContent;
    
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.3 }
    });
    
    dom.winTime.textContent = `Time: ${finalTime}`;
    document.getElementById('win-cypher').textContent = getDailyCypher(2); // SmackThatDonkey is game 2
    
    // Evaluate Progress Context
    const isFinalPuzzle = state.currentPuzzleIndex >= (state.dailyPuzzles.length - 1);
    
    if (analytics) logEvent(analytics, 'level_complete', { level: state.currentPuzzleIndex + 1 });

    const isCarousel = new URLSearchParams(window.location.search).get('carousel') === 'true';
    const regBtns = document.getElementById('regular-win-btns');
    const carBtns = document.getElementById('carousel-btns');
    
    if (isCarousel) {
        if (regBtns) regBtns.style.display = 'none';
        if (carBtns) carBtns.style.display = 'flex';
        
        let playedGames = urlParams.get('played') ? urlParams.get('played').split(',').filter(Boolean) : [];
        if (!playedGames.includes('ST')) playedGames.push('ST');
        
        const playNextBtn = document.getElementById('carousel-play-next');
        const shareBtn = document.getElementById('carousel-share');
        
        if (playedGames.length >= 4) {
            if (playNextBtn) playNextBtn.style.display = 'none';
            if (shareBtn) shareBtn.style.display = 'flex';
        }
    } else {
        if (carBtns) carBtns.style.display = 'none';
        if (regBtns) regBtns.style.display = 'flex';
        
        if (isFinalPuzzle && bingeCount === 0) {
            dom.btnNextPuzzle.style.display = 'none';
            dom.btnInstall.style.display = 'flex';
            dom.btnBinge.style.display = 'flex';
            dom.btnRestart.style.display = 'flex';
            dom.btnShare.style.display = 'flex';
            dom.btnHub.style.display = 'flex';
        } else {
            dom.btnNextPuzzle.style.display = 'flex';
            dom.btnShare.style.display = 'flex';
            dom.btnHub.style.display = 'flex';
            dom.btnInstall.style.display = 'none';
            dom.btnBinge.style.display = 'none';
            dom.btnRestart.style.display = 'none';
        }
    }
    
    setTimeout(() => {
        dom.winModal.classList.add('active');
        if(autoplay) {
            window._VIDEO_RECORDING_DONE = true;
        }
    }, 1000);
}

function startTimer() {
    state.startTime = Date.now();
    state.timerInterval = setInterval(() => {
        const deltaMs = Date.now() - state.startTime;
        const m = Math.floor(deltaMs / 60000).toString().padStart(2, '0');
        const s = Math.floor((deltaMs % 60000) / 1000).toString().padStart(2, '0');
        const ms = Math.floor((deltaMs % 1000) / 10).toString().padStart(2, '0');
        dom.timerContainer.textContent = `${m}:${s}.${ms}`;
    }, 10);
}

// Event Listeners
dom.smackBtn.addEventListener('click', setToPhase2);
dom.btnTopReset.addEventListener('click', setToPhase1);
dom.btnTutorial.addEventListener('click', () => dom.tutorialModal.classList.add('active'));
dom.btnCloseTutorial.addEventListener('click', () => dom.tutorialModal.classList.remove('active'));

function loadBingePuzzle() {
     if (bingeCount > 0) {
        bingeCount--;
        localStorage.setItem("bingeTokens", bingeCount);
        updateBingeUI();
     }
     
     if (puzzlePool && puzzlePool.length > 0) {
         let playedBingeIndexes = [];
         try {
             playedBingeIndexes = JSON.parse(localStorage.getItem('playedBingeIndexes') || '[]');
         } catch(e){}
         
         let available = [];
         for(let i=0; i<puzzlePool.length; i++) {
             if (i !== dailyIndex && !playedBingeIndexes.includes(i)) {
                 available.push(i);
             }
         }
         
         if (available.length === 0) {
             playedBingeIndexes = [];
             localStorage.setItem('playedBingeIndexes', '[]');
             for(let i=0; i<puzzlePool.length; i++) {
                 if (i !== dailyIndex) available.push(i);
             }
         }
         
         const chosenIndex = available[Math.floor(Math.random() * available.length)];
         playedBingeIndexes.push(chosenIndex);
         localStorage.setItem('playedBingeIndexes', JSON.stringify(playedBingeIndexes));
         
         state.dailyPuzzles = puzzlePool[chosenIndex]; 
     } else {
         const bonusPool = [
             { q: "A highly intelligent person?", a: "GENIUS" },
             { q: "Someone in charge or highly skilled?", a: "MASTER" },
             { q: "Excellent or outstanding?", a: "SUPER" },
             { q: "A round glowing object in the night sky?", a: "MOON" },
             { q: "To propel oneself upward?", a: "JUMP" },
             { q: "The color of an apple or fire engine?", a: "RED" },
             { q: "A four-legged farm animal offering milk?", a: "COW" }
         ];
         state.dailyPuzzles = [bonusPool[Math.floor(Math.random() * bonusPool.length)]];
     }
     
     state.currentPuzzleIndex = 0;
     state.isBingeMode = true;
     dom.winModal.classList.remove('active');
     renderPuzzleBoard();
}

dom.btnNextPuzzle.addEventListener('click', () => {
    if (state.currentPuzzleIndex >= (state.dailyPuzzles.length - 1)) {
        if (bingeCount > 0) {
            loadBingePuzzle();
            return;
        }
    } else {
        state.currentPuzzleIndex++;
    }
    dom.winModal.classList.remove('active');
    renderPuzzleBoard();
});

dom.btnRestart.addEventListener('click', () => {
    dom.winModal.classList.remove('active');
    setToPhase1();
});

dom.btnBingePlay.addEventListener('click', () => {
    if (bingeCount > 0) {
        loadBingePuzzle();
    }
});

dom.btnBinge.addEventListener('click', () => {
    if (analytics) logEvent(analytics, 'binge_presale_click');
    window.location.href = 'https://oops-games-hub.web.app/presale.html';
});

dom.btnHub.addEventListener('click', () => {
    if (analytics) logEvent(analytics, 'hub_clicked');
});

// Carousel Logic
document.getElementById("carousel-play-next")?.addEventListener("click", () => {
    let playedGames = new URLSearchParams(window.location.search).get('played') ? new URLSearchParams(window.location.search).get('played').split(',').filter(Boolean) : [];
    if (!playedGames.includes('ST')) playedGames.push('ST');
    const GAMES_LIST = [
        { id: 'GR', url: 'https://go-rabbit-4af82.web.app' },
        { id: 'SS', url: 'https://she-sells-sea-shells.web.app' },
        { id: 'ST', url: 'https://smack-that-donkey.web.app' },
        { id: 'OG', url: 'https://o-gox.web.app' }
    ];
    const unplayed = GAMES_LIST.filter(g => !playedGames.includes(g.id));
    if (unplayed.length > 0) {
        const nextGame = unplayed[Math.floor(Math.random() * unplayed.length)];
        window.location.href = `${nextGame.url}?carousel=true&played=${playedGames.join(',')}`;
    }
});

document.getElementById("carousel-binge")?.addEventListener("click", () => {
    if (analytics) logEvent(analytics, 'binge_presale_click');
    window.location.href = 'https://oops-games-hub.web.app/presale.html';
});

document.getElementById("carousel-share")?.addEventListener("click", () => {
    const text = "I rode the carousel at oops-games.";
    const GAMES_LIST = [
        { id: 'GR', url: 'https://go-rabbit-4af82.web.app' },
        { id: 'SS', url: 'https://she-sells-sea-shells.web.app' },
        { id: 'ST', url: 'https://smack-that-donkey.web.app' },
        { id: 'OG', url: 'https://o-gox.web.app' }
    ];
    if (navigator.share) {
        navigator.share({ title: 'Oops-Games Carousel', text }).then(() => {
            const nextGame = GAMES_LIST[Math.floor(Math.random() * GAMES_LIST.length)];
            window.location.href = `${nextGame.url}?carousel=true&played=`;
        }).catch(e => console.warn(e));
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert("Copied to clipboard!");
            const nextGame = GAMES_LIST[Math.floor(Math.random() * GAMES_LIST.length)];
            window.location.href = `${nextGame.url}?carousel=true&played=`;
        });
    }
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

dom.btnInstall.addEventListener('click', () => {
    if (analytics) logEvent(analytics, 'install_prompt_clicked');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        document.getElementById('ios-install-modal').classList.add('active');
    } else {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
            });
        } else {
            alert("App is already installed or not supported on this browser.");
        }
    }
});

document.getElementById('btn-close-ios-modal').addEventListener('click', () => {
    document.getElementById('ios-install-modal').classList.remove('active');
});

dom.btnShare.addEventListener('click', () => {
    const text = `🫏 Smack That... \nPuzzle #${state.currentPuzzleIndex + 1} in ${dom.timerContainer.textContent}!\n\nPlay free at https://smack-that-donkey.web.app`;
    
    if (navigator.share) {
        navigator.share({ title: 'Smack That...', text: text }).then(() => {
            alert("Thanks for sharing! Enjoy 1 Free Binge Puzzle.");
            bingeCount++;
            localStorage.setItem("bingeTokens", bingeCount);
            updateBingeUI();
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard! Enjoy 1 Free Binge Puzzle.');
            bingeCount++;
            localStorage.setItem("bingeTokens", bingeCount);
            updateBingeUI();
        });
    }
    if (analytics) logEvent(analytics, 'brag_clicked');
});

// Autoplay Simulation for video generator
function simulateAutoplay() {
    if (!autoplay) return;
    
    function clickAnimated(node) {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        if (customCursor) {
            customCursor.style.display = 'block';
            customCursor.style.transition = 'left 0.25s ease-out, top 0.25s ease-out';
            customCursor.style.left = x + 'px';
            customCursor.style.top = y + 'px';
        }
        setTimeout(() => {
            node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
            setTimeout(() => {
                node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
                node.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
            }, 50);
        }, 250);
    }

    setTimeout(() => {
        // Phase 1 clicks
        const donkeys = document.querySelectorAll('.donkey');
        let clickTime = 1000;
        donkeys.forEach(node => {
            setTimeout(() => {
                clickAnimated(node);
            }, clickTime);
            clickTime += 1200;
        });

        // Click Smack Down
        setTimeout(() => {
            clickAnimated(dom.smackBtn);
        }, clickTime + 1000);

        // Click correctly in order
        setTimeout(() => {
            let answerTime = clickTime + 2000;
            
            if (autoplay === 'fail') {
                // Click a totally wrong letter to fail the sequence!
                setTimeout(() => {
                    const wrongTarget = Array.from(document.querySelectorAll('.donkey:not(.selected)')).find(d => d.dataset.letter !== state.letters[0]);
                    clickAnimated(wrongTarget);
                }, answerTime);
                
                setTimeout(() => {
                    window._VIDEO_RECORDING_DONE = true;
                }, answerTime + 3000);
                
            } else if (autoplay === 'interactive') {
                // Click all but the last one
                for (let i = 0; i < state.letters.length - 1; i++) {
                    const letter = state.letters[i];
                    setTimeout(() => {
                        const target = Array.from(document.querySelectorAll('.donkey:not(.selected)')).find(d => d.dataset.letter === letter);
                        clickAnimated(target);
                    }, answerTime);
                    answerTime += 800;
                }
                
                setTimeout(() => {
                    window._VIDEO_RECORDING_DONE = true;
                }, answerTime + 3000);
            } else {
                // Standard: Click ALL correctly
                state.letters.forEach(letter => {
                    setTimeout(() => {
                        const target = Array.from(document.querySelectorAll('.donkey:not(.selected)')).find(d => d.dataset.letter === letter);
                        clickAnimated(target);
                    }, answerTime);
                    answerTime += 800; 
                });
            }
        }, clickTime + 1000);

    }, 2000);
}

initGame();
if (autoplay) {
    simulateAutoplay();
}

// Custom Cursor Logic
const customCursor = document.getElementById('custom-cursor');
if (customCursor) {
    document.addEventListener('mousemove', (e) => {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
    });
    document.addEventListener('mousedown', () => {
        document.body.classList.add('slapping');
    });
    document.addEventListener('mouseup', () => {
        document.body.classList.remove('slapping');
    });
    document.addEventListener('mouseleave', () => {
        customCursor.style.display = 'none';
    });
    document.addEventListener('mouseenter', () => {
        customCursor.style.display = 'block';
    });
}

