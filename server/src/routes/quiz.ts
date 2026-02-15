import { Router } from "express";
import { getRandomQuestions } from "../services/quizGenerator.js";
import { updateMemberScore } from "../services/roomManager.js";
import { authenticate } from "../middleware.js";

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
    const { roomId, score, totalQuestions } = req.body;

    if (!roomId || typeof score !== "number") {
      res.status(400).json({ error: "roomId and score are required" });
      return;
    }

    const result = await updateMemberScore(roomId, req.userId!, score);

    if (!result) {
      res.status(404).json({ error: "Not a member of this room" });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error("[Quiz] Error submitting result:", error);
    res.status(500).json({ error: "Failed to submit result" });
  }
});

export default router;
