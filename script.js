
const startButton = document.getElementById('start-button');
const retryButton = document.getElementById('retry-button');
const startScreen = document.getElementById('start-screen');
const gameSelectionScreen = document.getElementById('game-selection-screen');
const questionScreen = document.getElementById('question-screen');
const lineDrawingScreen = document.getElementById('line-drawing-screen');
const mazeScreen = document.getElementById('maze-screen');
const rewardScreen = document.getElementById('reward-screen');
const questionContainer = document.getElementById('question-container');
const optionsContainer = document.getElementById('options-container');
const countingScreen = document.getElementById('counting-screen');
const countingQuestionContainer = document.getElementById('counting-question-container');
const countingOptionsContainer = document.getElementById('counting-options-container');
const drawingScreen = document.getElementById('drawing-screen');
const watermelonScreen = document.getElementById('watermelon-screen');

// --- Canvas setup ---
const lineDrawingCanvas = document.getElementById('line-drawing-canvas');
const lineDrawingCtx = lineDrawingCanvas.getContext('2d');
let lineDrawingState = {};


let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;

// --- Event Listeners ---
startButton.addEventListener('click', () => showScreen('game-selection'));
retryButton.addEventListener('click', () => {
    showScreen('game-selection');
});

document.querySelectorAll('.game-select-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const gameType = e.currentTarget.dataset.gameType;
        startGame(gameType);
    });
});

document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', () => {
        showScreen('game-selection');
    });
});

// Number panel back button
const numberPanelBackButton = document.querySelector('.number-drop-back-button');
if (numberPanelBackButton) {
    numberPanelBackButton.addEventListener('click', () => {
        showScreen('game-selection');
    });
}

// --- Core Game Logic ---

async function fetchQuestions() {
    if (allQuestions.length === 0) {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allQuestions = await response.json();
        } catch (error) {
            console.error("Could not fetch questions:", error);
            const app = document.getElementById('app');
            app.innerHTML = '<p>問題の読み込みに失敗しました。ページを再読み込みしてください。</p>';
        }
    }
}

async function startGame(gameType) {
    await fetchQuestions();
    currentQuestions = allQuestions.filter(q => q.type === gameType);
    if (currentQuestions.length > 0) {
       currentQuestions = currentQuestions.sort(() => 0.5 - Math.random());
    }
    
    currentQuestionIndex = 0;
    correctAnswers = 0;

    if (gameType === 'multiple-choice') {
        if(currentQuestions.length === 0) return;
        showScreen('question');
        showQuestion();
    } else if (gameType === 'line-drawing') {
        if(currentQuestions.length === 0) return;
        showScreen('line-drawing');
        initLineDrawingGame(currentQuestions[0]);
    } else if (gameType === 'maze') {
        if(currentQuestions.length === 0) return;
        showScreen('maze');
        initMazeGame(currentQuestions[0]);
    } else if (gameType === 'counting') {
        if(currentQuestions.length === 0) return;
        showScreen('counting');
        showCountingQuestion();

    } else if (gameType === 'drawing') {
        showScreen('drawing');
        initDrawingMode();
    } else if (gameType === 'watermelon') {
        showScreen('watermelon');
    } else if (gameType === 'number-drop') {
        showScreen('number-drop');
        initNumberDropGame();
    } else if (gameType === 'dot-connect') {
        showScreen('dot-connect');
        initDotConnectGame();
    } else if (gameType === 'letter-trace') {
        showScreen('letter-trace');
        initLetterTraceGame();
    } else if (gameType === 'hiragana-trace') {
        showScreen('hiragana-trace');
        initHiraganaTraceGame();
    } else if (gameType === 'dot-trace') {
        showScreen('dot-trace');
        initDotTraceGame();

    } else if (gameType === 'spot-difference') {
        showScreen('spot-difference');
        initSpotDifferenceGame();
    } else if (gameType === 'simple-maze') {
        showScreen('simple-maze');
        initSimpleMazeGame();
    } else if (gameType === 'coloring') {
        showScreen('coloring');
        initColoringGame();
    }
}

