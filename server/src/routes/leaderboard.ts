import { Router } from "express";
import { getLeaderboard } from "../services/roomManager.js";
import { authenticate } from "../middleware.js";

const router = Router();
router.use(authenticate);

// GET /api/leaderboard/:roomId
router.get("/:roomId", async (req, res) => {
  try {
    const leaderboard = await getLeaderboard(req.params.roomId);
    res.json(leaderboard);
  } catch (error) {
    console.error("[Leaderboard] Error:", error);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

export default router;
