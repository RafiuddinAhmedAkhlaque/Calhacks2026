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
  const progressPct = (consecutiveCorrect / REQUIRED_CORRECT) * 100;

  // Build streak dots
  const dots = Array.from({ length: REQUIRED_CORRECT }, (_, i) => {
    const filled = i < consecutiveCorrect;
    const justFilled = i === consecutiveCorrect - 1 && consecutiveCorrect > 0;
    return `<div class="scrollstop-dot${filled ? ' filled' : ''}${justFilled ? ' pulse' : ''}"></div>`;
  }).join('');

  overlayContainer.innerHTML = `
    <div class="scrollstop-backdrop">
      <div class="scrollstop-topbar">
        <div class="scrollstop-topbar-fill" style="width: ${progressPct}%"></div>
      </div>

      <div class="scrollstop-card">
        <div class="scrollstop-header">
          <div class="scrollstop-brand">
            <div class="scrollstop-logo">ScrollStop</div>
            <div class="scrollstop-subtitle">${REQUIRED_CORRECT - consecutiveCorrect} more to unlock</div>
          </div>
          <div class="scrollstop-dots">
            ${dots}
          </div>
        </div>

        <div class="scrollstop-divider"></div>

        <div class="scrollstop-question">
          <div class="scrollstop-question-label">Question</div>
          <div class="scrollstop-question-text">${q.question}</div>
        </div>

        <div class="scrollstop-options">
          ${q.options
            .map(
              (opt, i) => `
            <button class="scrollstop-option" data-index="${i}" style="animation: scrollstop-stagger 0.25s ease-out ${i * 0.06}s both">
              <span class="scrollstop-option-letter">${String.fromCharCode(65 + i)}</span>
              <span>${opt}</span>
            </button>
          `
            )
            .join("")}
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
      if (feedback) {
        feedback.textContent = "Page unlocked. Get back to work.";
        feedback.className = "scrollstop-streak-warning scrollstop-success";
      }

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
      feedback.textContent = `Correct — ${REQUIRED_CORRECT - consecutiveCorrect} more to go`;
      feedback.className = "scrollstop-streak-warning scrollstop-correct";
    }
  } else {
    consecutiveCorrect = 0;
    if (feedback) {
      feedback.textContent = "Wrong answer. Streak reset.";
      feedback.className = "scrollstop-streak-warning scrollstop-wrong";
    }
  }

  currentQuestionIndex++;

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
