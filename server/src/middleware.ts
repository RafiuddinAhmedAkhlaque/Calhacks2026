import type { Request, Response, NextFunction } from "express";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.token, token));

    if (!user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    req.userId = user.id;
    req.username = user.username;
    next();
  } catch (error) {
    console.error("[Auth] Middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
