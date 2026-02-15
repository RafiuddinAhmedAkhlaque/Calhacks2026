import type { QuizQuestion, MessageType } from "@/lib/types";

// ---- State ----
let overlayContainer: HTMLDivElement | null = null;
let questions: QuizQuestion[] = [];
let currentQuestionIndex = 0;
let consecutiveCorrect = 0;
let requiredCorrect = 5;
let feedbackText = "";
let feedbackType: "correct" | "wrong" | "success" = "correct";
let answerPending = false;

// ---- Overlay Management ----

function createOverlay(): void {
  if (!overlayContainer) {
    overlayContainer = document.createElement("div");
    overlayContainer.id = "scrollstop-overlay";
    document.body.appendChild(overlayContainer);
  }

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
  if (!q) return;

  const progressPct = (consecutiveCorrect / requiredCorrect) * 100;
  const dots = Array.from({ length: requiredCorrect }, (_, i) => {
    const filled = i < consecutiveCorrect;
    const justFilled = i === consecutiveCorrect - 1 && consecutiveCorrect > 0;
    return `<div class="scrollstop-dot${filled ? " filled" : ""}${justFilled ? " pulse" : ""}"></div>`;
  }).join("");

  overlayContainer.innerHTML = `
    <div class="scrollstop-backdrop">
      <div class="scrollstop-topbar">
        <div class="scrollstop-topbar-fill" style="width: ${progressPct}%"></div>
      </div>

      <div class="scrollstop-card">
        <div class="scrollstop-header">
          <div class="scrollstop-brand">
            <div class="scrollstop-logo">ScrollStop</div>
            <div class="scrollstop-subtitle">${requiredCorrect - consecutiveCorrect} more to unlock</div>
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
            <button class="scrollstop-option${feedbackType === "wrong" && i === q.correctIndex ? " scrollstop-option-reveal" : ""}" data-index="${i}" style="animation: scrollstop-stagger 0.25s ease-out ${i * 0.06}s both">
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

  const feedbackEl = overlayContainer.querySelector(
    "#scrollstop-feedback"
  ) as HTMLElement | null;
  if (feedbackEl && feedbackText) {
    feedbackEl.textContent = feedbackText;
    feedbackEl.className = `scrollstop-streak-warning scrollstop-${feedbackType}`;
  }

  const buttons = overlayContainer.querySelectorAll(".scrollstop-option");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (answerPending) return;
      answerPending = true;

      const target = e.currentTarget as HTMLElement;
      const idx = parseInt(target.dataset.index || "0", 10);

      chrome.runtime.sendMessage({ type: "QUIZ_ANSWER", selectedIndex: idx });
    });
  });
}

// ---- Message Listener ----

chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse) => {
    if (message.type === "BLOCK_PAGE") {
      questions = message.questions;
      currentQuestionIndex = message.currentQuestionIndex ?? 0;
      consecutiveCorrect = message.consecutiveCorrect ?? 0;
      requiredCorrect = message.requiredCorrect ?? 5;
      feedbackText = message.feedbackText ?? "";
      feedbackType = message.feedbackType ?? "correct";
      answerPending = false;
      createOverlay();
      sendResponse({ success: true });
    } else if (message.type === "UNBLOCK_PAGE") {
      questions = [];
      currentQuestionIndex = 0;
      consecutiveCorrect = 0;
      requiredCorrect = 5;
      feedbackText = "";
      answerPending = false;
      removeOverlay();
      sendResponse({ success: true });
    }
  }
);

console.log("[ScrollStop] Content script loaded");
