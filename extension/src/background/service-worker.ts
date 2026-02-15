import {
  getSettings,
  getTimeTracking,
  saveTimeTracking,
  getUser,
  type TimeTrackingData,
} from "@/lib/storage";
import type {
  QuizQuestion,
  MessageType,
  WrongAnswerPayload,
} from "@/lib/types";
import { API_BASE_URL } from "@/lib/serverConfig";

const ALARM_NAME = "scrollstop-timer";
const CHECK_INTERVAL_MINUTES = 1 / 60; // 1 second
const REQUIRED_CORRECT = 5;

// ---- State ----
let currentTabId: number | null = null;
let currentDomain: string | null = null;
let lastTick: number = Date.now();

interface DomainQuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  consecutiveCorrect: number;
  requiredCorrect: number;
  wrongAnswers: WrongAnswerPayload[];
  lastWrongSelectedIndex: number | null;
}

const quizStatesByDomain: Record<string, DomainQuizState> = {};

// ---- Helpers ----

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function isTrackedDomain(domain: string): Promise<boolean> {
  const settings = await getSettings();
  return settings.trackedDomains.some(
    (d) => d.enabled && domain.includes(d.domain),
  );
}

function getFallbackQuestions(): QuizQuestion[] {
  return [
    {
      id: "fb1",
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctIndex: 2,
    },
    {
      id: "fb2",
      question: "What is 7 x 8?",
      options: ["54", "56", "58", "62"],
      correctIndex: 1,
    },
    {
      id: "fb3",
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctIndex: 1,
    },
    {
      id: "fb4",
      question: "What year did the World Wide Web become publicly available?",
      options: ["1989", "1991", "1993", "1995"],
      correctIndex: 1,
    },
    {
      id: "fb5",
      question: "What is the chemical symbol for gold?",
      options: ["Ag", "Fe", "Au", "Cu"],
      correctIndex: 2,
    },
  ];
}

async function fetchQuizQuestions(): Promise<QuizQuestion[]> {
  try {
    const settings = await getSettings();
    const roomId = settings.activeRoomId;
    const user = await getUser();

    if (!roomId || !user?.token) {
      return getFallbackQuestions();
    }

    const res = await fetch(`${API_BASE_URL}/quiz/${roomId}?count=5`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch questions: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("[ScrollStop] Failed to fetch quiz questions:", err);
    return getFallbackQuestions();
  }
}

function buildBlockMessage(
  state: DomainQuizState,
  feedbackText?: string,
  feedbackType?: "correct" | "wrong" | "success",
): MessageType {
  return {
    type: "BLOCK_PAGE",
    questions: state.questions,
    currentQuestionIndex: state.currentQuestionIndex,
    consecutiveCorrect: state.consecutiveCorrect,
    requiredCorrect: state.requiredCorrect,
    lastWrongSelectedIndex: state.lastWrongSelectedIndex,
    feedbackText,
    feedbackType,
  };
}

async function getTabsForDomain(domain: string): Promise<chrome.tabs.Tab[]> {
  const tabs = await chrome.tabs.query({});
  return tabs.filter((tab) => {
    if (!tab.id || !tab.url) return false;
    return extractDomain(tab.url) === domain;
  });
}

async function sendMessageSafe(
  tabId: number,
  message: MessageType,
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    // Ignore tabs without content script or transient navigation states.
  }
}

async function broadcastQuizState(
  domain: string,
  feedbackText?: string,
  feedbackType?: "correct" | "wrong" | "success",
): Promise<void> {
  const state = quizStatesByDomain[domain];
  if (!state) return;

  const tabs = await getTabsForDomain(domain);
  const message = buildBlockMessage(state, feedbackText, feedbackType);
  await Promise.all(tabs.map((tab) => sendMessageSafe(tab.id!, message)));
}

async function broadcastUnblock(domain: string): Promise<void> {
  const tabs = await getTabsForDomain(domain);
  await Promise.all(
    tabs.map((tab) => sendMessageSafe(tab.id!, { type: "UNBLOCK_PAGE" })),
  );
}

