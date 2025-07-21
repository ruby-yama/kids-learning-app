const startButton = document.getElementById('start-button');
const retryButton = document.getElementById('retry-button');
const startScreen = document.getElementById('start-screen');
const questionScreen = document.getElementById('question-screen');
const rewardScreen = document.getElementById('reward-screen');
const questionContainer = document.getElementById('question-container');
const optionsContainer = document.getElementById('options-container');

let questions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;

startButton.addEventListener('click', startGame);
retryButton.addEventListener('click', startGame);

async function startGame() {
    const response = await fetch('questions.json');
    const allQuestions = await response.json();
    // Shuffle questions and pick 3
    questions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);
    currentQuestionIndex = 0;
    correctAnswers = 0;
    showScreen('question');
    showQuestion();
}

function showQuestion() {
    const question = questions[currentQuestionIndex];
    questionContainer.innerHTML = `<h2>${question.question}</h2>`;
    if (question.question_audio) {
        playAudio(question.question_audio);
    }
    optionsContainer.innerHTML = '';
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option');
        const image = document.createElement('img');
        image.src = option.image;
        image.alt = option.name;
        button.appendChild(image);
        button.addEventListener('click', () => {
            if (option.audio) {
                playAudio(option.audio);
            }
            checkAnswer(option);
        });
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedOption) {
    const question = questions[currentQuestionIndex];
    if (selectedOption.name === question.answer) {
        correctAnswers++;
    }
    currentQuestionIndex++;
    setTimeout(() => {
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showScreen('reward');
        }
    }, 1000); // Wait for audio to play before next question
}

function showScreen(screenName) {
    startScreen.classList.remove('active');
    questionScreen.classList.remove('active');
    rewardScreen.classList.remove('active');
    document.getElementById(`${screenName}-screen`).classList.add('active');
}

function playAudio(src) {
    const audio = new Audio(src);
    audio.play();
}
