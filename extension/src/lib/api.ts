import type {
  User,
  Room,
  QuizQuestion,
  LeaderboardEntry,
  Document,
  AllTimeStats,
  WrongQuestionReview,
  WrongAnswerPayload,
} from "./types";
import { getUser } from "./storage";
import { API_BASE_URL } from "./serverConfig";

const API_BASE = API_BASE_URL;

async function authHeaders(): Promise<HeadersInit> {
  const user = await getUser();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (user?.token) {
    headers["Authorization"] = `Bearer ${user.token}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ---- Auth ----

export async function login(
  username: string
): Promise<{ user: User; token: string }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

// ---- Rooms ----

export async function createRoom(name: string): Promise<Room> {
  return request("/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function joinRoom(inviteCode: string): Promise<Room> {
  return request("/rooms/join", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

export async function getMyRooms(): Promise<Room[]> {
  return request("/rooms");
}

export async function getRoom(roomId: string): Promise<Room> {
  return request(`/rooms/${roomId}`);
}

// ---- Documents ----

export async function uploadDocument(
  roomId: string,
  file: File
): Promise<Document> {
  const user = await getUser();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("roomId", roomId);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getRoomDocuments(roomId: string): Promise<Document[]> {
  return request(`/documents/${roomId}`);
}

// ---- Quiz ----

export async function getQuizQuestions(
  roomId: string,
  count: number = 5
): Promise<QuizQuestion[]> {
  return request(`/quiz/${roomId}?count=${count}`);
}

export async function submitQuizResult(
  roomId: string,
  score: number,
  totalQuestions: number,
  usageSeconds: number = 0,
  wrongAnswers: WrongAnswerPayload[] = []
): Promise<void> {
  return request("/quiz/submit", {
    method: "POST",
    body: JSON.stringify({
      roomId,
      score,
      totalQuestions,
      usageSeconds,
      wrongAnswers,
    }),
  });
}

// ---- Leaderboard ----

export async function getLeaderboard(
  roomId: string
): Promise<LeaderboardEntry[]> {
  return request(`/leaderboard/${roomId}`);
}

// ---- Analytics ----

export async function getMyStats(): Promise<AllTimeStats> {
  return request("/stats/me");
}

export async function getWrongQuestions(): Promise<WrongQuestionReview[]> {
  return request("/review/wrong-questions");
}
