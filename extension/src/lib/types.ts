// ---- Shared Types ----

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  members: RoomMember[];
  createdAt: string;
}

export interface RoomMember {
  userId: string;
  username: string;
  score: number;
  streak: number;
  quizzesCompleted: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface WrongAnswerPayload {
  question: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  roomId?: string;
  documentId?: string;
}

export interface CorrectAnswerPayload {
  question: string;
  options: string[];
  correctIndex: number;
  roomId?: string;
  documentId?: string;
}

export interface Document {
  id: string;
  roomId: string;
  filename: string;
  uploadedBy: string;
  questionCount: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  streak: number;
  quizzesCompleted: number;
  rank: number;
}

export interface AllTimeStats {
  totalUsageSeconds: number;
  totalQuestionsCompleted: number;
}

export interface WrongQuestionReview {
  id: string;
  roomId: string | null;
  documentId: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  createdAt: string;
}

export interface CorrectQuestionReview {
  id: string;
  roomId: string | null;
  documentId: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  createdAt: string;
}

export interface DomainConfig {
  domain: string;
  enabled: boolean;
}

export interface ScrollStopSettings {
  trackedDomains: DomainConfig[];
  timeLimitMinutes: number;
  questionsRequired: number;
  activeRoomId: string | null;
}

export const DEFAULT_SETTINGS: ScrollStopSettings = {
  trackedDomains: [
    { domain: "reddit.com", enabled: true },
    { domain: "twitter.com", enabled: true },
    { domain: "x.com", enabled: true },
    { domain: "instagram.com", enabled: true },
    { domain: "tiktok.com", enabled: true },
    { domain: "youtube.com", enabled: true },
    { domain: "facebook.com", enabled: true },
  ],
  timeLimitMinutes: 15,
  questionsRequired: 5,
  activeRoomId: null,
};

// Messages between background <-> content script
export type MessageType =
  | {
      type: "BLOCK_PAGE";
      questions: QuizQuestion[];
      currentQuestionIndex?: number;
      consecutiveCorrect?: number;
      requiredCorrect?: number;
      feedbackText?: string;
      feedbackType?: "correct" | "wrong" | "success";
    }
  | { type: "UNBLOCK_PAGE" }
  | { type: "QUIZ_ANSWER"; selectedIndex: number }
  | {
      type: "QUIZ_COMPLETED";
      score: number;
      wrongAnswers?: WrongAnswerPayload[];
    }
  | { type: "GET_STATUS" }
  | {
      type: "STATUS_RESPONSE";
      isBlocked: boolean;
      timeSpent: number;
      timeLimit: number;
    };
