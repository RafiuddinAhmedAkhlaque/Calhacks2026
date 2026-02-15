import {
  getSettings,
  getTimeTracking,
  saveTimeTracking,
  type TimeTrackingData,
} from "@/lib/storage";
import type { QuizQuestion, MessageType } from "@/lib/types";

const ALARM_NAME = "scrollstop-timer";
const CHECK_INTERVAL_MINUTES = 0.25; // 15 seconds

// ---- State ----
let currentTabId: number | null = null;
let currentDomain: string | null = null;
let lastTick: number = Date.now();

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
    (d) => d.enabled && domain.includes(d.domain)
  );
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

  // Don't accumulate if already blocked
  if (data[currentDomain].blocked) return;

  data[currentDomain].totalSeconds += elapsed;
  data[currentDomain].lastActive = now;

  await saveTimeTracking(data);

  // Check threshold
  const settings = await getSettings();
  const limitSeconds = settings.timeLimitMinutes * 60;

  if (data[currentDomain].totalSeconds >= limitSeconds) {
    await triggerBlock(currentDomain, data);
  }
}

async function triggerBlock(
  domain: string,
  data: TimeTrackingData
): Promise<void> {
  data[domain].blocked = true;
  await saveTimeTracking(data);

  if (currentTabId === null) return;

  // Fetch quiz questions from the backend
  let questions: QuizQuestion[];
  try {
    const settings = await getSettings();
    const roomId = settings.activeRoomId;
    if (!roomId) {
      // Fallback: use placeholder questions
      questions = getFallbackQuestions();
    } else {
      const res = await fetch(
        `http://localhost:3001/api/quiz/${roomId}?count=5`
      );
      if (!res.ok) throw new Error("Failed to fetch questions");
      questions = await res.json();
    }
  } catch {
    questions = getFallbackQuestions();
  }

  // Send block message to content script
  const message: MessageType = { type: "BLOCK_PAGE", questions };
  try {
    await chrome.tabs.sendMessage(currentTabId, message);
  } catch (err) {
    console.error("Failed to send block message:", err);
  }
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
    } else {
      currentTabId = null;
      currentDomain = null;
    }
  } catch {
    currentTabId = null;
    currentDomain = null;
  }
}

// ---- Event Listeners ----

chrome.tabs.onActivated.addListener(async () => {
  await tickTimeTracking();
  await updateCurrentTab();
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    await tickTimeTracking();
    await updateCurrentTab();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await tickTimeTracking();
    currentDomain = null;
  } else {
    await updateCurrentTab();
    lastTick = Date.now();
  }
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

chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  if (message.type === "QUIZ_COMPLETED") {
    // Reset timer for the current domain
    if (currentDomain) {
      getTimeTracking().then(async (data) => {
        if (data[currentDomain!]) {
          data[currentDomain!].totalSeconds = 0;
          data[currentDomain!].blocked = false;
          await saveTimeTracking(data);
        }
      });
    }

    // Report to server
    (async () => {
      try {
        const settings = await getSettings();
        const { getUser } = await import("@/lib/storage");
        const user = await getUser();
        if (settings.activeRoomId && user?.token) {
          await fetch("http://localhost:3001/api/quiz/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              roomId: settings.activeRoomId,
              score: message.score,
              totalQuestions: 5,
            }),
          });
        }
      } catch (err) {
        console.error("[ScrollStop] Failed to report quiz to server:", err);
      }
    })();

    sendResponse({ success: true });
  } else if (message.type === "GET_STATUS") {
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
    return true; // keep channel open for async
  }
});

// ---- Init ----
updateCurrentTab();
console.log("[ScrollStop] Background service worker initialized");
