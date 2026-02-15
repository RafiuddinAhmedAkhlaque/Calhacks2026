import { Router } from "express";
import { getRandomQuestions } from "../services/quizGenerator.js";
import { updateMemberScore } from "../services/roomManager.js";
import { authenticate } from "../middleware.js";
import { db } from "../db/index.js";
import { userStats, wrongQuestions, correctQuestions } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const router = Router();
router.use(authenticate);

// GET /api/quiz/:roomId?count=5
router.get("/:roomId", async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 5;
    const questions = await getRandomQuestions(req.params.roomId, count);

    if (questions.length === 0) {
      res
        .status(404)
        .json({ error: "No questions available. Upload documents first." });
      return;
    }

    res.json(questions);
  } catch (error) {
    console.error("[Quiz] Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// POST /api/quiz/submit
router.post("/submit", async (req, res) => {
  try {
    const { roomId, score, totalQuestions, usageSeconds, wrongAnswers, correctAnswers } =
      req.body;

    if (!roomId || typeof score !== "number") {
      res.status(400).json({ error: "roomId and score are required" });
      return;
    }

    const result = await updateMemberScore(roomId, req.userId!, score);

    if (!result) {
      res.status(404).json({ error: "Not a member of this room" });
      return;
    }

    const now = new Date().toISOString();
    const safeTotalQuestions =
      typeof totalQuestions === "number" && totalQuestions > 0
        ? Math.floor(totalQuestions)
        : 0;
    const safeUsageSeconds =
      typeof usageSeconds === "number" && usageSeconds > 0
        ? Math.floor(usageSeconds)
        : 0;

    await db
      .insert(userStats)
      .values({
        userId: req.userId!,
        totalUsageSeconds: 0,
        totalQuestionsCompleted: 0,
        updatedAt: now,
      })
      .onConflictDoNothing();

    await db
      .update(userStats)
      .set({
        totalUsageSeconds: sql`${userStats.totalUsageSeconds} + ${safeUsageSeconds}`,
        totalQuestionsCompleted: sql`${userStats.totalQuestionsCompleted} + ${safeTotalQuestions}`,
        updatedAt: now,
      })
      .where(eq(userStats.userId, req.userId!));

    if (Array.isArray(wrongAnswers) && wrongAnswers.length > 0) {
      const rows = wrongAnswers
        .filter(
          (w) =>
            w &&
            typeof w.question === "string" &&
            Array.isArray(w.options) &&
            typeof w.correctIndex === "number" &&
            typeof w.selectedIndex === "number"
        )
        .map((w) => ({
          id: nanoid(),
          userId: req.userId!,
          roomId: typeof w.roomId === "string" ? w.roomId : roomId,
          documentId: typeof w.documentId === "string" ? w.documentId : null,
          question: w.question,
          options: JSON.stringify(w.options),
          correctIndex: Math.floor(w.correctIndex),
          selectedIndex: Math.floor(w.selectedIndex),
          createdAt: now,
        }));

      if (rows.length > 0) {
        await db.insert(wrongQuestions).values(rows);
      }
    }

    if (Array.isArray(correctAnswers) && correctAnswers.length > 0) {
      const rows = correctAnswers
        .filter(
          (c) =>
            c &&
            typeof c.question === "string" &&
            Array.isArray(c.options) &&
            typeof c.correctIndex === "number"
        )
        .map((c) => ({
          id: nanoid(),
          userId: req.userId!,
          roomId: typeof c.roomId === "string" ? c.roomId : roomId,
          documentId: typeof c.documentId === "string" ? c.documentId : null,
          question: c.question,
          options: JSON.stringify(c.options),
          correctIndex: Math.floor(c.correctIndex),
          createdAt: now,
        }));

      if (rows.length > 0) {
        await db.insert(correctQuestions).values(rows);
      }
    }

    res.json(result);
  } catch (error) {
    console.error("[Quiz] Error submitting result:", error);
    res.status(500).json({ error: "Failed to submit result" });
  }
});

export default router;
