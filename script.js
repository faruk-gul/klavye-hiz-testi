const WORD_POOL = [
  "adalet", "ağaç", "akıl", "antrenman", "aralık", "aşk", "başarı", "bilgi",
  "çalışma", "cesaret", "dakika", "defter", "denge", "deniz", "dikkat", "doğa",
  "doğru", "düzen", "ekran", "emek", "enerji", "fikir", "gelişim", "görev",
  "güçlü", "hafıza", "hayal", "hedef", "hız", "irade", "ışık", "kabiliyet",
  "kalem", "kamera", "kelime", "kitap", "konu", "kulak", "mantık", "masa",
  "merak", "metin", "motivasyon", "nokta", "odak", "öğrenme", "oyun", "parmak",
  "plan", "refleks", "ritim", "saat", "sabır", "sayfa", "seviye", "süre",
  "tekrar", "temiz", "türkçe", "uyum", "veri", "vites", "yazı", "yıldız",
  "yol", "yorum", "zaman", "zeka", "zihin"
];

const WORD_COUNT = 70;
const WORD_BUFFER_THRESHOLD = 20;
const WORD_APPEND_COUNT = 40;

const textDisplay = document.getElementById("text-display");
const typingInput = document.getElementById("typing-input");
const timeLeftElement = document.getElementById("time-left");
const wpmElement = document.getElementById("wpm");
const accuracyElement = document.getElementById("accuracy");
const correctWordsElement = document.getElementById("correct-words");
const resultText = document.getElementById("result-text");
const restartButton = document.getElementById("restart-button");
const durationSelect = document.getElementById("duration-select");

let words = [];
let timerId = null;
let selectedDuration = Number(durationSelect.value);
let timeLeft = selectedDuration;
let isStarted = false;

function shuffleWords(count) {
  return Array.from({ length: count }, () => {
    const index = Math.floor(Math.random() * WORD_POOL.length);
    return WORD_POOL[index];
  });
}

function renderWords() {
  textDisplay.innerHTML = words
    .map((word, wordIndex) => {
      const chars = word
        .split("")
        .map(
          (char, charIndex) =>
            `<span class="char" data-word-index="${wordIndex}" data-char-index="${charIndex}">${char}</span>`
        )
        .join("");

      return `<span class="word" data-word="${wordIndex}">${chars}</span>`;
    })
    .join("");
}

function ensureWordBuffer(currentWordIndex) {
  if (currentWordIndex < words.length - WORD_BUFFER_THRESHOLD) {
    return;
  }

  words = [...words, ...shuffleWords(WORD_APPEND_COUNT)];
  renderWords();
}

function resetTest() {
  words = shuffleWords(WORD_COUNT);
  selectedDuration = Number(durationSelect.value);
  timeLeft = selectedDuration;
  isStarted = false;
  clearInterval(timerId);
  timerId = null;

  renderWords();
  typingInput.value = "";
  typingInput.disabled = false;
  timeLeftElement.textContent = `${timeLeft} sn`;
  wpmElement.textContent = "0";
  accuracyElement.textContent = "100%";
  correctWordsElement.textContent = "0";
  resultText.textContent =
    `${selectedDuration} saniyelik testte kaç kelime yazabildiğini ve ne kadar isabetli olduğunu burada göreceksin.`;

  updateHighlight();
  typingInput.focus();
}

function startTimer() {
  if (isStarted) {
    return;
  }

  isStarted = true;
  timerId = window.setInterval(() => {
    timeLeft -= 1;
    timeLeftElement.textContent = `${timeLeft} sn`;
    updateStats();

    if (timeLeft <= 0) {
      finishTest();
    }
  }, 1000);
}

function finishTest() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = 0;
  timeLeftElement.textContent = "0 sn";
  typingInput.disabled = true;
  updateStats();

  const { wpm, accuracy, correctWords, typedWords } = calculateStats();
  resultText.textContent = `Süre bitti. ${typedWords} kelime denedin, ${correctWords} tanesi doğru. Ortalama hız ${wpm} WPM, doğruluk oranı %${accuracy}.`;
}

function calculateStats() {
  const typedValue = typingInput.value.trim();
  const typedWords = typedValue ? typedValue.split(/\s+/) : [];
  const elapsedSeconds = selectedDuration - timeLeft;
  const elapsedMinutes = Math.max(elapsedSeconds / 60, 1 / 60);

  let correctChars = 0;
  let totalTypedChars = typingInput.value.replace(/\s/g, "").length;
  let correctWords = 0;

  typedWords.forEach((typedWord, index) => {
    const targetWord = words[index] || "";

    if (typedWord === targetWord) {
      correctWords += 1;
    }

    for (let i = 0; i < typedWord.length; i += 1) {
      if (typedWord[i] === targetWord[i]) {
        correctChars += 1;
      }
    }
  });

  const wpm = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
  const accuracy = totalTypedChars === 0 ? 100 : Math.round((correctChars / totalTypedChars) * 100);

  return {
    wpm,
    accuracy,
    correctWords,
    typedWords: typedWords.length,
  };
}

function updateStats() {
  const { wpm, accuracy, correctWords } = calculateStats();
  wpmElement.textContent = String(wpm);
  accuracyElement.textContent = `${accuracy}%`;
  correctWordsElement.textContent = String(correctWords);
}

function updateHighlight() {
  const inputWords = typingInput.value.split(" ");
  const currentWordIndex = Math.max(0, inputWords.length - 1);
  ensureWordBuffer(currentWordIndex);
  const allWordNodes = textDisplay.querySelectorAll(".word");
  const allCharNodes = textDisplay.querySelectorAll(".char");

  allWordNodes.forEach((node) => {
    node.classList.remove("active", "completed");
  });

  allCharNodes.forEach((node) => {
    node.classList.remove("correct", "incorrect", "current");
  });

  words.forEach((word, wordIndex) => {
    const typedWord = inputWords[wordIndex] ?? "";
    const isCurrentWord = wordIndex === inputWords.length - 1;
    const wordNode = textDisplay.querySelector(`[data-word="${wordIndex}"]`);

    if (!wordNode) {
      return;
    }

    if (typedWord.length > 0 && wordIndex < inputWords.length - 1) {
      wordNode.classList.add("completed");
    }

    if (isCurrentWord) {
      wordNode.classList.add("active");
    }

    word.split("").forEach((char, charIndex) => {
      const charNode = textDisplay.querySelector(
        `[data-word-index="${wordIndex}"][data-char-index="${charIndex}"]`
      );

      if (!charNode) {
        return;
      }

      const typedChar = typedWord[charIndex];

      if (typedChar == null) {
        if (isCurrentWord && charIndex === typedWord.length) {
          charNode.classList.add("current");
        }
        return;
      }

      if (typedChar === char) {
        charNode.classList.add("correct");
      } else {
        charNode.classList.add("incorrect");
      }
    });
  });

  const activeWordNode = textDisplay.querySelector(`[data-word="${currentWordIndex}"]`);
  if (activeWordNode) {
    activeWordNode.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }
}

typingInput.addEventListener("input", () => {
  if (!isStarted && typingInput.value.trim().length > 0) {
    startTimer();
  }

  updateHighlight();
  updateStats();
});

restartButton.addEventListener("click", resetTest);
durationSelect.addEventListener("change", resetTest);

resetTest();
