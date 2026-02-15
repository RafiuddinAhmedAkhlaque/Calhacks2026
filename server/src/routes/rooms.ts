import { Router } from "express";
import {
  createRoom,
  joinRoom,
  getUserRooms,
  getRoomWithMembers,
} from "../services/roomManager.js";
import { authenticate } from "../middleware.js";

const router = Router();

// All routes require auth
router.use(authenticate);

// GET /api/rooms - list user's rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await getUserRooms(req.userId!);
    res.json(rooms);
  } catch (error) {
    console.error("[Rooms] Error listing rooms:", error);
    res.status(500).json({ error: "Failed to list rooms" });
  }
});

// POST /api/rooms - create room
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 1) {
      res.status(400).json({ error: "Room name is required" });
      return;
    }
    const room = await createRoom(name.trim(), req.userId!);
    res.json(room);
  } catch (error) {
    console.error("[Rooms] Error creating room:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// POST /api/rooms/join - join room by invite code
router.post("/join", async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      res.status(400).json({ error: "Invite code is required" });
      return;
    }
    const room = await joinRoom(inviteCode, req.userId!);
    res.json(room);
  } catch (error) {
    console.error("[Rooms] Error joining room:", error);
    const message =
      error instanceof Error ? error.message : "Failed to join room";
    res.status(400).json({ error: message });
  }
});

// GET /api/rooms/:roomId
router.get("/:roomId", async (req, res) => {
  try {
    const room = await getRoomWithMembers(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    res.json(room);
  } catch (error) {
    console.error("[Rooms] Error getting room:", error);
    res.status(500).json({ error: "Failed to get room" });
  }
});

export default router;
