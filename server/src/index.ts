import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { initDatabase } from "./db/index.js";

// Routes
import authRouter from "./routes/auth.js";
import roomsRouter from "./routes/rooms.js";
import documentsRouter from "./routes/documents.js";
import quizRouter from "./routes/quiz.js";
import leaderboardRouter from "./routes/leaderboard.js";

// Services
import { getLeaderboard } from "./services/roomManager.js";

const PORT = process.env.PORT || 3001;

// ---- Init ----
initDatabase();

const app = express();
const httpServer = createServer(app);

// ---- Middleware ----
app.use(
  cors({
    origin: [
      "chrome-extension://*",
      "http://localhost:*",
    ],
    credentials: true,
  })
);
app.use(express.json());

// ---- Routes ----
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/leaderboard", leaderboardRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---- Socket.io ----
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join a room's channel
  socket.on("join-room", (roomId: string) => {
    socket.join(`room:${roomId}`);
    console.log(`[Socket] ${socket.id} joined room:${roomId}`);
  });

  // Leave a room's channel
  socket.on("leave-room", (roomId: string) => {
    socket.leave(`room:${roomId}`);
  });

  // Quiz completed - broadcast leaderboard update
  socket.on(
    "quiz-completed",
    async (data: { roomId: string; userId: string }) => {
      try {
        const leaderboard = await getLeaderboard(data.roomId);
        io.to(`room:${data.roomId}`).emit("leaderboard-update", leaderboard);
      } catch (err) {
        console.error("[Socket] Leaderboard update error:", err);
      }
    }
  );

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ---- Start ----
httpServer.listen(PORT, () => {
  console.log(`\n  🛑 ScrollStop Server running on http://localhost:${PORT}`);
  console.log(`  📡 Socket.io ready for connections\n`);
});
