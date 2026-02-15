import { db } from "../db/index.js";
import { rooms, roomMembers, users } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

function generateInviteCode(): string {
  // 6-character alphanumeric code
  return nanoid(6).toUpperCase();
}

export async function createRoom(name: string, userId: string) {
  const now = new Date().toISOString();
  const roomId = nanoid();
  const inviteCode = generateInviteCode();

  await db.insert(rooms).values({
    id: roomId,
    name,
    inviteCode,
    createdBy: userId,
    createdAt: now,
  });

  // Auto-join the creator
  await db.insert(roomMembers).values({
    id: nanoid(),
    roomId,
    userId,
    score: 0,
    streak: 0,
    quizzesCompleted: 0,
    joinedAt: now,
  });

  return getRoomWithMembers(roomId);
}

export async function joinRoom(inviteCode: string, userId: string) {
  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.inviteCode, inviteCode.toUpperCase()));

  if (!room) {
    throw new Error("Room not found");
  }

  // Check if already a member
  const [existing] = await db
    .select()
    .from(roomMembers)
    .where(
      and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, userId))
    );

  if (existing) {
    return getRoomWithMembers(room.id);
  }

  await db.insert(roomMembers).values({
    id: nanoid(),
    roomId: room.id,
    userId,
    score: 0,
    streak: 0,
    quizzesCompleted: 0,
    joinedAt: new Date().toISOString(),
  });

  return getRoomWithMembers(room.id);
}

export async function getUserRooms(userId: string) {
  const memberships = await db
    .select({ roomId: roomMembers.roomId })
    .from(roomMembers)
    .where(eq(roomMembers.userId, userId));

  const result = [];
  for (const m of memberships) {
    const room = await getRoomWithMembers(m.roomId);
    if (room) result.push(room);
  }
  return result;
}

export async function getRoomWithMembers(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
  if (!room) return null;

  const members = await db
    .select({
      userId: roomMembers.userId,
      username: users.username,
      score: roomMembers.score,
      streak: roomMembers.streak,
      quizzesCompleted: roomMembers.quizzesCompleted,
    })
    .from(roomMembers)
    .innerJoin(users, eq(roomMembers.userId, users.id))
    .where(eq(roomMembers.roomId, roomId));

  return {
    id: room.id,
    name: room.name,
    inviteCode: room.inviteCode,
    createdBy: room.createdBy,
    members,
    createdAt: room.createdAt,
  };
}

export async function updateMemberScore(
  roomId: string,
  userId: string,
  scoreIncrease: number
) {
  const [member] = await db
    .select()
    .from(roomMembers)
    .where(
      and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))
    );

  if (!member) return null;

  const newScore = member.score + scoreIncrease;
  const newStreak = member.streak + 1;
  const newQuizzes = member.quizzesCompleted + 1;

  await db
    .update(roomMembers)
    .set({
      score: newScore,
      streak: newStreak,
      quizzesCompleted: newQuizzes,
    })
    .where(eq(roomMembers.id, member.id));

  return { score: newScore, streak: newStreak, quizzesCompleted: newQuizzes };
}

export async function getLeaderboard(roomId: string) {
  const members = await db
    .select({
      userId: roomMembers.userId,
      username: users.username,
      score: roomMembers.score,
      streak: roomMembers.streak,
      quizzesCompleted: roomMembers.quizzesCompleted,
    })
    .from(roomMembers)
    .innerJoin(users, eq(roomMembers.userId, users.id))
    .where(eq(roomMembers.roomId, roomId))
    .orderBy(roomMembers.score);

  // Sort descending and add rank
  return members
    .sort((a, b) => b.score - a.score)
    .map((m, i) => ({
      ...m,
      rank: i + 1,
    }));
}
