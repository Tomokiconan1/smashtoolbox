// =================== WRAP EVERYTHING AFTER DOM IS LOADED ===================
document.addEventListener("DOMContentLoaded", () => {

/***************************************
 * Global Variables
 ***************************************/
let allQuestions = [];
let quizQuestions = [];
let allOOSData = [];
let allShieldAdvantageData = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let questionAnswered = false;
let timerInterval;
let timerDuration = 15;
let timerRemaining = timerDuration;
let selectedCharacter = null;
let isCorrect = null;
let correctCount = 0;
let rank = "";

/***************************************
 * DOM References
 ***************************************/

// Maintenance Screen
const MAINTENANCE_MODE = true; // SWITCH TO TRUE TO CLOSE, FALSE TO OPEN WEBSITE
const stopLog = false; // SWITCH TO TRUE DURING TESTING, FALSE TO ALLOW USER ACTIONS TO BE LOGGED IN GOOGLE SHEETS

if (MAINTENANCE_MODE && !window.location.pathname.includes("maintenance.html")) {
  window.location.href = "/maintenance.html";
}

// Make app read initial route
const params = new URLSearchParams(window.location.search);
const routeFrom404 = params.get("route");

const initialRoute = routeFrom404
  ? normalizePath(routeFrom404)
  : normalizePath(location.pathname);

// User Session ID
const sessionId = crypto.randomUUID();

// Top Banner
const homeLink = document.getElementById("home-link");

// Page Titles
const pageTitles = {
  "home-screen": "Smash Toolbox",
  "ultimate-screen": "Smash Ultimate",
  "start-screen": "Smash Ultimate OOS Quiz Ver 1.0",
  "question-screen": "Smash Ultimate OOS Quiz Ver 1.0",
  "results-screen": "Smash Ultimate OOS Quiz Ver 1.0 Results",
  "explanation-screen": "Smash Ultimate OOS Quiz Ver 1.0 Review",
  "howto-screen": "How to Play - Smash Ultimate OOS Quiz Ver 1.0"
};

// Home Screen
const homeScreen = document.getElementById("home-screen");
const ultimateBtn = document.getElementById("ult-tools-btn");

// Smash Ultimate Tools Screen
const ultimateScreen = document.getElementById("ultimate-screen");
const ultimateOOSQuizBtn = document.getElementById("ult-oosquiz-btn");

// Start Screen
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-quiz-btn");
const checkOOSBtn = document.getElementById("check-oos-frames-btn");
const checkShieldAdvantageBtn = document.getElementById("check-shield-advantage-btn");
const submitFeedbackBtnStart = document.getElementById("submit-feedback-btn-start");
const howtoBtn = document.getElementById("howto-btn");
const characterImages = document.querySelectorAll(".character-img");

// OOS Frame Data Screen
const oosFramesScreen = document.getElementById("oos-frames-screen");
const backToStartBtnOOSData = document.getElementById("back-to-start-oos");

// Shield Advantage Frame Data Screen
const shieldAdvantageScreen = document.getElementById("shield-advantage-screen");
const backToStartBtnShieldAdvantage = document.getElementById("back-to-start-shield-advantage");

// How to Play + Assumptions Screen
const howToPlayScreen = document.getElementById("howto-screen");
const backToStartHowto = document.getElementById("back-to-start-howto");

// Countdown Screen
const countdownScreen = document.getElementById("countdown-screen");
const countdownText = document.getElementById("countdown-text");

// Questions Screen
const questionScreen = document.getElementById("question-screen");
const questionText = document.getElementById("question-text");
const answerButtons = document.querySelectorAll(".answer-btn");
const timerBar = document.getElementById("timer-bar");
const answerFeedback = document.getElementById("answer-feedback");

// Results Screen
const playAgainResultsBtn = document.getElementById("play-again-results");
const resultsScreen = document.getElementById("results-screen");
const resultsSummary = document.getElementById("results-summary");
const viewExplanationsBtn = document.getElementById("view-explanations-btn");
const backToStartResultsBtn = document.getElementById("back-to-start-results");
const shareResultsBtn = document.getElementById("share-results-btn");
const submitFeedbackBtnResults = document.getElementById("submit-feedback-btn-results");
const sharePopup = document.getElementById("share-popup");
const popupCloseBtn = document.getElementById("popup-close");
const popupYesBtn = document.getElementById("popup-yes");
const popupNoBtn = document.getElementById("popup-no");

// Explanations Screen
const explanationScreen = document.getElementById("explanation-screen");
const explanationList = document.getElementById("explanation-list");
const playAgainExplanationBtn = document.getElementById("play-again-explanation");
const backToStartBtnExplanation = document.getElementById("back-to-start-explanation");
const backToResultsBtn = document.getElementById("back-to-results-btn");
const submitFeedbackBtnExplanation = document.getElementById("submit-feedback-btn-explanation");

// How many questions to show per quiz
const QUESTIONS_PER_QUIZ = 10;

// Sounds
const SE = {
  countdown: new Audio("/sounds/countdown.mp3"),
  question: new Audio("/sounds/question.mp3"),
  correct: new Audio("/sounds/correct.mp3"),
  incorrect: new Audio("/sounds/incorrect.mp3"),
};
let audioUnlocked = false;

// Optional: adjust volume for each effect
SE.countdown.volume = 0.55;
SE.question.volume = 0.25;
SE.correct.volume = 0.3;
SE.incorrect.volume = 0.25;

/* ==================== MOBILE AUTOPLAY HANDLING ==================== */

/*
Mobile browsers often block audio from autoplaying until the user interacts with the page.
We "unlock" the audio on first user interaction without playing any sound.
*/
document.addEventListener("click", () => {
  if (audioUnlocked) return; // already unlocked
  audioUnlocked = true;
  Object.values(SE).forEach(audio => {
    // Temporarily mute, play and immediately pause to unlock
    audio.muted = true;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => audio.pause())
        .catch(() => audio.pause()); // ignore any errors
    }
    audio.currentTime = 0; // reset to start
    audio.muted = false;    // restore muted state
  });
}, { once: true }); // run only once on the first click/tap

