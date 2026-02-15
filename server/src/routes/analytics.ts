import { Router } from "express";
import { authenticate } from "../middleware.js";
import { db } from "../db/index.js";
import { userStats, wrongQuestions, correctQuestions } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";

const router = Router();
router.use(authenticate);

// GET /api/stats/me
router.get("/stats/me", async (req, res) => {
  try {
    const [stats] = await db
      .select({
        totalUsageSeconds: userStats.totalUsageSeconds,
        totalQuestionsCompleted: userStats.totalQuestionsCompleted,
      })
      .from(userStats)
      .where(eq(userStats.userId, req.userId!));

    res.json({
      totalUsageSeconds: stats?.totalUsageSeconds ?? 0,
      totalQuestionsCompleted: stats?.totalQuestionsCompleted ?? 0,
    });
  } catch (error) {
    console.error("[Analytics] Error loading stats:", error);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// GET /api/review/wrong-questions
router.get("/review/wrong-questions", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: wrongQuestions.id,
        roomId: wrongQuestions.roomId,
        documentId: wrongQuestions.documentId,
        question: wrongQuestions.question,
        options: wrongQuestions.options,
        correctIndex: wrongQuestions.correctIndex,
        selectedIndex: wrongQuestions.selectedIndex,
        createdAt: wrongQuestions.createdAt,
      })
      .from(wrongQuestions)
      .where(eq(wrongQuestions.userId, req.userId!))
      .orderBy(desc(wrongQuestions.createdAt));

    res.json(
      rows.map((r) => ({
        ...r,
        options: JSON.parse(r.options) as string[],
      }))
    );
  } catch (error) {
    console.error("[Analytics] Error loading wrong questions:", error);
    res.status(500).json({ error: "Failed to load wrong questions" });
  }
});

// GET /api/review/correct-questions
router.get("/review/correct-questions", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: correctQuestions.id,
        roomId: correctQuestions.roomId,
        documentId: correctQuestions.documentId,
        question: correctQuestions.question,
        options: correctQuestions.options,
        correctIndex: correctQuestions.correctIndex,
        createdAt: correctQuestions.createdAt,
      })
      .from(correctQuestions)
      .where(eq(correctQuestions.userId, req.userId!))
      .orderBy(desc(correctQuestions.createdAt));

    res.json(
      rows.map((r) => ({
        ...r,
        options: JSON.parse(r.options) as string[],
      }))
    );
  } catch (error) {
    console.error("[Analytics] Error loading correct questions:", error);
    res.status(500).json({ error: "Failed to load correct questions" });
  }
});

export default router;
