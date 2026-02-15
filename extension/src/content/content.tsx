import type { QuizQuestion, MessageType } from "@/lib/types";

// ---- State ----
let overlayContainer: HTMLDivElement | null = null;
let questions: QuizQuestion[] = [];
let currentQuestionIndex = 0;
let consecutiveCorrect = 0;
const REQUIRED_CORRECT = 5;

// ---- Overlay Management ----

function createOverlay(): void {
  if (overlayContainer) return;

  overlayContainer = document.createElement("div");
  overlayContainer.id = "scrollstop-overlay";
  document.body.appendChild(overlayContainer);

  renderQuiz();
}

function removeOverlay(): void {
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
}

function renderQuiz(): void {
  if (!overlayContainer || questions.length === 0) return;

  const q = questions[currentQuestionIndex % questions.length];

  overlayContainer.innerHTML = `
    <div class="scrollstop-backdrop">
      <div class="scrollstop-modal">
        <div class="scrollstop-header">
          <div class="scrollstop-logo">🛑 ScrollStop</div>
          <div class="scrollstop-subtitle">
            Time's up! Answer ${REQUIRED_CORRECT} questions in a row to continue.
          </div>
        </div>

        <div class="scrollstop-progress">
          <div class="scrollstop-progress-bar">
            <div class="scrollstop-progress-fill" style="width: ${(consecutiveCorrect / REQUIRED_CORRECT) * 100}%"></div>
          </div>
          <div class="scrollstop-progress-text">${consecutiveCorrect} / ${REQUIRED_CORRECT} correct in a row</div>
        </div>

        <div class="scrollstop-question">
          <div class="scrollstop-question-text">${q.question}</div>
          <div class="scrollstop-options">
            ${q.options
              .map(
                (opt, i) => `
              <button class="scrollstop-option" data-index="${i}">
                <span class="scrollstop-option-letter">${String.fromCharCode(65 + i)}</span>
                <span>${opt}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="scrollstop-footer">
          <div class="scrollstop-streak-warning" id="scrollstop-feedback"></div>
        </div>
      </div>
    </div>
  `;

  // Bind click handlers
  const buttons = overlayContainer.querySelectorAll(".scrollstop-option");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const idx = parseInt(target.dataset.index || "0", 10);
      handleAnswer(idx, q.correctIndex);
    });
  });
}

function handleAnswer(selectedIndex: number, correctIndex: number): void {
  const feedback = document.getElementById("scrollstop-feedback");

  if (selectedIndex === correctIndex) {
    consecutiveCorrect++;

    if (consecutiveCorrect >= REQUIRED_CORRECT) {
      // Success! Unblock
      if (feedback) {
        feedback.textContent = "🎉 You did it! Page unlocked.";
        feedback.className = "scrollstop-streak-warning scrollstop-success";
      }

      // Notify background
      chrome.runtime.sendMessage({ type: "QUIZ_COMPLETED", score: REQUIRED_CORRECT });

      setTimeout(() => {
        removeOverlay();
        questions = [];
        currentQuestionIndex = 0;
        consecutiveCorrect = 0;
      }, 1000);
      return;
    }

    if (feedback) {
      feedback.textContent = `✅ Correct! ${REQUIRED_CORRECT - consecutiveCorrect} more to go.`;
      feedback.className = "scrollstop-streak-warning scrollstop-correct";
    }
  } else {
    consecutiveCorrect = 0;
    if (feedback) {
      feedback.textContent = "❌ Wrong! Streak reset. Try again.";
      feedback.className = "scrollstop-streak-warning scrollstop-wrong";
    }
  }

  currentQuestionIndex++;

  // Briefly show feedback, then next question
  setTimeout(() => {
    renderQuiz();
  }, 1200);
}

// ---- Message Listener ----

chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse) => {
    if (message.type === "BLOCK_PAGE") {
      questions = message.questions;
      currentQuestionIndex = 0;
      consecutiveCorrect = 0;
      createOverlay();
      sendResponse({ success: true });
    } else if (message.type === "UNBLOCK_PAGE") {
      removeOverlay();
      sendResponse({ success: true });
    }
  }
);

console.log("[ScrollStop] Content script loaded");