/***************************************
 * Load Questions CSV Automatically on Page Load
 ***************************************/
async function loadQuestionsCSV() {
  try {
    // Fetch the CSV file from your project
    const responseQuestions = await fetch("data/questions.csv");

    // Convert the response into text
    const csvTextQuestions = await responseQuestions.text();

    // Parse CSV into question objects
    allQuestions = parseQuestionsCSV(csvTextQuestions);

    console.log("CSV loaded automatically:", allQuestions);

  } catch (error) {
    console.error("Failed to load CSV:", error);
    // alert("Failed to load quiz data.");
  }
}

/***************************************
 * Load Character OOS Frames CSV Automatically on Page Load
 ***************************************/
async function loadCharacterOOSFramesCSV() {
  try {
    // Fetch the CSV file from your project
    const responseOOSData = await fetch("data/oosdata.csv");

    // Convert the response into text
    const csvTextOOSData = await responseOOSData.text();

    // Parse CSV into question objects
    allOOSData = parseOOSCSV(csvTextOOSData);

    console.log("CSV loaded automatically:", allOOSData);

  } catch (error) {
    console.error("Failed to load CSV:", error);
    // alert("Failed to load OOS data.");
  }
}

/***************************************
 * Load Character Shield Advantage CSV Automatically on Page Load
 ***************************************/
async function loadCharacterShieldAdvantageCSV() {
  try {
    // Fetch the CSV file from your project
    const responseShieldAdvantageData = await fetch("data/shieldadvantage.csv");

    // Convert the response into text
    const csvTextShieldAdvantageData = await responseShieldAdvantageData.text();

    // Parse CSV into question objects
    allShieldAdvantageData = parseShieldAdvantageCSV(csvTextShieldAdvantageData);

    console.log("CSV loaded automatically:", allShieldAdvantageData);

  } catch (error) {
    console.error("Failed to load CSV:", error);
    // alert("Failed to load Shield Advantage data.");
  }
}

/**
 * parseQuestionsCSV
 * Converts Questions CSV text into an array of objects
 *
 * @param {string} csvText - The entire CSV file as a string
 * @returns {Array} Array of question objects
 */
