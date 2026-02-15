import { Router } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { getUserCoins, initializeUserBalance } from "../services/roomManager.js";
import { authenticate } from "../middleware.js";

const router = Router();
const STARTING_COINS = 50;

// POST /api/auth/login
// Simple username-based auth (upsert)
router.post("/login", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== "string" || username.trim().length < 2) {
      res.status(400).json({ error: "Username must be at least 2 characters" });
      return;
    }

    const trimmed = username.trim();

    // Check if user exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, trimmed));

    if (existing) {
      await initializeUserBalance(existing.id);
      const coins = await getUserCoins(existing.id);
      res.json({
        user: {
          id: existing.id,
          username: existing.username,
          createdAt: existing.createdAt,
          coins,
        },
        token: existing.token,
      });
      return;
    }

    // Create new user
    const id = nanoid();
    const token = crypto.randomBytes(32).toString("hex");
    const now = new Date().toISOString();

    await db.insert(users).values({
      id,
      username: trimmed,
      token,
      createdAt: now,
    });
    await initializeUserBalance(id);

    res.json({
      user: { id, username: trimmed, createdAt: now, coins: STARTING_COINS },
      token,
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const coins = await getUserCoins(user.id);

    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      coins,
    });
  } catch (error) {
    console.error("[Auth] Me error:", error);
    res.status(500).json({ error: "Failed to load user" });
  }
});

export default router;
