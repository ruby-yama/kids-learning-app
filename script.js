
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
        const gameType = e.target.dataset.gameType;
        startGame(gameType);
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
        showScreen('maze');
        const canvas = document.getElementById('maze-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "20px sans-serif";
        ctx.fillText("めいろゲームはまだ作られていません。", 50, 50);
    }
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}-screen`).classList.add('active');
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
            image.src = option.image;
            image.alt = option.name;
            button.appendChild(image);
        } else {
            button.textContent = option.name;
            button.style.fontSize = '32px'; // Make text options bigger
        }
        button.addEventListener('click', () => {
            if (option.audio) {
                playAudio(option.audio);
            }
            optionsContainer.querySelectorAll('.option').forEach(btn => btn.disabled = true);
            checkAnswer(option);
        });
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedOption) {
    const question = currentQuestions[currentQuestionIndex];
    if (selectedOption.name === question.answer) {
        correctAnswers++;
    }
    currentQuestionIndex++;
    setTimeout(() => {
        if (currentQuestionIndex < currentQuestions.length) {
            showQuestion();
        } else {
            showScreen('reward');
        }
    }, 1000);
}


// --- Line Drawing Game ---

function initLineDrawingGame(question) {
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

lineDrawingCanvas.addEventListener('click', (e) => {
    if (!lineDrawingScreen.classList.contains('active')) return;

    const rect = lineDrawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedItem = getClickedItem(x, y);

    if (clickedItem) {
        if (!lineDrawingState.selectedItem) {
            lineDrawingState.selectedItem = clickedItem;
        } else {
            if (clickedItem.id === lineDrawingState.selectedItem.matchId) {
                clickedItem.matched = true;
                lineDrawingState.selectedItem.matched = true;
                lineDrawingState.lines.push({ start: lineDrawingState.selectedItem, end: clickedItem });
                playAudio('assets/sounds/correct.mp3'); // Placeholder for correct sound
                lineDrawingState.selectedItem = null;

                if (lineDrawingState.lines.length === lineDrawingState.items.length / 2) {
                    setTimeout(() => showScreen('reward'), 800);
                }
            } else {
                playAudio('assets/sounds/incorrect.mp3'); // Placeholder for incorrect sound
                lineDrawingState.selectedItem = null;
            }
        }
        drawLineDrawingBoard();
    }
});