function parseQuestionsCSV(csvText) {
  // 1️⃣ Split CSV text into individual lines
  // trim() removes extra whitespace at start/end of file
  const lines = csvText.trim().split("\n");

  if (lines.length < 2) {
    console.warn("CSV has no data rows!");
    return [];
  }

  // 2️⃣ Extract headers from the first line
  const headers = lines[0].split(",").map(h => h.trim());

  const questions = [];

  // 3️⃣ Loop through all data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines (no data)
    if (!line) continue;

    // Split line into values
    const values = line.split(",").map(v => v.trim());

    // 4️⃣ Create a row object mapping header => value
    const row = {};
    headers.forEach((header, index) => {
      // If value is missing, default to empty string
      row[header] = values[index] !== undefined ? values[index] : "";
    });

    // 5️⃣ Skip row if shieldcharacter is missing
    if (!row.shieldcharacter) continue;

    // 6️⃣ Convert the row into a question object
    const question = {
      shieldCharacter: row.shieldcharacter,
      attackCharacter: row.attackcharacter,
      moveHitbox: row.movehitbox,
      charMoveHitbox: row.charmovehitbox,
      shieldAdvantage: row.shieldadvantage,

      // Choices stored as array [A, B, C, D]
      choices: [row.choiceA, row.choiceB, row.choiceC, row.choiceD],

      // Convert correctchoice letter (A-D) to index (0-3)
      // If missing or invalid, set to null
      correctIndex: row.correctchoice && /^[A-D]$/i.test(row.correctchoice)
        ? row.correctchoice.toUpperCase().charCodeAt(0) - 65
        : null,

      correctText: row.correct || "",
      explanation: row.explanation || ""
    };

    questions.push(question);
  }

  console.log(`Parsed ${questions.length} questions from CSV.`);
  return questions;
}

/**
 * parseOOSCSV
 * Converts Out of Shield CSV text into an array of objects
 *
 * @param {string} csvText - The entire CSV file as a string
 * @returns {Array} Array of question objects
 */
function parseOOSCSV(csvText) {
  // 1️⃣ Split CSV text into individual lines
  // trim() removes extra whitespace at start/end of file
  const lines = csvText.trim().split("\n");

  if (lines.length < 2) {
    console.warn("CSV has no data rows!");
    return [];
  }

  // 2️⃣ Extract headers from the first line
  const headers = lines[0].split(",").map(h => h.trim());

  const oosData = [];

  // 3️⃣ Loop through all data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines (no data)
    if (!line) continue;

    // Split line into values
    const values = line.split(",").map(v => v.trim());

    // 4️⃣ Create a row object mapping header => value
    const row = {};
    headers.forEach((header, index) => {
      // If value is missing, default to empty string
      row[header] = values[index] !== undefined ? values[index] : "";
    });

    // 5️⃣ Skip row if shieldcharacter is missing
    if (!row.character) continue;

    // 6️⃣ Convert the row into a oos data object
    const oosDataObject = {
      character: row.character,
      move: row.move,
      startupframe: row.startupframe
    };

    oosData.push(oosDataObject);
  }

  console.log(`Parsed ${oosData.length} rows from CSV.`);
  return oosData;
}

/**
 * parseShieldAdvantageCSV
 * Converts Shield Advantage CSV text into an array of objects
 *
 * @param {string} csvText - The entire CSV file as a string
 * @returns {Array} Array of question objects
 */
function parseShieldAdvantageCSV(csvText) {
  // 1️⃣ Split CSV text into individual lines
  // trim() removes extra whitespace at start/end of file
  const lines = csvText.trim().split("\n");

  if (lines.length < 2) {
    console.warn("CSV has no data rows!");
    return [];
  }

  // 2️⃣ Extract headers from the first line
  // Normalize headers
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  console.log("Shield Advantage Headers:", headers);

  const shieldAdvantageData = [];

  // 3️⃣ Loop through all data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines (no data)
    if (!line) continue;

    // Split line into values
    const values = line.split(",").map(v => v.trim());

    // 4️⃣ Create a row object mapping header => value
    const row = {};
    headers.forEach((header, index) => {
      // If value is missing, default to empty string
      row[header] = values[index] !== undefined ? values[index] : "";
    });

    // 5️⃣ Skip row if shieldcharacter is missing
    if (!row.character) continue;

    // 6️⃣ Convert the row into a shield advantage data object
    const shieldAdvantageDataObject = {
      character: row.character,
      movehitbox: row.movehitbox,
      shieldadvantage: row.shieldadvantage
    };

    shieldAdvantageData.push(shieldAdvantageDataObject);
  }

  console.log(`Parsed ${shieldAdvantageData.length} rows from CSV.`);
  return shieldAdvantageData;
}

// Router functions
function normalizePath(path) {
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
}

function navigateTo(path) {
  path = normalizePath(path);
  // Push the new URL to the browser's address bar
  history.pushState({}, "", path);

  // Show the screen associated with this route
  showScreenForRoute(path);

  // Log site access
  logEvent("site_access", { link: path });
}

function showScreenForRoute(path) {
  path = normalizePath(path);

  // Go back to start screen if quiz was not loaded beforehand
  const needsQuizState = [
    "/ultimate/oosquiz/question",
    "/ultimate/oosquiz/results",
    "/ultimate/oosquiz/explanation"
  ];

  if (needsQuizState.includes(path) && quizQuestions.length === 0) {
    navigateTo("/ultimate/oosquiz");
    return;
  }

  // Find the screen element with matching data-route
  const screen = document.querySelector(`.screen[data-route="${path}"]`);

  if (!screen) {
    console.warn("No screen for route:", path);
    showScreen(document.getElementById("home-screen"));
    history.replaceState({}, "", "/");
    return;
  }


  setPageTitle(screen.id);

  // Use your existing function to show/hide screens
  showScreen(screen);
}