async function ensureQuizState(domain: string): Promise<DomainQuizState> {
  if (!quizStatesByDomain[domain]) {
    quizStatesByDomain[domain] = {
      questions: await fetchQuizQuestions(),
      currentQuestionIndex: 0,
      consecutiveCorrect: 0,
      requiredCorrect: REQUIRED_CORRECT,
      wrongAnswers: [],
      lastWrongSelectedIndex: null,
    };
  }

  return quizStatesByDomain[domain];
}

async function syncBlockedTab(
  tabId: number | null,
  domain: string | null,
): Promise<void> {
  if (!tabId || !domain) return;

  const data = await getTimeTracking();
  if (!data[domain]?.blocked) return;

  const state = await ensureQuizState(domain);
  await sendMessageSafe(tabId, buildBlockMessage(state));
}

async function consumeDomainUsageAndUnblock(domain: string): Promise<number> {
  const data = await getTimeTracking();
  let usageSeconds = 0;

  if (data[domain]) {
    usageSeconds = Math.floor(data[domain].totalSeconds || 0);
    data[domain].totalSeconds = 0;
    data[domain].blocked = false;
    await saveTimeTracking(data);
  }

  return usageSeconds;
}

async function submitQuizCompletion(
  state: DomainQuizState,
  usageSeconds: number,
): Promise<void> {
  const settings = await getSettings();
  const user = await getUser();
  if (!settings.activeRoomId || !user?.token) return;

  await fetch(`${API_BASE_URL}/quiz/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({
      roomId: settings.activeRoomId,
      score: state.requiredCorrect,
      totalQuestions: state.requiredCorrect,
      usageSeconds,
      wrongAnswers: state.wrongAnswers.map((w) => ({
        ...w,
        roomId: settings.activeRoomId!,
      })),
    }),
  });
}

async function handleQuizAnswer(
  senderTab: chrome.tabs.Tab | undefined,
  selectedIndex: number,
): Promise<void> {
  const domain = senderTab?.url ? extractDomain(senderTab.url) : null;
  if (!domain) return;

  const data = await getTimeTracking();
  if (!data[domain]?.blocked) return;

  const state = await ensureQuizState(domain);
  if (state.questions.length === 0) return;

  const q =
    state.questions[state.currentQuestionIndex % state.questions.length];
  if (!q) return;

  if (selectedIndex === q.correctIndex) {
    state.consecutiveCorrect += 1;
    state.lastWrongSelectedIndex = null;

    if (state.consecutiveCorrect >= state.requiredCorrect) {
      const usageSeconds = await consumeDomainUsageAndUnblock(domain);
      await submitQuizCompletion(state, usageSeconds);
      delete quizStatesByDomain[domain];
      await broadcastUnblock(domain);
      return;
    }

    state.currentQuestionIndex += 1;
    await broadcastQuizState(
      domain,
      `Correct - ${state.requiredCorrect - state.consecutiveCorrect} more to go`,
      "correct",
    );
    return;
  }

  if (
    state.lastWrongSelectedIndex !== null &&
    selectedIndex === state.lastWrongSelectedIndex
  ) {
    await broadcastQuizState(
      domain,
      "Pick a different answer for this question.",
      "wrong",
    );
    return;
  }

  state.consecutiveCorrect = 0;
  state.lastWrongSelectedIndex = selectedIndex;
  state.wrongAnswers.push({
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    selectedIndex,
  });

  const explanation = q.explanation?.trim();
  const feedback = explanation
    ? `Wrong answer.\n\nWhy this is correct:\n${explanation}`
    : "Wrong answer.";
  await broadcastQuizState(domain, feedback, "wrong");
}

async function handleNextQuestion(
  senderTab: chrome.tabs.Tab | undefined,
): Promise<void> {
  const domain = senderTab?.url ? extractDomain(senderTab.url) : null;
  if (!domain) return;

  const data = await getTimeTracking();
  if (!data[domain]?.blocked) return;

  const state = await ensureQuizState(domain);
  if (state.questions.length === 0) return;

  state.currentQuestionIndex += 1;
  state.lastWrongSelectedIndex = null;
  await broadcastQuizState(domain);
}

// ---- Time Tracking ----

async function tickTimeTracking(): Promise<void> {
  const now = Date.now();
  const elapsed = (now - lastTick) / 1000;
  lastTick = now;

  if (!currentDomain) return;

  const isTracked = await isTrackedDomain(currentDomain);
  if (!isTracked) return;

  const data = await getTimeTracking();
  if (!data[currentDomain]) {
    data[currentDomain] = { totalSeconds: 0, lastActive: now, blocked: false };
  }

  if (data[currentDomain].blocked) return;

  data[currentDomain].totalSeconds += elapsed;
  data[currentDomain].lastActive = now;
  await saveTimeTracking(data);

  const settings = await getSettings();
  const limitSeconds = settings.timeLimitMinutes * 60;
  if (data[currentDomain].totalSeconds >= limitSeconds) {
    await triggerBlock(currentDomain, data);
  }
}

async function triggerBlock(
  domain: string,
  data: TimeTrackingData,
): Promise<void> {
  data[domain].blocked = true;
  await saveTimeTracking(data);

  await ensureQuizState(domain);
  await broadcastQuizState(domain);
}

// ---- Tab Tracking ----

async function updateCurrentTab(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab?.id && tab.url) {
      currentTabId = tab.id;
      currentDomain = extractDomain(tab.url);
      return;
    }
  } catch {
    // Ignore and clear below.
  }

  currentTabId = null;
  currentDomain = null;
}

// ---- Event Listeners ----

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.tabs.onActivated.addListener(async () => {
  await tickTimeTracking();
  await updateCurrentTab();
  await syncBlockedTab(currentTabId, currentDomain);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!(changeInfo.url || changeInfo.status === "complete")) return;

  await tickTimeTracking();
  await updateCurrentTab();

  const domain = tab?.url
    ? extractDomain(tab.url)
    : changeInfo.url
      ? extractDomain(changeInfo.url)
      : null;
  await syncBlockedTab(tabId, domain);
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await tickTimeTracking();
    currentDomain = null;
    return;
  }

  await updateCurrentTab();
  await syncBlockedTab(currentTabId, currentDomain);
});

// ---- Alarm ----

chrome.alarms.create(ALARM_NAME, {
  periodInMinutes: CHECK_INTERVAL_MINUTES,
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await tickTimeTracking();
  }
});

// ---- Message Handling ----

chrome.runtime.onMessage.addListener(
  (message: MessageType, sender, sendResponse) => {
    if (message.type === "QUIZ_ANSWER") {
      (async () => {
        try {
          await handleQuizAnswer(sender.tab, message.selectedIndex);
          sendResponse({ success: true });
        } catch (err) {
          console.error("[ScrollStop] Failed handling quiz answer:", err);
          sendResponse({ success: false });
        }
      })();
      return true;
    }

    if (message.type === "QUIZ_NEXT") {
      (async () => {
        try {
          await handleNextQuestion(sender.tab);
          sendResponse({ success: true });
        } catch (err) {
          console.error("[ScrollStop] Failed handling next question:", err);
          sendResponse({ success: false });
        }
      })();
      return true;
    }

    if (message.type === "GET_STATUS") {
      (async () => {
        const data = await getTimeTracking();
        const settings = await getSettings();
        const domain = currentDomain || "";
        const info = data[domain];
        sendResponse({
          type: "STATUS_RESPONSE",
          isBlocked: info?.blocked ?? false,
          timeSpent: info?.totalSeconds ?? 0,
          timeLimit: settings.timeLimitMinutes * 60,
        });
      })();
      return true;
    }
  },
);

// ---- Init ----
updateCurrentTab();
console.log("[ScrollStop] Background service worker initialized");
