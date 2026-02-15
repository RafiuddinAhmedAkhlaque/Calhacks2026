import { io, type Socket } from "socket.io-client";
import { SERVER_BASE_URL } from "./serverConfig";

const SOCKET_URL = SERVER_BASE_URL;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("[ScrollStop] Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("[ScrollStop] Socket disconnected");
    });
  }
  return socket;
}

export function joinSocketRoom(roomId: string): void {
  const s = getSocket();
  s.emit("join-room", roomId);
}

export function leaveSocketRoom(roomId: string): void {
  const s = getSocket();
  s.emit("leave-room", roomId);
}

export function emitQuizCompleted(roomId: string, userId: string): void {
  const s = getSocket();
  s.emit("quiz-completed", { roomId, userId });
}

export function onLeaderboardUpdate(
  callback: (leaderboard: unknown[]) => void
): () => void {
  const s = getSocket();
  s.on("leaderboard-update", callback);
  return () => {
    s.off("leaderboard-update", callback);
  };
}