// Handle browser back/forward buttons
window.addEventListener("popstate", () => {
  showScreenForRoute(normalizePath(location.pathname));
});


/***************************************
 * Show oosFrames Screen
 ***************************************/
function showOOSFramesScreen() {
  /* Selected Character Image */
  const oosFramesCharImg = document.getElementById("oos-frames-character-img");
  const oosFramesCharImgLabel = document.getElementById("oos-frames-character-img-label");
  const oosFramesList = document.getElementById("oos-frames-list");
  // Set image path dynamically based on selected character
  oosFramesCharImg.src = `/images/${selectedCharacter.replace(/\s+/g, "")}1.png`;
  oosFramesCharImg.alt = selectedCharacter;
  oosFramesCharImgLabel.textContent = selectedCharacter;
  // Clear old table (important!)
  oosFramesList.innerHTML = "";

  // Build table
  const table = buildOOSTable();

  // Append table to screen
  oosFramesList.appendChild(table);

  navigateTo("/ultimate/oosquiz/oosframes");
}

/***************************************
 * Generate OOS Frames List (Table)
 ***************************************/
function buildOOSTable() {
  // Filter rows for selected character
  const filtered = allOOSData.filter(q =>
    q.character.toLowerCase() === selectedCharacter.toLowerCase()
  );

  // Create table
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';

  // Create header row
  const headerRow = document.createElement('tr');
  ['Move/Hitbox', 'Startup Frame'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    th.style.border = '1px solid #aaa';
    th.style.padding = '6px 10px';
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Create data rows
  filtered.forEach(q => {
    const tr = document.createElement('tr');

    [q.move, q.startupframe].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      td.style.border = '1px solid #aaa';
      td.style.padding = '6px 10px';
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  return table;
}

/***************************************
 * Show shieldAdvantage Screen
 ***************************************/
function showShieldAdvantageScreen() {
  /* Selected Character Image */
  const shieldAdvantageCharImg = document.getElementById("shield-advantage-character-img");
  const shieldAdvantageCharImgLabel = document.getElementById("shield-advantage-character-img-label");
  const shieldAdvantageList = document.getElementById("shield-advantage-list");
  // Set image path dynamically based on selected character
  shieldAdvantageCharImg.src = `/images/${selectedCharacter.replace(/\s+/g, "")}1.png`;
  shieldAdvantageCharImg.alt = selectedCharacter;
  shieldAdvantageCharImgLabel.textContent = selectedCharacter;
  // Clear old table (important!)
  shieldAdvantageList.innerHTML = "";

  // Build table
  const table = buildShieldAdvantageTable();

  // Append table to screen
  shieldAdvantageList.appendChild(table);

  navigateTo("/ultimate/oosquiz/shieldadvantage");
}

/***************************************
 * Generate Shield Advantage List (Table)
 ***************************************/
function buildShieldAdvantageTable() {
  // Filter rows for selected character
  const filtered = allShieldAdvantageData.filter(q =>
    q.character.toLowerCase() === selectedCharacter.toLowerCase()
  );

  // Create table
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';

  // Create header row
  const headerRow = document.createElement('tr');
  ['Move/Hitbox', 'Shield Advantage'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    th.style.border = '1px solid #aaa';
    th.style.padding = '6px 10px';
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Create data rows
  filtered.forEach(q => {
    const tr = document.createElement('tr');

    [q.movehitbox, q.shieldadvantage].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      td.style.border = '1px solid #aaa';
      td.style.padding = '6px 10px';
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  return table;
}

/**
 * getRandomQuestions
 * Returns a new array with X random, non-duplicate questions
 *
 * @param {Array} questions - Full question pool
 * @param {number} count - Number of questions to select
 * @returns {Array} Randomized subset of questions
 */
function getRandomQuestions(questions, count) {
  // Create a shallow copy so original array is not modified
  const shuffled = [...questions];

  // Fisher–Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Return only the first `count` items
  return shuffled.slice(0, count);
}

/**
 * Start Countdown
 * Shows a 3 → 2 → 1 → GO! countdown,
 * then calls the provided callback.
 *
 * @param {Function} onComplete - Function to run after countdown
 */
function startCountdown(onComplete) {
  const steps = ["3", "2", "1", "GO!"];
  let index = 0;

  navigateTo("/ultimate/oosquiz/countdown");

  playCountdownSE();

  /* Countdown text */
  countdownText.textContent = steps[index];

  const interval = setInterval(() => {
    index++;

    if (index >= steps.length) {
      clearInterval(interval);
      onComplete();
      return;
    }

    countdownText.textContent = steps[index];
  }, 1000);
}

function playCountdownSE() {
  // Play the countdown 3-2-1-GO audio
  if (SE.countdown) {
    SE.countdown.currentTime = 0.4; // start from beginning
    SE.countdown.play().catch(err => console.warn("Countdown SE failed:", err));
  }
}

/***************************************
 * Show Question Screen
 ***************************************/
function showQuestion() {
  questionAnswered = false;

  // Question number
  const counterEl = document.getElementById("question-counter");
  counterEl.textContent = `Question ${currentQuestionIndex + 1} / ${quizQuestions.length}`;

  // Sounds
  SE.question.currentTime = 0;
  SE.question.play();

  // Reset all buttons to full opacity and remove old marks
  answerButtons.forEach(button => {
    button.style.opacity = "1";          // fully visible
    button.classList.remove("incorrect"); // remove any dimming
    const oldMark = button.querySelector(".mark");
    if (oldMark) button.removeChild(oldMark); // remove previous check/X marks
  });


  answerFeedback.textContent = "";

  answerButtons.forEach(button => {
    button.disabled = false;
  });

  const q = quizQuestions[currentQuestionIndex];

  questionText.innerHTML = `
    <strong>${q.charMoveHitbox}</strong><br>
  `;

  answerButtons.forEach((button, index) => {
    button.textContent = q.choices[index];
  });

  resetTimerBarInstant();
  startTimer(timerDuration);

  navigateTo("/ultimate/oosquiz/question");

}

/***************************************
 * Event Listeners (Buttons)
 ***************************************/
// Go back to home from top banner link
homeLink.addEventListener("click", (e) => {
  e.preventDefault();
  navigateTo("/");
});

// Start Quiz
startBtn.addEventListener("click", () => {
  // Record action
  logEvent("button_click", { button: "start_quiz" });

  if (!selectedCharacter) {
  alert("Please select a character first!");
  return;
  }

  const characterQuestions = allQuestions.filter(q =>
    q.shieldCharacter.trim().toLowerCase() ===
    selectedCharacter.trim().toLowerCase()
  );

  if (characterQuestions.length === 0) {
    console.error("No questions matched for:", selectedCharacter);
  }

  quizQuestions = getRandomQuestions(
    characterQuestions,
    Math.min(QUESTIONS_PER_QUIZ, characterQuestions.length)
  );

  // Check questions/choices being used
  console.group("📋 Quiz Questions Loaded");

  quizQuestions.forEach((q, i) => {
    console.log(`Question ${i + 1}`);
    console.log("Shield Character:", q.shieldCharacter);
    console.log("Prompt:", q.charMoveHitbox);
    console.log("Choices:", q.choices);
    console.log("Correct:", q.correctText);
    console.log("-----------------------");
  });

  console.groupEnd();

  // Check if any questions were found
  if (quizQuestions.length === 0) {
    alert("No questions found for this character!");
    return;
  }

  userAnswers = new Array(quizQuestions.length).fill(null);
  currentQuestionIndex = 0;
  correctCount = 0;
  startCountdown(() => {
    showQuestion();
  });
});

ultimateBtn.addEventListener("click", () => {
  logEvent("button_click", { button: "select_game_ultimate" });
  navigateTo("/ultimate");
});

ultimateOOSQuizBtn.addEventListener("click", () => {
  logEvent("button_click", { button: "select_tool_ultimateoosquiz" });
  navigateTo("/ultimate/oosquiz");
});

characterImages.forEach(img => {
  img.addEventListener("click", () => {
    // Clear previous selection
    characterImages.forEach(i => i.classList.remove("selected"));

    // Mark this image as selected
    img.classList.add("selected");

    // Store character name from data attribute
    selectedCharacter = img.dataset.character;

    // Enable the start, check oos frame data, and check shield advantage buttons
    startBtn.disabled = false;
    checkOOSBtn.disabled = false;
    checkShieldAdvantageBtn.disabled = false;
  });
});

checkOOSBtn.addEventListener("click", () => {
  logEvent("button_click", { button: "check_oos" });
  showOOSFramesScreen();
});

backToStartBtnOOSData.addEventListener("click", () => {
  logEvent("button_click", { button: "back_to_start_oos" });
  navigateTo("/ultimate/oosquiz");
});

answerButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (questionAnswered) return;
      questionAnswered = true;

      userAnswers[currentQuestionIndex] = index;
      handleAnswer(index);
    });
  });

checkShieldAdvantageBtn.addEventListener("click", () => {
  logEvent("button_click", { button: "check_shield_advantage" });
  showShieldAdvantageScreen();
});

backToStartBtnShieldAdvantage.addEventListener("click", () => {
  logEvent("button_click", { button: "back_to_start_shield_advantage" });
  navigateTo("/ultimate/oosquiz");
});

howtoBtn.addEventListener("click", () => {
  logEvent("button_click", { button: "howtoplay" });
  navigateTo("/ultimate/oosquiz/howto");
});

backToStartHowto.addEventListener("click", () => {
  logEvent("button_click", { button: "back_to_start_howtoplay" });
  navigateTo("/ultimate/oosquiz");
});

viewExplanationsBtn.addEventListener("click", () => {
  logEvent("button_click", { button: "view_explanation" });
  showExplanationScreen();
});

backToResultsBtn.addEventListener("click", () => {
  logEvent("button_click", { button: "back_to_results_explanation" });
  showResultsScreen();
});

backToStartResultsBtn.addEventListener("click", () => {
  logEvent("button_click", { button: "back_to_start_results" });
  navigateTo("/ultimate/oosquiz");
});

shareResultsBtn.addEventListener("click", async () => {
  // Record user action
  logEvent("button_click", { button: "share_results" });

  // Build the message as a normal JS string
  const shareText =
    `I got ${correctCount} / ${quizQuestions.length} correct on the Smash Ultimate OOS Quiz for ${selectedCharacter.toUpperCase()}!`;

  // Add site URL
  const siteURL = "https://smashtoolbox.com"; // CHANGE THIS later

  // Full text
  const fullText = `${shareText}\nRank: ${rank}\nSee if you can beat my score: ${siteURL}\n#SmashUltimate #SmashToolbox`;

  // 📱 MOBILE: native share
  if (navigator.canShare && navigator.canShare({ files: [] })) {
    try {
      const canvas = await captureResultsImage();
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      const file = new File([blob], "results.png", { type: "image/png" });

      await navigator.share({
        files: [file],
        text: fullText
      });

      return; // stop here
    } catch (err) {
      console.error("Native share failed:", err);
      openTwitter(fullText);
      return;
    }
  }
  // 🖥 PC → show styled popup
  else {
    sharePopup.classList.remove("hidden");

    popupCloseBtn.onclick = () => {
      logEvent("button_click", { button: "cancel_share_results" });
      sharePopup.classList.add("hidden");
    };

    popupYesBtn.onclick = async () => {
      logEvent("button_click", { button: "download_results_screenshot" });
      sharePopup.classList.add("hidden");
      const canvas = await captureResultsImage();
      downloadCanvasImage(canvas);
      openTwitter(fullText);
    };

    popupNoBtn.onclick = () => {
      logEvent("button_click", { button: "no_download_results_screenshot" });
      sharePopup.classList.add("hidden");
      openTwitter(fullText);
    };
  }
});

/* Retry Buttons */
// START BACK HERE
playAgainResultsBtn.addEventListener("click", () => {
  logEvent("button_click",{ button: "play_again_results" });
  restartQuizSameCharacter();
});
playAgainExplanationBtn.addEventListener("click", () => {
  logEvent("button_click",{ button: "play_again_explanation" });
  restartQuizSameCharacter();
});

/* Submit Feedback Buttons */
submitFeedbackBtnStart.addEventListener("click", () => {
  logEvent("button_click",{ button: "feedback_form_start" });
  submitFeedback();
});
submitFeedbackBtnResults.addEventListener("click", () => {
  logEvent("button_click",{ button: "feedback_form_results" });
  submitFeedback();
});
submitFeedbackBtnExplanation.addEventListener("click", () => {
  logEvent("button_click",{ button: "feedback_form_explanation" });
  submitFeedback();
});

// Back to Start from Explanation Screen
backToStartBtnExplanation.addEventListener("click", () => {
  logEvent("button_click",{ button: "back_to_start_explanation" });
  navigateTo("/ultimate/oosquiz");
});

/***************************************
 * Handle Answer
 ***************************************/
function handleAnswer(index) {
  if (index === null) {
  answerFeedback.textContent = "⏱ Time up!";
  SE.incorrect.play();
  setTimeout(nextQuestion, 1000);
  return;
  }

  stopTimer();
  disableAnswerButtons();

  const q = quizQuestions[currentQuestionIndex];
  const clickedIndex = index; // null if time up

  answerButtons.forEach((button,i) => {
    // Remove existing marks
    const oldMark = button.querySelector(".mark");
    if (oldMark) button.removeChild(oldMark);

    // Add check or X
    const mark = document.createElement("span");
    mark.classList.add("mark");

    if (q.choices[i] === q.correctText) {
      mark.textContent = "✅";
      button.appendChild(mark);
      
    } else if (q.choices[clickedIndex] !== q.correctText && q.choices[i] === q.choices[clickedIndex]) {
      // User clicked wrong answer → add ❌
      mark.textContent = "❌";
      button.appendChild(mark);
    }

    // dim all except correct one
    if (q.choices[i] !== q.correctText) {
      button.style.opacity = "0.5";
    } else {
      button.style.opacity = "1";
    }
    });

  checkAnswer(index);

  setTimeout(nextQuestion, 1000);
}

function nextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex >= quizQuestions.length) {
    showResultsScreen();
    return;
  }

  showQuestion();
}

