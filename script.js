
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
    } else if (gameType === 'character-tracing') {
        if(currentQuestions.length === 0) return;
        showScreen('character-tracing');
        initCharacterTracingGame(currentQuestions[0]);
    } else if (gameType === 'drawing') {
        showScreen('drawing');
        initDrawingMode();
    } else if (gameType === 'watermelon') {
        showScreen('watermelon');
    } else if (gameType === 'number-drop') {
        showScreen('number-drop');
        initNumberDropGame();
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

// --- Character Tracing Game ---

let traceState = {};

function initCharacterTracingGame(question) {
    const canvas = document.getElementById('character-tracing-canvas');
    const ctx = canvas.getContext('2d');
    const title = document.getElementById('character-tracing-title');
    title.textContent = question.question;

    traceState = {
        question,
        canvas,
        ctx,
        currentStrokeIndex: 0,
        userPath: [],
        isDrawing: false
    };

    if (question.start_audio) {
        playAudio(question.start_audio);
    }

    drawTraceBoard();

    canvas.addEventListener('pointerdown', handleTraceStart);
    canvas.addEventListener('pointermove', handleTraceMove);
    canvas.addEventListener('pointerup', handleTraceEnd);
}

function drawTraceBoard() {
    const { ctx, canvas, question, currentStrokeIndex } = traceState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景に薄く完成形を表示
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    question.strokes.forEach(stroke => {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
    });

    // 現在のストロークを表示
    if (currentStrokeIndex < question.strokes.length) {
        const currentStroke = question.strokes[currentStrokeIndex];
        
        // ストロークのパスを表示
        ctx.strokeStyle = '#a0a0a0';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) {
            ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
        ctx.stroke();

        // 書き順の矢印を表示
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 3;
        for (let i = 0; i < currentStroke.length - 1; i++) {
            const start = currentStroke[i];
            const end = currentStroke[i + 1];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const angle = Math.atan2(dy, dx);
            const length = Math.sqrt(dx * dx + dy * dy);
            
            // 矢印の先端の大きさ
            const arrowSize = 15;
            // 矢印の位置（線の中間点）
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            
            ctx.beginPath();
            ctx.moveTo(midX - arrowSize * Math.cos(angle - Math.PI / 6), midY - arrowSize * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(midX, midY);
            ctx.lineTo(midX - arrowSize * Math.cos(angle + Math.PI / 6), midY - arrowSize * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }

        // 開始点を強調表示
        ctx.fillStyle = '#007bff';
        ctx.beginPath();
        ctx.arc(currentStroke[0].x, currentStroke[0].y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 開始点の周りに点滅エフェクト
        const pulseSize = 20 + Math.sin(Date.now() / 200) * 5;
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(currentStroke[0].x, currentStroke[0].y, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 完了したストロークを表示
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 20;
    for (let i = 0; i < currentStrokeIndex; i++) {
        const stroke = question.strokes[i];
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let j = 1; j < stroke.length; j++) {
            ctx.lineTo(stroke[j].x, stroke[j].y);
        }
        ctx.stroke();
    }

    // ユーザーの入力を表示
    if (traceState.isDrawing && traceState.userPath.length > 1) {
        ctx.strokeStyle = '#ff4500';
        ctx.lineWidth = 25;
        ctx.beginPath();
        ctx.moveTo(traceState.userPath[0].x, traceState.userPath[0].y);
        for (let i = 1; i < traceState.userPath.length; i++) {
            ctx.lineTo(traceState.userPath[i].x, traceState.userPath[i].y);
        }
        ctx.stroke();
    }

    // アニメーションの更新
    requestAnimationFrame(drawTraceBoard);
}

function getTracePointerPosition(e) {
    const rect = traceState.canvas.getBoundingClientRect();
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
    const scaleX = traceState.canvas.width / rect.width;
    const scaleY = traceState.canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function handleTraceStart(e) {
    e.preventDefault();
    const pos = getTracePointerPosition(e);
    traceState.userPath = [pos];
    traceState.isDrawing = true;
}

function handleTraceMove(e) {
    if (!traceState.isDrawing) return;
    e.preventDefault();
    const pos = getTracePointerPosition(e);
    traceState.userPath.push(pos);
    drawTraceBoard();
}

function handleTraceEnd(e) {
    if (!traceState.isDrawing) return;
    e.preventDefault();
    traceState.isDrawing = false;

    if (checkStrokeCompletion()) {
        traceState.currentStrokeIndex++;
        if (traceState.currentStrokeIndex >= traceState.question.strokes.length) {
            // Character complete
            if (traceState.question.end_audio) {
                playAudio(traceState.question.end_audio);
            }
            const title = document.getElementById('character-tracing-title');
            title.textContent = `「${traceState.question.character}」は「${traceState.question.example_word}」の「${traceState.question.character}」だよ！`;
            setTimeout(() => {
                // Move to next character or reward screen
                currentQuestionIndex++;
                if (currentQuestionIndex < currentQuestions.length) {
                    initCharacterTracingGame(currentQuestions[currentQuestionIndex]);
                } else {
                    showScreen('reward');
                }
            }, 3000);
        } else {
            playAudio('assets/sounds/correct.mp3');
        }
    } else {
        playAudio('assets/sounds/incorrect.mp3');
    }

    traceState.userPath = [];
    drawTraceBoard();
}

function checkStrokeCompletion() {
    const { userPath, question, currentStrokeIndex } = traceState;
    if (userPath.length < 2) return false;

    const stroke = question.strokes[currentStrokeIndex];
    const startThreshold = 40; // 開始点の判定範囲を広げる
    const endThreshold = 40;   // 終了点の判定範囲を広げる
    const pathThreshold = 40;  // パスからの許容距離を広げる
    const coverageThreshold = 0.7; // カバー率の要求を70%に下げる
    const directionThreshold = 0.6; // 方向の一致度の閾値（60%）

    // 1. 開始点と終了点のチェック
    const distToStart = Math.hypot(userPath[0].x - stroke[0].x, userPath[0].y - stroke[0].y);
    const distToEnd = Math.hypot(userPath[userPath.length - 1].x - stroke[stroke.length - 1].x, userPath[userPath.length - 1].y - stroke[stroke.length - 1].y);

    if (distToStart > startThreshold || distToEnd > endThreshold) {
        return false;
    }

    // 2. ストロークの方向チェック
    let correctDirections = 0;
    for (let i = 0; i < userPath.length - 1; i++) {
        const userDx = userPath[i + 1].x - userPath[i].x;
        const userDy = userPath[i + 1].y - userPath[i].y;
        const userAngle = Math.atan2(userDy, userDx);

        // 最も近いストロークセグメントの方向と比較
        let minAngleDiff = Math.PI;
        for (let j = 0; j < stroke.length - 1; j++) {
            const strokeDx = stroke[j + 1].x - stroke[j].x;
            const strokeDy = stroke[j + 1].y - stroke[j].y;
            const strokeAngle = Math.atan2(strokeDy, strokeDx);
            const angleDiff = Math.abs(userAngle - strokeAngle);
            minAngleDiff = Math.min(minAngleDiff, angleDiff, Math.abs(angleDiff - 2 * Math.PI));
        }

        if (minAngleDiff < Math.PI / 4) { // 45度以内の差を許容
            correctDirections++;
        }
    }

    const directionAccuracy = correctDirections / (userPath.length - 1);
    if (directionAccuracy < directionThreshold) {
        return false;
    }

    // 3. パスの逸脱チェック
    for (const userPoint of userPath) {
        let minDistance = Infinity;
        for (let i = 0; i < stroke.length - 1; i++) {
            const dist = pDistance(userPoint.x, userPoint.y, stroke[i].x, stroke[i].y, stroke[i+1].x, stroke[i+1].y);
            minDistance = Math.min(minDistance, dist);
        }
        if (minDistance > pathThreshold) {
            return false;
        }
    }

    // 4. ストロークのカバー率チェック
    let coveredPoints = 0;
    for (const strokePoint of stroke) {
        let minDistance = Infinity;
        for (let i = 0; i < userPath.length - 1; i++) {
            const dist = pDistance(strokePoint.x, strokePoint.y, userPath[i].x, userPath[i].y, userPath[i+1].x, userPath[i+1].y);
            minDistance = Math.min(minDistance, dist);
        }
        if (minDistance <= pathThreshold) {
            coveredPoints++;
        }
    }

    const coverage = coveredPoints / stroke.length;
    return coverage >= coverageThreshold;
}

// Helper function to calculate distance from a point to a line segment
function pDistance(x, y, x1, y1, x2, y2) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
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