function showScreen(screenName) {
    // Stop watermelon BGM when leaving the screen
    const watermelonBgm = document.getElementById('watermelon-bgm');
    if (watermelonBgm) {
        watermelonBgm.pause();
        watermelonBgm.currentTime = 0;
    }

    // Stop number drop background video when leaving the screen
    const numberDropVideo = document.getElementById('number-drop-bg-video');
    if (numberDropVideo && screenName !== 'number-drop') {
        numberDropVideo.pause();
        numberDropVideo.currentTime = 0;
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}-screen`).classList.add('active');

    if (screenName === 'reward') {
        playAudio('assets/sounds/よくできました.mp3');
    } else if (screenName === 'watermelon') {
        // Start watermelon BGM when entering the screen
        if (watermelonBgm) {
            console.log('Attempting to play watermelon BGM');
            
            // Check if audio file is loaded
            watermelonBgm.addEventListener('loadeddata', () => {
                console.log('BGM file loaded successfully');
            });
            
            watermelonBgm.addEventListener('error', (e) => {
                console.error('BGM file loading error:', e);
            });
            
            // Add user interaction to enable autoplay
            const playBGM = () => {
                watermelonBgm.play().then(() => {
                    console.log('BGM started playing');
                }).catch(error => {
                    console.error('Could not play watermelon BGM:', error);
                });
            };
            
            // Try to play immediately
            playBGM();
            
            // If autoplay fails, play on first user interaction
            const enableBGM = () => {
                console.log('User interaction detected, trying to play BGM');
                playBGM();
                document.removeEventListener('click', enableBGM);
                document.removeEventListener('touchstart', enableBGM);
            };
            
            document.addEventListener('click', enableBGM, { once: true });
            document.addEventListener('touchstart', enableBGM, { once: true });
        } else {
            console.error('Watermelon BGM element not found');
        }
    }
}

function playAudio(src) {
    try {
        const audio = new Audio(src);
        audio.play();
    } catch (error) {
        console.error(`Could not play audio: ${src}`, error);
    }
}

// --- Multiple Choice Game ---

function showQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    questionContainer.innerHTML = `<h2>${question.question}</h2>`;
    if (question.question_audio) {
        playAudio(question.question_audio);
    }
    optionsContainer.innerHTML = '';
    const shuffledOptions = question.options.sort(() => 0.5 - Math.random());

    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option');
        if (option.image) {
            const image = document.createElement('img');
            image.src = option.image.replace('.png', '.webp'); // WebP
            image.alt = option.name;
            image.loading = 'lazy'; // Lazy loading
            button.appendChild(image);
        } else {
            button.textContent = option.name;
            button.style.fontSize = '32px'; // Make text options bigger
        }
        button.addEventListener('click', () => {
            if (option.audio) {
                playAudio(option.audio);
            }
            // Pass the button element to checkAnswer
            checkAnswer(option, button);
        });
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedOption, selectedButton) {
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedOption.name === question.answer;

    // Visual feedback
    optionsContainer.querySelectorAll('.option').forEach(btn => {
        btn.disabled = true;
        // Mark correct and incorrect answers
        const optionName = btn.querySelector('img')?.alt || btn.textContent;
        if (optionName === question.answer) {
            btn.style.borderColor = 'var(--success-color)';
            btn.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.5)';
        } else {
            btn.style.opacity = '0.6';
        }
    });

    if (isCorrect) {
        correctAnswers++;
        playAudio(question.correct_audio || 'assets/sounds/correct.mp3'); // Fallback sound
        selectedButton.style.borderColor = 'var(--success-color)';
        selectedButton.style.transform = 'scale(1.05)';

    } else {
        playAudio(question.incorrect_audio || 'assets/sounds/incorrect.mp3'); // Fallback sound
        selectedButton.style.borderColor = 'var(--error-color)';
        selectedButton.style.animation = 'shake 0.5s';
    }

    currentQuestionIndex++;
    setTimeout(() => {
        if (currentQuestionIndex < currentQuestions.length) {
            showQuestion();
        } else {
            showScreen('reward');
        }
    }, 1500); // Increased delay to see feedback
}

// --- Line Drawing Game ---

function initLineDrawingGame(question) {
    if (question.question_audio) {
        playAudio(question.question_audio);
    }
    lineDrawingCanvas.width = 800;
    lineDrawingCanvas.height = 500;

    const items = [];
    const pairs = question.pairs;
    const leftColumnX = 150;
    const rightColumnX = 650;
    const startY = 120;
    const itemGapY = 130;
    const itemWidth = 120;
    const itemHeight = 120;

    let leftItems = [];
    let rightItems = [];

    pairs.forEach((pair, index) => {
        const yPos = startY + (index * itemGapY);
        leftItems.push({ id: `L${index}`, matchId: `R${index}`, ...pair.item1, x: leftColumnX, y: yPos, width: itemWidth, height: itemHeight, matched: false });
        rightItems.push({ id: `R${index}`, matchId: `L${index}`, ...pair.item2, x: rightColumnX, y: yPos, width: itemWidth, height: itemHeight, matched: false });
    });
    
    // Shuffle one side
    rightItems = rightItems.sort(() => 0.5 - Math.random());
    // Re-assign y values after shuffling
    rightItems.forEach((item, index) => {
        item.y = startY + (index * itemGapY);
    });


    lineDrawingState = {
        items: [...leftItems, ...rightItems],
        selectedItem: null,
        lines: [],
        question: question.question
    };

    preloadImages(lineDrawingState.items, drawLineDrawingBoard);
}

function preloadImages(items, callback) {
    let loadedCount = 0;
    const imageItems = items.filter(item => item.image);
    if (imageItems.length === 0) {
        callback();
        return;
    }
    imageItems.forEach(item => {
        item.img = new Image();
        item.img.src = item.image;
        item.img.onload = () => {
            loadedCount++;
            if (loadedCount === imageItems.length) {
                callback();
            }
        };
        item.img.onerror = () => {
            console.error(`Failed to load image: ${item.image}`);
            item.img = null; // Set to null if loading fails
            loadedCount++;
            if (loadedCount === imageItems.length) {
                callback();
            }
        }
    });
}

function drawLineDrawingBoard() {
    lineDrawingCtx.clearRect(0, 0, lineDrawingCanvas.width, lineDrawingCanvas.height);

    lineDrawingCtx.font = "bold 32px sans-serif";
    lineDrawingCtx.textAlign = "center";
    lineDrawingCtx.fillStyle = "#333";
    lineDrawingCtx.fillText(lineDrawingState.question, lineDrawingCanvas.width / 2, 50);

    lineDrawingState.items.forEach(item => {
        if (item.img) {
            lineDrawingCtx.drawImage(item.img, item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
        } else {
            lineDrawingCtx.font = "32px sans-serif";
            lineDrawingCtx.fillStyle = item.matched ? "#ccc" : "black";
            lineDrawingCtx.textAlign = "center";
            lineDrawingCtx.textBaseline = "middle";
            lineDrawingCtx.fillText(item.name, item.x, item.y);
        }
        if (lineDrawingState.selectedItem && lineDrawingState.selectedItem.id === item.id) {
            lineDrawingCtx.strokeStyle = '#007bff';
            lineDrawingCtx.lineWidth = 4;
            lineDrawingCtx.strokeRect(item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
        }
    });

    lineDrawingCtx.strokeStyle = '#28a745';
    lineDrawingCtx.lineWidth = 8;
    lineDrawingCtx.lineCap = 'round';
    lineDrawingState.lines.forEach(line => {
        lineDrawingCtx.beginPath();
        lineDrawingCtx.moveTo(line.start.x, line.start.y);
        lineDrawingCtx.lineTo(line.end.x, line.end.y);
        lineDrawingCtx.stroke();
    });
}

function getClickedItem(x, y) {
    return lineDrawingState.items.find(item =>
        !item.matched &&
        x >= item.x - item.width / 2 && x <= item.x + item.width / 2 &&
        y >= item.y - item.height / 2 && y <= item.y + item.height / 2
    );
}

let isDrawing = false;
let currentLine = {};

function getPointerPosition(e) {
    const rect = lineDrawingCanvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    const scaleX = lineDrawingCanvas.width / rect.width;
    const scaleY = lineDrawingCanvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

lineDrawingCanvas.addEventListener('pointerdown', (e) => {
    if (!lineDrawingScreen.classList.contains('active')) return;
    e.preventDefault();
    const pos = getPointerPosition(e);
    const clickedItem = getClickedItem(pos.x, pos.y);

    if (clickedItem) {
        isDrawing = true;
        lineDrawingState.selectedItem = clickedItem;
        currentLine = { start: clickedItem, end: pos };
        drawLineDrawingBoard(); // Redraw to show selection
    }
});

lineDrawingCanvas.addEventListener('pointermove', (e) => {
    if (!isDrawing || !lineDrawingScreen.classList.contains('active')) return;
    e.preventDefault();
    const pos = getPointerPosition(e);
    currentLine.end = pos;
    drawLineDrawingBoard();

    const { start, end } = currentLine;
    lineDrawingCtx.beginPath();
    lineDrawingCtx.moveTo(start.x, start.y);
    lineDrawingCtx.lineTo(end.x, end.y);
    lineDrawingCtx.strokeStyle = '#007bff';
    lineDrawingCtx.lineWidth = 6;
    lineDrawingCtx.stroke();
});

lineDrawingCanvas.addEventListener('pointerup', (e) => {
    if (!isDrawing || !lineDrawingScreen.classList.contains('active')) return;
    e.preventDefault();
    const pos = getPointerPosition(e);
    const targetItem = getClickedItem(pos.x, pos.y);

    if (targetItem && lineDrawingState.selectedItem && targetItem.id !== lineDrawingState.selectedItem.id && targetItem.matchId === lineDrawingState.selectedItem.id) {
        targetItem.matched = true;
        const sourceItem = lineDrawingState.items.find(item => item.id === lineDrawingState.selectedItem.id);
        if(sourceItem) sourceItem.matched = true;

        lineDrawingState.lines.push({ start: lineDrawingState.selectedItem, end: targetItem });
        playAudio('assets/sounds/correct.mp3');

        if (lineDrawingState.lines.length === lineDrawingState.items.length / 2) {
            setTimeout(() => showScreen('reward'), 800);
        }
    } else {
        if (lineDrawingState.selectedItem) {
             playAudio('assets/sounds/incorrect.mp3');
        }
    }

    isDrawing = false;
    lineDrawingState.selectedItem = null;
    currentLine = {};
    drawLineDrawingBoard();
});

lineDrawingCanvas.style.touchAction = 'none';

// --- Maze Game ---

let mazeState = {};

function initMazeGame(question) {
    const canvas = document.getElementById('maze-canvas');
    const ctx = canvas.getContext('2d');
    const map = question.map;
    const tileSize = 50;

    let playerPos = { x: 0, y: 0 };
    let goalPos = { x: 0, y: 0 };
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 'S') {
                playerPos = { x, y };
            }
            if (map[y][x] === 'G') {
                goalPos = { x, y };
            }
        }
    }

    mazeState = {
        map,
        tileSize,
        playerPos,
        goalPos, // Use dynamic goal position
        ctx,
        canvas
    };

    drawMaze();
    window.addEventListener('keydown', handleMazeKeyPress);

    document.querySelectorAll('.maze-control-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const direction = e.target.dataset.direction;
            movePlayer(direction);
        });
    });
}

function drawMaze() {
    const { map, tileSize, playerPos, goalPos, ctx, canvas } = mazeState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            ctx.fillStyle = map[y][x] === 1 ? '#8B4513' : '#F0E68C';
            if (map[y][x] === 'S') ctx.fillStyle = '#90EE90'; // Start
            if (map[y][x] === 'G') ctx.fillStyle = '#FFD700'; // Goal
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }

    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(playerPos.x * tileSize + tileSize / 2, playerPos.y * tileSize + tileSize / 2, tileSize / 3, 0, Math.PI * 2);
    ctx.fill();
}

function movePlayer(direction) {
    if (!mazeScreen.classList.contains('active')) return;

    let { x, y } = mazeState.playerPos;
    const { map } = mazeState;

    switch (direction) {
        case 'ArrowUp': y--; break;
        case 'ArrowDown': y++; break;
        case 'ArrowLeft': x--; break;
        case 'ArrowRight': x++; break;
        default: return;
    }

    if (map[y] && map[y][x] !== 1) {
        mazeState.playerPos = { x, y };
        drawMaze();

        if (map[y][x] === 'G') {
            window.removeEventListener('keydown', handleMazeKeyPress);
            document.querySelectorAll('.maze-control-button').forEach(button => button.disabled = true);
            playAudio('assets/sounds/correct.mp3');
            setTimeout(() => {
                showScreen('reward');
                document.querySelectorAll('.maze-control-button').forEach(button => button.disabled = false);
            }, 500);
        }
    }
}

function handleMazeKeyPress(e) {
    e.preventDefault();
    movePlayer(e.key);
}

// --- Counting Game ---

function showCountingQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    countingQuestionContainer.innerHTML = `<h2>${question.question}</h2>`;
    if (question.question_audio) {
        playAudio(question.question_audio);
    }

    let itemsHtml = '<div class="counting-items-grid">';
    for (let i = 0; i < question.item_count; i++) {
        itemsHtml += `<img src="${question.item_image}" alt="item" class="counting-item">`;
    }
    itemsHtml += '</div>';
    countingQuestionContainer.innerHTML += itemsHtml;

    countingOptionsContainer.innerHTML = '';
    const shuffledOptions = question.options.sort(() => 0.5 - Math.random());

    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option');
        button.textContent = option;
        button.style.fontSize = '48px';
        button.style.width = '100px';
        button.style.height = '100px';

        button.addEventListener('click', () => {
            checkCountingAnswer(option, button);
        });
        countingOptionsContainer.appendChild(button);
    });
}

function checkCountingAnswer(selectedOption, selectedButton) {
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === question.answer;

    countingOptionsContainer.querySelectorAll('.option').forEach(btn => {
        btn.disabled = true;
        if (parseInt(btn.textContent) === question.answer) {
            btn.style.borderColor = 'var(--success-color)';
        } else {
            btn.style.opacity = '0.6';
        }
    });

    if (isCorrect) {
        correctAnswers++;
        playAudio(question.correct_audio || 'assets/sounds/correct.mp3');
        selectedButton.style.borderColor = 'var(--success-color)';
    } else {
        playAudio(question.incorrect_audio || 'assets/sounds/incorrect.mp3');
        selectedButton.style.borderColor = 'var(--error-color)';
    }

    currentQuestionIndex++;
    setTimeout(() => {
        if (currentQuestionIndex < currentQuestions.length) {
            showCountingQuestion();
        } else {
            showScreen('reward');
        }
    }, 1500);
}








// --- Hiragana Trace Game ---
let hiraganaTraceState = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentCharacterIndex: 0,
    userPath: [],
    characters: [
        'あ', 'い', 'う', 'え', 'お',
        'か', 'き', 'く', 'け', 'こ',
        'さ', 'し', 'す', 'せ', 'そ',
        'た', 'ち', 'つ', 'て', 'と',
        'な', 'に', 'ぬ', 'ね', 'の',
        'は', 'ひ', 'ふ', 'へ', 'ほ',
        'ま', 'み', 'む', 'め', 'も',
        'や', 'ゆ', 'よ',
        'ら', 'り', 'る', 'れ', 'ろ',
        'わ', 'を', 'ん'
    ]
};

function initHiraganaTraceGame() {
    const canvas = document.getElementById('hiragana-trace-canvas');
    const ctx = canvas.getContext('2d');
    
    hiraganaTraceState.canvas = canvas;
    hiraganaTraceState.ctx = ctx;
    hiraganaTraceState.currentCharacterIndex = 0;
    hiraganaTraceState.userPath = [];
    hiraganaTraceState.isDrawing = false;
    
    // イベントリスナーを追加
    canvas.addEventListener('pointerdown', handleHiraganaTraceStart);
    canvas.addEventListener('pointermove', handleHiraganaTraceMove);
    canvas.addEventListener('pointerup', handleHiraganaTraceEnd);
    
    // 最初の文字を表示
    showCurrentHiraganaCharacter();
    drawHiraganaTraceCanvas();
}

function showCurrentHiraganaCharacter() {
    const character = hiraganaTraceState.characters[hiraganaTraceState.currentCharacterIndex];
    const display = document.getElementById('hiragana-character-display');
    const progress = document.getElementById('hiragana-progress');
    
    display.textContent = character;
    progress.textContent = `${hiraganaTraceState.currentCharacterIndex + 1} / ${hiraganaTraceState.characters.length}`;
    
    // 音声再生（もしあれば）
    playAudio(`assets/sounds/${character}_nazotte.mp3`);
}

function drawHiraganaTraceCanvas() {
    const { ctx, canvas } = hiraganaTraceState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 背景に薄く文字を表示
    const character = hiraganaTraceState.characters[hiraganaTraceState.currentCharacterIndex];
    ctx.font = '200px "M PLUS Rounded 1c", sans-serif';
    ctx.fillStyle = '#f0f0f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character, canvas.width / 2, canvas.height / 2);
    
    // ユーザーの描画を表示
    if (hiraganaTraceState.userPath.length > 1) {
        ctx.strokeStyle = '#ff4500';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(hiraganaTraceState.userPath[0].x, hiraganaTraceState.userPath[0].y);
        for (let i = 1; i < hiraganaTraceState.userPath.length; i++) {
            ctx.lineTo(hiraganaTraceState.userPath[i].x, hiraganaTraceState.userPath[i].y);
        }
        ctx.stroke();
    }
}

function getHiraganaPointerPosition(e) {
    const rect = hiraganaTraceState.canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    const scaleX = hiraganaTraceState.canvas.width / rect.width;
    const scaleY = hiraganaTraceState.canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function handleHiraganaTraceStart(e) {
    e.preventDefault();
    const pos = getHiraganaPointerPosition(e);
    hiraganaTraceState.userPath = [pos];
    hiraganaTraceState.isDrawing = true;
    drawHiraganaTraceCanvas();
}

function handleHiraganaTraceMove(e) {
    if (!hiraganaTraceState.isDrawing) return;
    e.preventDefault();
    const pos = getHiraganaPointerPosition(e);
    hiraganaTraceState.userPath.push(pos);
    drawHiraganaTraceCanvas();
}

function handleHiraganaTraceEnd(e) {
    if (!hiraganaTraceState.isDrawing) return;
    e.preventDefault();
    hiraganaTraceState.isDrawing = false;
    
    // 簡単な判定（描画があれば成功とする）
    if (hiraganaTraceState.userPath.length > 10) {
        playAudio('assets/sounds/correct.mp3');
        
        setTimeout(() => {
            // 次の文字へ
            hiraganaTraceState.currentCharacterIndex++;
            if (hiraganaTraceState.currentCharacterIndex >= hiraganaTraceState.characters.length) {
                // 全ての文字が完了
                showScreen('reward');
            } else {
                // 次の文字を表示
                hiraganaTraceState.userPath = [];
                showCurrentHiraganaCharacter();
                drawHiraganaTraceCanvas();
            }
        }, 1500);
    } else {
        playAudio('assets/sounds/incorrect.mp3');
        // 描画をクリア
        hiraganaTraceState.userPath = [];
        drawHiraganaTraceCanvas();
    }
}

// --- Drawing Mode ---
let drawingState = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentTool: 'pen',
    currentColor: '#000000',
    lineWidth: 5,
    lastX: 0,
    lastY: 0
};

function initDrawingMode() {
    drawingState.canvas = document.getElementById('drawing-canvas');
    drawingState.ctx = drawingState.canvas.getContext('2d');
    
    // Set canvas size
    drawingState.canvas.width = 600;
    drawingState.canvas.height = 400;
    
    // Set initial drawing properties
    drawingState.ctx.lineCap = 'round';
    drawingState.ctx.lineJoin = 'round';
    drawingState.ctx.lineWidth = drawingState.lineWidth;
    drawingState.ctx.strokeStyle = drawingState.currentColor;
    
    // Clear canvas
    clearDrawingCanvas();
    
    // Add event listeners for tools
    setupDrawingTools();
    
    // Add drawing event listeners
    setupDrawingEvents();
}

function setupDrawingTools() {
    // Tool buttons
    document.getElementById('black-pen').addEventListener('click', () => selectTool('pen', '#000000'));
    document.getElementById('red-pen').addEventListener('click', () => selectTool('pen', '#ff0000'));
    document.getElementById('eraser').addEventListener('click', () => selectTool('eraser'));
    document.getElementById('clear-canvas').addEventListener('click', clearDrawingCanvas);
}

function selectTool(tool, color = null) {
    // Remove active class from all tool buttons
    document.querySelectorAll('.tool-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Set current tool
    drawingState.currentTool = tool;
    
    if (tool === 'pen' && color) {
        drawingState.currentColor = color;
        drawingState.ctx.globalCompositeOperation = 'source-over';
        drawingState.ctx.strokeStyle = color;
        drawingState.lineWidth = 5;
        
        // Add active class to selected pen
        const penButton = document.querySelector(`[data-color="${color}"]`);
        if (penButton) penButton.classList.add('active');
        
        // Remove eraser cursor
        drawingState.canvas.classList.remove('eraser-mode');
    } else if (tool === 'eraser') {
        drawingState.ctx.globalCompositeOperation = 'destination-out';
        drawingState.lineWidth = 20;
        
        // Add active class to eraser
        document.getElementById('eraser').classList.add('active');
        
        // Add eraser cursor
        drawingState.canvas.classList.add('eraser-mode');
    }
    
    drawingState.ctx.lineWidth = drawingState.lineWidth;
}

function clearDrawingCanvas() {
    drawingState.ctx.clearRect(0, 0, drawingState.canvas.width, drawingState.canvas.height);
    
    // Fill with white background
    drawingState.ctx.fillStyle = '#ffffff';
    drawingState.ctx.fillRect(0, 0, drawingState.canvas.width, drawingState.canvas.height);
}

function setupDrawingEvents() {
    // Mouse events
    drawingState.canvas.addEventListener('mousedown', startDrawing);
    drawingState.canvas.addEventListener('mousemove', draw);
    drawingState.canvas.addEventListener('mouseup', stopDrawing);
    drawingState.canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    drawingState.canvas.addEventListener('touchstart', handleTouchStart);
    drawingState.canvas.addEventListener('touchmove', handleTouchMove);
    drawingState.canvas.addEventListener('touchend', handleTouchEnd);
}

function getDrawingPosition(e) {
    const rect = drawingState.canvas.getBoundingClientRect();
    const scaleX = drawingState.canvas.width / rect.width;
    const scaleY = drawingState.canvas.height / rect.height;
    
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function startDrawing(e) {
    drawingState.isDrawing = true;
    const pos = getDrawingPosition(e);
    drawingState.lastX = pos.x;
    drawingState.lastY = pos.y;
}

function draw(e) {
    if (!drawingState.isDrawing) return;
    
    const pos = getDrawingPosition(e);
    
    drawingState.ctx.beginPath();
    drawingState.ctx.moveTo(drawingState.lastX, drawingState.lastY);
    drawingState.ctx.lineTo(pos.x, pos.y);
    drawingState.ctx.stroke();
    
    drawingState.lastX = pos.x;
    drawingState.lastY = pos.y;
}

function stopDrawing() {
    drawingState.isDrawing = false;
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawingState.canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawingState.canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    drawingState.isDrawing = false;
}

// --- Number Drop Game Logic ---
let numberDropState = {
    canvas: null,
    ctx: null,
    numbers: [],
    tappedNumbers: new Set(),
    gameRunning: false,
    animationId: null
};

function initNumberDropGame() {
    const canvas = document.getElementById('number-drop-canvas');
    const ctx = canvas.getContext('2d');
    
    numberDropState.canvas = canvas;
    numberDropState.ctx = ctx;
    numberDropState.numbers = [];
    numberDropState.tappedNumbers = new Set();
    numberDropState.gameRunning = true;
    
    // Set background video volume and play
    const bgVideo = document.getElementById('number-drop-bg-video');
    if (bgVideo) {
        bgVideo.volume = 0.1; // Low volume
        bgVideo.muted = false;
        bgVideo.currentTime = 0;
        bgVideo.play().catch(e => {
            console.log('Video autoplay failed, will play on user interaction:', e);
            // Fallback: play on first user interaction
            const playOnInteraction = () => {
                bgVideo.play();
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction);
            document.addEventListener('touchstart', playOnInteraction);
        });
    }
    
    // Update score display
    updateNumberDropScore();
    
    // Add click event listener
    canvas.addEventListener('click', handleNumberClick);
    canvas.addEventListener('touchstart', handleNumberTouch);
    
    // Start spawning numbers
    spawnNumber();
    
    // Start game loop
    gameLoop();
}

function spawnNumber() {
    if (!numberDropState.gameRunning) return;
    
    // Create a new falling number
    const size = 40 + Math.random() * 20;
    const number = {
        value: Math.floor(Math.random() * 10), // 0-9
        x: Math.random() * (numberDropState.canvas.width - size * 2) + size,
        y: -50,
        speed: 2 + Math.random() * 3,
        size: size,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        id: Date.now() + Math.random()
    };
    
    numberDropState.numbers.push(number);
    
    // Schedule next number spawn (faster timing)
    setTimeout(spawnNumber, 500 + Math.random() * 1000);
}

function gameLoop() {
    if (!numberDropState.gameRunning) return;
    
    const ctx = numberDropState.ctx;
    const canvas = numberDropState.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw numbers
    numberDropState.numbers = numberDropState.numbers.filter(number => {
        // Update position
        number.y += number.speed;
        
        // Remove if off screen
        if (number.y > canvas.height + 50) {
            return false;
        }
        
        // Draw number
        ctx.save();
        ctx.font = `bold ${number.size}px Arial`;
        ctx.fillStyle = number.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw outline
        ctx.strokeText(number.value.toString(), number.x, number.y);
        // Draw fill
        ctx.fillText(number.value.toString(), number.x, number.y);
        
        ctx.restore();
        
        return true;
    });
    
    numberDropState.animationId = requestAnimationFrame(gameLoop);
}

function handleNumberClick(e) {
    const rect = numberDropState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    checkNumberHit(x, y);
}

function handleNumberTouch(e) {
    e.preventDefault();
    const rect = numberDropState.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    checkNumberHit(x, y);
}

function checkNumberHit(x, y) {
    for (let i = numberDropState.numbers.length - 1; i >= 0; i--) {
        const number = numberDropState.numbers[i];
        const distance = Math.sqrt((x - number.x) ** 2 + (y - number.y) ** 2);
        
        if (distance < number.size / 2) {
            // Hit!
            numberDropState.tappedNumbers.add(number.value);
            numberDropState.numbers.splice(i, 1);
            
            // Play number audio
            playAudio(`assets/sounds/${number.value}.mp3`);
            
            // Update score
            updateNumberDropScore();
            
            // Check if game is complete
            if (numberDropState.tappedNumbers.size === 10) {
                completeNumberDropGame();
            }
            
            break;
        }
    }
}

function updateNumberDropScore() {
    const scoreElement = document.getElementById('tapped-numbers');
    if (scoreElement) {
        scoreElement.textContent = numberDropState.tappedNumbers.size;
    }
}

function completeNumberDropGame() {
    numberDropState.gameRunning = false;
    
    if (numberDropState.animationId) {
        cancelAnimationFrame(numberDropState.animationId);
    }
    
    // Clear canvas
    numberDropState.ctx.clearRect(0, 0, numberDropState.canvas.width, numberDropState.canvas.height);
    
    // Show completion message
    setTimeout(() => {
        showScreen('reward');
    }, 500);
}

// --- Dot Connect Game (Apple Drawing) ---
let dotConnectState = {
    canvas: null,
    ctx: null,
    dots: [],
    connections: [],
    currentPath: [],
    isDrawing: false,
    completed: false
};

function initDotConnectGame() {
    dotConnectState.canvas = document.getElementById('dot-connect-canvas');
    dotConnectState.ctx = dotConnectState.canvas.getContext('2d');
    dotConnectState.dots = [];
    dotConnectState.connections = [];
    dotConnectState.currentPath = [];
    dotConnectState.isDrawing = false;
    dotConnectState.completed = false;
    dotConnectState.dragPath = [];
    
    // Create apple-shaped dots
    createAppleDots();
    drawDotConnectGame();
    
    // Add event listeners
    dotConnectState.canvas.addEventListener('mousedown', handleDotConnectMouseDown);
    dotConnectState.canvas.addEventListener('mousemove', handleDotConnectMouseMove);
    dotConnectState.canvas.addEventListener('mouseup', handleDotConnectMouseUp);
    dotConnectState.canvas.addEventListener('touchstart', handleDotConnectTouchStart);
    dotConnectState.canvas.addEventListener('touchmove', handleDotConnectTouchMove);
    dotConnectState.canvas.addEventListener('touchend', handleDotConnectTouchEnd);
}

function createAppleDots() {
    const centerX = dotConnectState.canvas.width / 2;
    const centerY = dotConnectState.canvas.height / 2;
    
    // Apple shape dots (simplified)
    dotConnectState.dots = [
        {x: centerX, y: centerY - 80, number: 1, connected: false},
        {x: centerX + 40, y: centerY - 60, number: 2, connected: false},
        {x: centerX + 60, y: centerY - 20, number: 3, connected: false},
        {x: centerX + 50, y: centerY + 20, number: 4, connected: false},
        {x: centerX + 30, y: centerY + 50, number: 5, connected: false},
        {x: centerX, y: centerY + 70, number: 6, connected: false},
        {x: centerX - 30, y: centerY + 50, number: 7, connected: false},
        {x: centerX - 50, y: centerY + 20, number: 8, connected: false},
        {x: centerX - 60, y: centerY - 20, number: 9, connected: false},
        {x: centerX - 40, y: centerY - 60, number: 10, connected: false},
        {x: centerX - 10, y: centerY - 100, number: 11, connected: false}, // stem
        {x: centerX + 20, y: centerY - 110, number: 12, connected: false}  // leaf
    ];
}

function drawDotConnectGame() {
    dotConnectState.ctx.clearRect(0, 0, dotConnectState.canvas.width, dotConnectState.canvas.height);
    
    // Draw connections
    dotConnectState.ctx.strokeStyle = '#ff4500';
    dotConnectState.ctx.lineWidth = 3;
    dotConnectState.connections.forEach(connection => {
        dotConnectState.ctx.beginPath();
        dotConnectState.ctx.moveTo(connection.from.x, connection.from.y);
        dotConnectState.ctx.lineTo(connection.to.x, connection.to.y);
        dotConnectState.ctx.stroke();
    });
    
    // Draw current drag path
    if (dotConnectState.dragPath.length > 1) {
        dotConnectState.ctx.strokeStyle = '#ffa500';
        dotConnectState.ctx.lineWidth = 2;
        dotConnectState.ctx.beginPath();
        dotConnectState.ctx.moveTo(dotConnectState.dragPath[0].x, dotConnectState.dragPath[0].y);
        for (let i = 1; i < dotConnectState.dragPath.length; i++) {
            dotConnectState.ctx.lineTo(dotConnectState.dragPath[i].x, dotConnectState.dragPath[i].y);
        }
        dotConnectState.ctx.stroke();
    }
    
    // Draw dots
    dotConnectState.dots.forEach(dot => {
        dotConnectState.ctx.beginPath();
        dotConnectState.ctx.arc(dot.x, dot.y, 15, 0, 2 * Math.PI);
        dotConnectState.ctx.fillStyle = dot.connected ? '#28a745' : '#007bff';
        dotConnectState.ctx.fill();
        dotConnectState.ctx.strokeStyle = '#333';
        dotConnectState.ctx.lineWidth = 2;
        dotConnectState.ctx.stroke();
        
        // Draw number
        dotConnectState.ctx.fillStyle = '#fff';
        dotConnectState.ctx.font = 'bold 14px Arial';
        dotConnectState.ctx.textAlign = 'center';
        dotConnectState.ctx.fillText(dot.number, dot.x, dot.y + 5);
    });
}

function handleDotConnectMouseDown(e) {
    const rect = dotConnectState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startDotConnect(x, y);
}

function handleDotConnectTouchStart(e) {
    e.preventDefault();
    const rect = dotConnectState.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    startDotConnect(x, y);
}

function startDotConnect(x, y) {
    const clickedDot = findNearestDot(x, y);
    if (clickedDot && !dotConnectState.completed) {
        if (dotConnectState.currentPath.length === 0 && clickedDot.number === 1) {
            dotConnectState.isDrawing = true;
            dotConnectState.currentPath.push(clickedDot);
            clickedDot.connected = true;
            dotConnectState.dragPath = [{x, y}];
            playAudio(`assets/sounds/${clickedDot.number}.mp3`);
            drawDotConnectGame();
        }
    }
}

function continueDotConnect(x, y) {
    if (!dotConnectState.isDrawing || dotConnectState.completed) return;
    
    dotConnectState.dragPath.push({x, y});
    
    const nearestDot = findNearestDot(x, y);
    if (nearestDot && !nearestDot.connected) {
        const expectedNumber = dotConnectState.currentPath[dotConnectState.currentPath.length - 1].number + 1;
        if (nearestDot.number === expectedNumber) {
            dotConnectState.currentPath.push(nearestDot);
            nearestDot.connected = true;
            
            dotConnectState.connections.push({
                from: dotConnectState.currentPath[dotConnectState.currentPath.length - 2],
                to: nearestDot
            });
            
            playAudio(`assets/sounds/${nearestDot.number}.mp3`);
            
            if (dotConnectState.currentPath.length === dotConnectState.dots.length) {
                completeDotConnectGame();
            }
        }
    }
    
    drawDotConnectGame();
}

function endDotConnect() {
    dotConnectState.isDrawing = false;
    dotConnectState.dragPath = [];
    drawDotConnectGame();
}

function findNearestDot(x, y) {
    for (let dot of dotConnectState.dots) {
        const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
        if (distance <= 20) {
            return dot;
        }
    }
    return null;
}

function completeDotConnectGame() {
    dotConnectState.completed = true;
    
    // Draw apple shape
    dotConnectState.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    dotConnectState.ctx.beginPath();
    dotConnectState.ctx.moveTo(dotConnectState.dots[0].x, dotConnectState.dots[0].y);
    for (let i = 1; i < dotConnectState.dots.length - 2; i++) {
        dotConnectState.ctx.lineTo(dotConnectState.dots[i].x, dotConnectState.dots[i].y);
    }
    dotConnectState.ctx.closePath();
    dotConnectState.ctx.fill();
    
    playAudio('assets/sounds/よくできました.mp3');
    
    setTimeout(() => {
        showScreen('game-selection');
    }, 3000);
}

// --- Letter Trace Game ---
let letterTraceState = {
    canvas: null,
    ctx: null,
    currentLetter: 'あ',
    letters: ['あ', 'い'],
    currentLetterIndex: 0,
    tracePath: [],
    allTracePaths: [],
    isTracing: false,
    completed: false
};

function initLetterTraceGame() {
    letterTraceState.canvas = document.getElementById('letter-trace-canvas');
    letterTraceState.ctx = letterTraceState.canvas.getContext('2d');
    letterTraceState.tracePath = [];
    letterTraceState.allTracePaths = [];
    letterTraceState.isTracing = false;
    letterTraceState.completed = false;
    letterTraceState.currentLetterIndex = 0;
    letterTraceState.currentLetter = letterTraceState.letters[0];
    
    drawLetterTraceGame();
    
    // Add event listeners
    letterTraceState.canvas.addEventListener('mousedown', handleLetterTraceMouseDown);
    letterTraceState.canvas.addEventListener('mousemove', handleLetterTraceMouseMove);
    letterTraceState.canvas.addEventListener('mouseup', handleLetterTraceMouseUp);
    letterTraceState.canvas.addEventListener('touchstart', handleLetterTraceTouchStart);
    letterTraceState.canvas.addEventListener('touchmove', handleLetterTraceTouchMove);
    letterTraceState.canvas.addEventListener('touchend', handleLetterTraceTouchEnd);
}

function drawLetterTraceGame() {
    letterTraceState.ctx.clearRect(0, 0, letterTraceState.canvas.width, letterTraceState.canvas.height);
    
    // Draw letter outline
    letterTraceState.ctx.strokeStyle = '#ccc';
    letterTraceState.ctx.lineWidth = 8;
    letterTraceState.ctx.font = 'bold 200px serif';
    letterTraceState.ctx.textAlign = 'center';
    letterTraceState.ctx.strokeText(letterTraceState.currentLetter, letterTraceState.canvas.width / 2, letterTraceState.canvas.height / 2 + 70);
    
    // Draw all previous trace paths
    letterTraceState.allTracePaths.forEach(path => {
        if (path.length > 1) {
            letterTraceState.ctx.strokeStyle = '#ff4500';
            letterTraceState.ctx.lineWidth = 6;
            letterTraceState.ctx.beginPath();
            letterTraceState.ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                letterTraceState.ctx.lineTo(path[i].x, path[i].y);
            }
            letterTraceState.ctx.stroke();
        }
    });
    
    // Draw current traced path
    if (letterTraceState.tracePath.length > 1) {
        letterTraceState.ctx.strokeStyle = '#ff4500';
        letterTraceState.ctx.lineWidth = 6;
        letterTraceState.ctx.beginPath();
        letterTraceState.ctx.moveTo(letterTraceState.tracePath[0].x, letterTraceState.tracePath[0].y);
        for (let i = 1; i < letterTraceState.tracePath.length; i++) {
            letterTraceState.ctx.lineTo(letterTraceState.tracePath[i].x, letterTraceState.tracePath[i].y);
        }
        letterTraceState.ctx.stroke();
    }
}

function handleLetterTraceMouseDown(e) {
    const rect = letterTraceState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startLetterTrace(x, y);
}

function handleLetterTraceMouseMove(e) {
    if (letterTraceState.isTracing) {
        const rect = letterTraceState.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        continueLetterTrace(x, y);
    }
}

function handleLetterTraceMouseUp() {
    endLetterTrace();
}

function handleLetterTraceTouchStart(e) {
    e.preventDefault();
    const rect = letterTraceState.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    startLetterTrace(x, y);
}

function handleLetterTraceTouchMove(e) {
    e.preventDefault();
    if (letterTraceState.isTracing) {
        const rect = letterTraceState.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        continueLetterTrace(x, y);
    }
}

function handleLetterTraceTouchEnd(e) {
    e.preventDefault();
    endLetterTrace();
}

function startLetterTrace(x, y) {
    letterTraceState.isTracing = true;
    letterTraceState.tracePath = [{x, y}];
}

function continueLetterTrace(x, y) {
    letterTraceState.tracePath.push({x, y});
    drawLetterTraceGame();
}

function endLetterTrace() {
    letterTraceState.isTracing = false;
    
    if (letterTraceState.tracePath.length > 20) {
        // Save current trace path
        letterTraceState.allTracePaths.push([...letterTraceState.tracePath]);
        letterTraceState.tracePath = [];
        
        // Check if we should move to next letter
        if (letterTraceState.allTracePaths.length >= 3) {
            if (letterTraceState.currentLetterIndex < letterTraceState.letters.length - 1) {
                // Move to next letter
                letterTraceState.currentLetterIndex++;
                letterTraceState.currentLetter = letterTraceState.letters[letterTraceState.currentLetterIndex];
                letterTraceState.allTracePaths = [];
                drawLetterTraceGame();
            } else {
                // All letters completed
                completeLetterTrace();
            }
        }
    }
}

function completeLetterTrace() {
    letterTraceState.completed = true;
    playAudio('assets/sounds/よくできました.mp3');
    
    setTimeout(() => {
        showScreen('game-selection');
    }, 2000);
}

// --- Dot Trace Game ---
let dotTraceState = {
    canvas: null,
    ctx: null,
    dots: [],
    tracePath: [],
    isTracing: false,
    completed: false
};

function initDotTraceGame() {
    dotTraceState.canvas = document.getElementById('dot-trace-canvas');
    dotTraceState.ctx = dotTraceState.canvas.getContext('2d');
    dotTraceState.tracePath = [];
    dotTraceState.isTracing = false;
    dotTraceState.completed = false;
    
    createStarDots();
    drawDotTraceGame();
    
    // Add event listeners
    dotTraceState.canvas.addEventListener('mousedown', handleDotTraceMouseDown);
    dotTraceState.canvas.addEventListener('mousemove', handleDotTraceMouseMove);
    dotTraceState.canvas.addEventListener('mouseup', handleDotTraceMouseUp);
    dotTraceState.canvas.addEventListener('touchstart', handleDotTraceTouchStart);
    dotTraceState.canvas.addEventListener('touchmove', handleDotTraceTouchMove);
    dotTraceState.canvas.addEventListener('touchend', handleDotTraceTouchEnd);
}

function createStarDots() {
    const centerX = dotTraceState.canvas.width / 2;
    const centerY = dotTraceState.canvas.height / 2;
    const radius = 100;
    
    dotTraceState.dots = [];
    
    // Create star pattern dots
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI * 2) / 10;
        const r = i % 2 === 0 ? radius : radius * 0.5;
        const x = centerX + Math.cos(angle - Math.PI / 2) * r;
        const y = centerY + Math.sin(angle - Math.PI / 2) * r;
        dotTraceState.dots.push({x, y, visited: false});
    }
}

function drawDotTraceGame() {
    dotTraceState.ctx.clearRect(0, 0, dotTraceState.canvas.width, dotTraceState.canvas.height);
    
    // Draw dots
    dotTraceState.dots.forEach((dot, index) => {
        dotTraceState.ctx.beginPath();
        dotTraceState.ctx.arc(dot.x, dot.y, 12, 0, 2 * Math.PI);
        dotTraceState.ctx.fillStyle = dot.visited ? '#28a745' : '#ffc107';
        dotTraceState.ctx.fill();
        dotTraceState.ctx.strokeStyle = '#333';
        dotTraceState.ctx.lineWidth = 2;
        dotTraceState.ctx.stroke();
    });
    
    // Draw traced path
    if (dotTraceState.tracePath.length > 1) {
        dotTraceState.ctx.strokeStyle = '#ff4500';
        dotTraceState.ctx.lineWidth = 4;
        dotTraceState.ctx.beginPath();
        dotTraceState.ctx.moveTo(dotTraceState.tracePath[0].x, dotTraceState.tracePath[0].y);
        for (let i = 1; i < dotTraceState.tracePath.length; i++) {
            dotTraceState.ctx.lineTo(dotTraceState.tracePath[i].x, dotTraceState.tracePath[i].y);
        }
        dotTraceState.ctx.stroke();
    }
}

function handleDotTraceMouseDown(e) {
    const rect = dotTraceState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startDotTrace(x, y);
}

function handleDotTraceMouseMove(e) {
    if (dotTraceState.isTracing) {
        const rect = dotTraceState.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        continueDotTrace(x, y);
    }
}

function handleDotTraceMouseUp() {
    endDotTrace();
}

function handleDotTraceTouchStart(e) {
    e.preventDefault();
    const rect = dotTraceState.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    startDotTrace(x, y);
}

function handleDotTraceTouchMove(e) {
    e.preventDefault();
    if (dotTraceState.isTracing) {
        const rect = dotTraceState.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        continueDotTrace(x, y);
    }
}

function handleDotTraceTouchEnd(e) {
    e.preventDefault();
    endDotTrace();
}

function startDotTrace(x, y) {
    dotTraceState.isTracing = true;
    dotTraceState.tracePath = [{x, y}];
    
    // Check if starting near a dot
    checkDotVisit(x, y);
}

function continueDotTrace(x, y) {
    dotTraceState.tracePath.push({x, y});
    checkDotVisit(x, y);
    drawDotTraceGame();
}

function endDotTrace() {
    dotTraceState.isTracing = false;
    
    // Check if all dots are visited
    const allVisited = dotTraceState.dots.every(dot => dot.visited);
    if (allVisited) {
        completeDotTrace();
    }
}

function checkDotVisit(x, y) {
    dotTraceState.dots.forEach(dot => {
        const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
        if (distance <= 20 && !dot.visited) {
            dot.visited = true;
            playAudio('assets/sounds/correct.mp3');
        }
    });
}

function completeDotTrace() {
    dotTraceState.completed = true;
    
    // Draw star shape
    dotTraceState.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    dotTraceState.ctx.beginPath();
    dotTraceState.ctx.moveTo(dotTraceState.dots[0].x, dotTraceState.dots[0].y);
    for (let i = 1; i < dotTraceState.dots.length; i++) {
        dotTraceState.ctx.lineTo(dotTraceState.dots[i].x, dotTraceState.dots[i].y);
    }
    dotTraceState.ctx.closePath();
    dotTraceState.ctx.fill();
    
    playAudio('assets/sounds/よくできました.mp3');
    
    setTimeout(() => {
        showScreen('game-selection');
    }, 3000);
}

function handleDotConnectMouseMove(e) {
    if (dotConnectState.isDrawing) {
        const rect = dotConnectState.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        continueDotConnect(x, y);
    }
}

function handleDotConnectMouseUp() {
    endDotConnect();
}

function handleDotConnectTouchMove(e) {
    e.preventDefault();
    if (dotConnectState.isDrawing) {
        const rect = dotConnectState.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        continueDotConnect(x, y);
    }
}

function handleDotConnectTouchEnd() {
    endDotConnect();
}

// --- New Game Modes ---



// Spot the Difference Game
let spotDifferenceState = {
    foundDifferences: [],
    totalDifferences: 3,
    differences: [
        {x: 570, y: 280, radius: 25}, // 一番下の虫（蜂）の位置
        {x: 690, y: 300, radius: 25}, // 赤い花の位置（4番目の花：450+50+3*60=630, 100+200=300）
        {x: 700, y: 450, radius: 25}  // ねこの位置
    ]
};

function initSpotDifferenceGame() {
    const canvas = document.getElementById('spot-difference-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 600;
    
    spotDifferenceState.foundDifferences = [];
    
    drawSpotDifferenceImages(ctx);
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        checkDifference(ctx, x, y);
    });
}

function drawSpotDifferenceImages(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Instructions
    ctx.fillStyle = '#FFE135';
    ctx.fillRect(200, 20, 400, 60);
    ctx.fillStyle = 'black';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('2まいの えには、ちがう ところが 3つ あるよ。', 400, 40);
    ctx.fillText('みつけたら、みぎの えの ちがう ところに ○を つけよう。', 400, 65);
    
    // Left image (ひだり)
    drawSunflowerScene(ctx, 50, 100, false);
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(25, 80, 60, 30);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ひだり', 55, 100);
    
    // Right image (みぎ) with differences
    drawSunflowerScene(ctx, 450, 100, true);
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(725, 80, 60, 30);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('みぎ', 755, 100);
    
    // Draw found differences
    spotDifferenceState.foundDifferences.forEach(diff => {
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, diff.radius, 0, 2 * Math.PI);
        ctx.stroke();
    });
}

function drawSunflowerScene(ctx, offsetX, offsetY, withDifferences) {
    // Sky background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(offsetX, offsetY, 300, 400);
    
    // Sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(offsetX + 80, offsetY + 60, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    // Clouds
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(offsetX + 200, offsetY + 50, 20, 0, 2 * Math.PI);
    ctx.arc(offsetX + 220, offsetY + 50, 25, 0, 2 * Math.PI);
    ctx.arc(offsetX + 240, offsetY + 50, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sunflowers
    for (let i = 0; i < 4; i++) {
        const x = offsetX + 50 + i * 60;
        const y = offsetY + 200;
        
        // Petals
        ctx.fillStyle = withDifferences && i === 3 ? '#FF6347' : '#FFD700'; // Difference: flower color
        for (let j = 0; j < 8; j++) {
            const angle = (j * Math.PI) / 4;
            const petalX = x + Math.cos(angle) * 15;
            const petalY = y + Math.sin(angle) * 15;
            ctx.beginPath();
            ctx.ellipse(petalX, petalY, 8, 4, angle, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Center
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Stem
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x - 2, y, 4, 100);
    }
    
    // Ground
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(offsetX, offsetY + 300, 300, 100);
    
    // Girl
    const girlX = offsetX + 80;
    const girlY = offsetY + 250;
    
    // Girl's head
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(girlX, girlY, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    // Girl's hair
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(girlX, girlY - 5, 22, 0, Math.PI, true);
    ctx.fill();
    
    // Girl's body
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(girlX - 15, girlY + 15, 30, 40);
    
    // Boy
    const boyX = offsetX + 200;
    const boyY = offsetY + 250;
    
    // Boy's head
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(boyX, boyY, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    // Boy's hair
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(boyX, boyY - 5, 22, 0, Math.PI, true);
    ctx.fill();
    
    // Boy's body
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(boyX - 15, boyY + 15, 30, 40);
    
    // Bees (difference: extra bee in right image)
    const beePositions = withDifferences ? 
        [{x: offsetX + 120, y: offsetY + 150}, {x: offsetX + 180, y: offsetY + 120}, {x: offsetX + 120, y: offsetY + 180}] :
        [{x: offsetX + 120, y: offsetY + 150}, {x: offsetX + 180, y: offsetY + 120}];
    
    beePositions.forEach(bee => {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(bee.x, bee.y, 6, 4, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.fillRect(bee.x - 2, bee.y - 1, 1, 2);
        ctx.fillRect(bee.x + 1, bee.y - 1, 1, 2);
    });
    
    // Cat (difference: position)
    const catX = withDifferences ? offsetX + 250 : offsetX + 220;
    const catY = offsetY + 350;
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(catX, catY, 15, 10, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Cat ears
    ctx.beginPath();
    ctx.moveTo(catX - 10, catY - 8);
    ctx.lineTo(catX - 5, catY - 15);
    ctx.lineTo(catX, catY - 8);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(catX, catY - 8);
    ctx.lineTo(catX + 5, catY - 15);
    ctx.lineTo(catX + 10, catY - 8);
    ctx.fill();
}

function checkDifference(ctx, x, y) {
    // Only check clicks on the right side
    if (x < 450) return;
    
    for (let i = 0; i < spotDifferenceState.differences.length; i++) {
        const diff = spotDifferenceState.differences[i];
        const distance = Math.sqrt((x - diff.x) ** 2 + (y - diff.y) ** 2);
        
        if (distance <= diff.radius && !spotDifferenceState.foundDifferences.some(found => found.index === i)) {
            spotDifferenceState.foundDifferences.push({x: diff.x, y: diff.y, radius: diff.radius, index: i});
            
            // Play sound when difference is found
            playAudio('assets/sounds/correct.mp3');
            
            // Draw the circle immediately
            ctx.strokeStyle = '#E74C3C';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(diff.x, diff.y, diff.radius, 0, 2 * Math.PI);
            ctx.stroke();
            
            if (spotDifferenceState.foundDifferences.length === spotDifferenceState.totalDifferences) {
                playAudio('assets/sounds/よくできました.mp3');
                setTimeout(() => {
                    correctAnswers = spotDifferenceState.totalDifferences;
                    showScreen('reward');
                }, 2000);
            }
            break;
        }
    }
}

// Simple Maze Game
let simpleMazeState = {
    currentMazeType: 0,
    mazeTypes: ['circle', 'diamond', 'hexagon']
};

function initSimpleMazeGame() {
    const canvas = document.getElementById('simple-maze-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Randomly select maze type
    simpleMazeState.currentMazeType = Math.floor(Math.random() * 3);
    const mazeType = simpleMazeState.mazeTypes[simpleMazeState.currentMazeType];
    
    const maze = getMazeConfig(mazeType);
    
    drawSimpleMaze(ctx, maze, mazeType);
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Move player towards click
        maze.player.x = x;
        maze.player.y = y;
        
        drawSimpleMaze(ctx, maze, mazeType);
        
        // Check if reached goal
        const distance = Math.sqrt((x - maze.goal.x) ** 2 + (y - maze.goal.y) ** 2);
        if (distance < 30) {
            playAudio('assets/sounds/よくできました.mp3');
            setTimeout(() => {
                correctAnswers = 1;
                showScreen('reward');
            }, 2000);
        }
    });
}

function getMazeConfig(mazeType) {
    switch(mazeType) {
        case 'circle':
            return {
                start: {x: 400, y: 100},
                goal: {x: 400, y: 500},
                player: {x: 400, y: 100}
            };
        case 'diamond':
            return {
                start: {x: 400, y: 50},
                goal: {x: 400, y: 550},
                player: {x: 400, y: 50}
            };
        case 'hexagon':
            return {
                start: {x: 400, y: 100},
                goal: {x: 400, y: 500},
                player: {x: 400, y: 100}
            };
        default:
            return {
                start: {x: 400, y: 100},
                goal: {x: 400, y: 500},
                player: {x: 400, y: 100}
            };
    }
}

function drawSimpleMaze(ctx, maze, mazeType) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 8;
    
    switch(mazeType) {
        case 'circle':
            drawCircleMaze(ctx);
            break;
        case 'diamond':
            drawDiamondMaze(ctx);
            break;
        case 'hexagon':
            drawHexagonMaze(ctx);
            break;
    }
    
    // Draw start
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(maze.start.x - 25, maze.start.y - 15, 50, 30);
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('スタート', maze.start.x, maze.start.y + 5);
    
    // Draw goal
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(maze.goal.x - 25, maze.goal.y - 15, 50, 30);
    ctx.fillStyle = '#333';
    ctx.fillText('ゴール', maze.goal.x, maze.goal.y + 5);
    
    // Draw player
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.arc(maze.player.x, maze.player.y, 12, 0, 2 * Math.PI);
    ctx.fill();
}

function drawCircleMaze(ctx) {
    const centerX = 400;
    const centerY = 300;
    
    // Outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 200, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Middle circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 120, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Connecting lines and gaps
    ctx.beginPath();
    ctx.moveTo(centerX - 60, centerY);
    ctx.lineTo(centerX - 120, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 60, centerY);
    ctx.lineTo(centerX + 120, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 60);
    ctx.lineTo(centerX, centerY - 120);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 60);
    ctx.lineTo(centerX, centerY + 120);
    ctx.stroke();
    
    // Additional maze lines
    ctx.beginPath();
    ctx.moveTo(centerX - 120, centerY - 60);
    ctx.lineTo(centerX - 60, centerY - 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 60, centerY - 60);
    ctx.lineTo(centerX + 120, centerY - 60);
    ctx.stroke();
}

function drawDiamondMaze(ctx) {
    const centerX = 400;
    const centerY = 300;
    
    // Outer diamond
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 200);
    ctx.lineTo(centerX + 200, centerY);
    ctx.lineTo(centerX, centerY + 200);
    ctx.lineTo(centerX - 200, centerY);
    ctx.closePath();
    ctx.stroke();
    
    // Middle diamond
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 120);
    ctx.lineTo(centerX + 120, centerY);
    ctx.lineTo(centerX, centerY + 120);
    ctx.lineTo(centerX - 120, centerY);
    ctx.closePath();
    ctx.stroke();
    
    // Inner diamond
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 60);
    ctx.lineTo(centerX + 60, centerY);
    ctx.lineTo(centerX, centerY + 60);
    ctx.lineTo(centerX - 60, centerY);
    ctx.closePath();
    ctx.stroke();
    
    // Connecting lines
    ctx.beginPath();
    ctx.moveTo(centerX - 60, centerY - 30);
    ctx.lineTo(centerX - 120, centerY - 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 60, centerY - 30);
    ctx.lineTo(centerX + 120, centerY - 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX - 30, centerY + 60);
    ctx.lineTo(centerX - 60, centerY + 120);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 30, centerY + 60);
    ctx.lineTo(centerX + 60, centerY + 120);
    ctx.stroke();
}

function drawHexagonMaze(ctx) {
    const centerX = 400;
    const centerY = 300;
    
    // Outer hexagon
    drawHexagon(ctx, centerX, centerY, 180);
    
    // Middle hexagon
    drawHexagon(ctx, centerX, centerY, 120);
    
    // Inner hexagon
    drawHexagon(ctx, centerX, centerY, 60);
    
    // Connecting lines
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 60);
    ctx.lineTo(centerX, centerY - 120);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX - 52, centerY - 30);
    ctx.lineTo(centerX - 104, centerY - 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 52, centerY - 30);
    ctx.lineTo(centerX + 104, centerY - 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX - 52, centerY + 30);
    ctx.lineTo(centerX - 104, centerY + 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 52, centerY + 30);
    ctx.lineTo(centerX + 104, centerY + 60);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 60);
    ctx.lineTo(centerX, centerY + 120);
    ctx.stroke();
}

function drawHexagon(ctx, centerX, centerY, radius) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.stroke();
}

// Coloring Game
let coloringState = {
    currentColor: '#FF0000',
    isDrawing: false
};

function initColoringGame() {
    const canvas = document.getElementById('coloring-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 600;
    canvas.height = 400;
    
    drawColoringOutline(ctx);
    setupColoringTools();
    
    canvas.addEventListener('mousedown', startColoring);
    canvas.addEventListener('mousemove', continueColoring);
    canvas.addEventListener('mouseup', endColoring);
    canvas.addEventListener('touchstart', handleColoringTouchStart);
    canvas.addEventListener('touchmove', handleColoringTouchMove);
    canvas.addEventListener('touchend', handleColoringTouchEnd);
}

function drawColoringOutline(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw simple flower outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    
    // Flower petals
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = 300 + Math.cos(angle) * 60;
        const y = 200 + Math.sin(angle) * 60;
        
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Center
    ctx.beginPath();
    ctx.arc(300, 200, 25, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Stem
    ctx.beginPath();
    ctx.moveTo(300, 225);
    ctx.lineTo(300, 350);
    ctx.stroke();
}

function setupColoringTools() {
    const tools = document.querySelectorAll('.coloring-tool');
    tools.forEach(tool => {
        tool.addEventListener('click', () => {
            tools.forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            coloringState.currentColor = tool.dataset.color || tool.style.backgroundColor;
        });
    });
}

function startColoring(e) {
    coloringState.isDrawing = true;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawColoringPoint(e.target.getContext('2d'), x, y);
}

function continueColoring(e) {
    if (!coloringState.isDrawing) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawColoringPoint(e.target.getContext('2d'), x, y);
}

function endColoring() {
    coloringState.isDrawing = false;
}

function drawColoringPoint(ctx, x, y) {
    ctx.fillStyle = coloringState.currentColor;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
}

function handleColoringTouchStart(e) {
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    coloringState.isDrawing = true;
    drawColoringPoint(e.target.getContext('2d'), x, y);
}

function handleColoringTouchMove(e) {
    e.preventDefault();
    if (!coloringState.isDrawing) return;
    const rect = e.target.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    drawColoringPoint(e.target.getContext('2d'), x, y);
}

function handleColoringTouchEnd(e) {
    e.preventDefault();
    coloringState.isDrawing = false;
}