function checkAnswer(index) {
  const q = quizQuestions[currentQuestionIndex];

  if (q.choices[index] === q.correctText) {
    answerFeedback.textContent = "✅ Correct!";
    SE.correct.play(); /* Plays correct sound effect */
    answerFeedback.classList.add("correct");
    correctCount++;
  } else {
    answerFeedback.textContent = "❌ Incorrect";
    SE.incorrect.play(); /* Plays incorrect sound effect */
    answerFeedback.classList.add("incorrect");
  }
}

/***************************************
 * Disable Answer Buttons
 ***************************************/
function disableAnswerButtons() {
  answerButtons.forEach(button => {
    button.disabled = true;
  });
}

/***************************************
 * Show Results Screen
 ***************************************/
function showResultsScreen() {
  logEvent("quiz_complete", {
    character: selectedCharacter,
    score: `${correctCount}/${quizQuestions.length}`
  });
  getRank(correctCount, quizQuestions.length);

  resultsSummary.innerHTML =
    `You got <strong>${correctCount} / ${quizQuestions.length}</strong> correct.<br>
    Rank: <strong>${rank}</strong>`;

  /* Selected Character Image */
  const resultsImg = document.getElementById("results-character-img");
  const resultsImgLabel = document.getElementById("results-character-img-label");
  // Set image path dynamically based on selected character
  resultsImg.src = `/images/${selectedCharacter.replace(/\s+/g, "")}1.png`;
  resultsImg.alt = selectedCharacter;
  resultsImgLabel.textContent = selectedCharacter;

  navigateTo("/ultimate/oosquiz/results");
}

