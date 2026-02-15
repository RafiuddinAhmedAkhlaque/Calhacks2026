import { Router } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "crypto";

const router = Router();

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
      res.json({
        user: {
          id: existing.id,
          username: existing.username,
          createdAt: existing.createdAt,
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

    res.json({
      user: { id, username: trimmed, createdAt: now },
      token,
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