function getRank(score, total) {
  // Reset rank
  rank = "";

  const percent = score / total;

  // Set rank based on correctCount
  if (percent === 0) {
    rank = "CASUAL";
  } else if (percent <= 0.3) {
    rank = "BEGINNER";
  } else if (percent <= 0.5) {
    rank = "AVERAGE";
  } else if (percent <= 0.7) {
    rank = "SUB-ELITE";
  } else if (percent <= 0.9) {
    rank = "ELITE";
  } else if (percent === 1) {
    rank = "SAKURAI";
  } else {
    console.error("Failed to obtain rank");
  };
}

/***************************************
 * Show Explanation Screen
 ***************************************/
function showExplanationScreen() {
  explanationList.innerHTML = "";

  quizQuestions.forEach((q, index) => {
    const userIndex = userAnswers[index];
    const userText =
      userIndex !== null && userIndex !== undefined
        ? q.choices[userIndex]
        : "No answer";

    const div = document.createElement("div");
    div.className = "explanation-block";

    if (userText === q.correctText) {
      isCorrect = "✅";
    }
    else {
      isCorrect = "❌";
    }

    div.innerHTML = `
      <p><strong>${isCorrect}Question ${index + 1}: ${q.charMoveHitbox}</strong></p>
      <p>Your answer: ${userText}</p>
      <p>Correct answer: ${q.correctText}</p>
      <p>${q.explanation}</p>
    `;

    explanationList.appendChild(div);
  });

  navigateTo("/ultimate/oosquiz/explanation");
}

/***************************************
 * Screen Switcher
 ***************************************/
function showScreen(screen) {
  if (!screen) {
    console.error("showScreen() called with null/undefined");
    return;
  }

  // Scroll the window to top
  window.scrollTo(0, 0);

  // Also reset internal scroll if screen itself scrolls
  screen.scrollTop = 0;

  setPageTitle(screen.id);

  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

/***************************************
 * Timer Functions
 ***************************************/
function startTimer(duration) {
  stopTimer();
  timerRemaining = duration;
  timerBar.style.width = "100%";

  timerInterval = setInterval(() => {
    timerRemaining -= 0.05;

    if (timerRemaining <= 0) {
      userAnswers[currentQuestionIndex] = null;
      handleAnswer(null);
      return;
    }

    const percent = timerRemaining / duration;
    timerBar.style.width = `${percent * 100}%`;

    if (percent > 0.7) timerBar.style.backgroundColor = "#4CAF50";
    else if (percent > 0.3) timerBar.style.backgroundColor = "#FFEB3B";
    else timerBar.style.backgroundColor = "#F44336";
  }, 50);
}

function resetTimerBarInstant() {
  timerBar.style.transition = "none";
  timerBar.style.width = "100%";
  timerBar.style.backgroundColor = "#4CAF50";
  timerBar.getBoundingClientRect();
  timerBar.style.transition = "width 0.05s linear, background-color 0.05s linear";
}

function stopTimer() {
  // If a timer interval is currently running, stop it
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Optional but recommended: freeze remaining time
  // (prevents leftover logic from acting on stale values)
  timerRemaining = null;
}

/**
 * restartQuizSameCharacter
 * Resets quiz state and restarts with the same character
 */
function restartQuizSameCharacter() {
  if (!selectedCharacter) return;

  const characterQuestions = allQuestions.filter(q =>
    q.shieldCharacter.trim().toLowerCase() ===
    selectedCharacter.trim().toLowerCase()
  );

  quizQuestions = getRandomQuestions(
    characterQuestions,
    Math.min(QUESTIONS_PER_QUIZ, characterQuestions.length)
  );

  // Check questions/choices being used
  console.group("📋 Quiz Questions Loaded");

  quizQuestions.forEach((q, i) => {
    console.log(`Question ${i + 1}`);
    console.log("Shield Character:", q.shieldCharacter);
    console.log("Prompt:", q.charMoveHitbox);
    console.log("Choices:", q.choices);
    console.log("Correct:", q.correctText);
    console.log("-----------------------");
  });

  console.groupEnd();
  

  userAnswers = new Array(quizQuestions.length).fill(null);
  currentQuestionIndex = 0;

  correctCount = 0;

  startCountdown(() => {
    showQuestion();
  });
}

/* X Share Button functions */

async function captureResultsImage() {
  const resultsElement = document.getElementById("results-content");
  const charImg = document.getElementById("results-character-img");
  const buttons = document.getElementById("results-buttons");

  // Add capture only styles
  charImg.classList.add("capture-char-border");
  buttons.classList.add("capture-hide");

  const canvas = await html2canvas(resultsElement, {
    backgroundColor: "#f0e8d0",
    scale: 2
  });

  // Remove after capture
  charImg.classList.remove("capture-char-border");
  buttons.classList.remove("capture-hide");

  return canvas;
}

function downloadCanvasImage(canvas) {
  const link = document.createElement("a");
  link.download = "smash-oos-results.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function openTwitter(text) {
  const encodedText = encodeURIComponent(text);
  const twitterURL = `https://twitter.com/intent/tweet?text=${encodedText}`;
  window.open(twitterURL, "_blank");
}

/* Submit Feedback Button Function */
function submitFeedback() {
  window.open('https://forms.gle/cvs1Mvav7rUHHmxV6',"_blank");
}

/* Log User Actions and Quiz Scores */
function logEvent(eventType, data = {}) {
  // Skip logging during maintenance
  if (stopLog) return;

  fetch("https://script.google.com/macros/s/AKfycbyYHjEqZeZDhEcAyUpdoY24Rby7C9OblpO7aa9qaxdiMGqn7-6wS3LrmT_qZ9aQ_x6KlQ/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: new URLSearchParams({
      sessionId: sessionId,
      eventType: eventType,
      link: data.link || "",
      button: data.button || "",
      character: data.character || "",
      score: data.score || ""
    })
  }).catch(err => console.error("Logging failed", err));
}

// Set Page Title
function setPageTitle(screenId) {
  if (pageTitles[screenId]) {
    document.title = pageTitles[screenId];
  } else {
    document.title = "Smash Toolbox"; // fallback
  }
}

// DOM refs
// functions
loadQuestionsCSV();
loadCharacterOOSFramesCSV();
loadCharacterShieldAdvantageCSV();

// When the page loads, display the screen corresponding to the URL
showScreenForRoute(initialRoute);

// Log first page access
logEvent("site_access", { link: initialRoute });

}); // End DOMContentLoaded