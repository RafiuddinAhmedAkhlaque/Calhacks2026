import { db } from "../db/index.js";
import { rooms, roomMembers, users, userWallets, roomPools } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

const STARTING_COINS = 50;
const ROOM_STAKE_COINS = 50;

function generateInviteCode(): string {
  // 6-character alphanumeric code
  return nanoid(6).toUpperCase();
}

export async function initializeUserBalance(userId: string) {
  const now = new Date().toISOString();
  await db
    .insert(userWallets)
    .values({
      userId,
      coins: STARTING_COINS,
      updatedAt: now,
    })
    .onConflictDoNothing();
}

export async function getUserCoins(userId: string): Promise<number> {
  await initializeUserBalance(userId);
  const [wallet] = await db
    .select({ coins: userWallets.coins })
    .from(userWallets)
    .where(eq(userWallets.userId, userId));

  return wallet?.coins ?? STARTING_COINS;
}

export async function deductCoins(userId: string, amount: number): Promise<boolean> {
  await initializeUserBalance(userId);

  const [wallet] = await db
    .select({ coins: userWallets.coins })
    .from(userWallets)
    .where(eq(userWallets.userId, userId));

  if (!wallet || wallet.coins < amount) {
    return false;
  }

  await db
    .update(userWallets)
    .set({
      coins: wallet.coins - amount,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userWallets.userId, userId));

  return true;
}

export async function awardCoins(userId: string, amount: number): Promise<void> {
  await initializeUserBalance(userId);
  await db
    .update(userWallets)
    .set({
      coins: sql`${userWallets.coins} + ${amount}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userWallets.userId, userId));
}

async function initializeRoomPool(roomId: string) {
  const now = new Date().toISOString();
  await db
    .insert(roomPools)
    .values({
      roomId,
      totalCoins: 0,
      updatedAt: now,
    })
    .onConflictDoNothing();
}

async function addToRoomPool(roomId: string, amount: number) {
  await initializeRoomPool(roomId);
  await db
    .update(roomPools)
    .set({
      totalCoins: sql`${roomPools.totalCoins} + ${amount}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(roomPools.roomId, roomId));
}

export async function getRoomPool(roomId: string): Promise<number> {
  await initializeRoomPool(roomId);
  const [pool] = await db
    .select({ totalCoins: roomPools.totalCoins })
    .from(roomPools)
    .where(eq(roomPools.roomId, roomId));
  return pool?.totalCoins ?? 0;
}

async function resetRoomPool(roomId: string) {
  await initializeRoomPool(roomId);
  await db
    .update(roomPools)
    .set({
      totalCoins: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(roomPools.roomId, roomId));
}

export async function createRoom(name: string, userId: string) {
  const now = new Date().toISOString();
  const roomId = nanoid();
  const inviteCode = generateInviteCode();

  const hasCoins = await deductCoins(userId, ROOM_STAKE_COINS);
  if (!hasCoins) {
    throw new Error(`Insufficient coins. Need ${ROOM_STAKE_COINS} coins to create/join a room.`);
  }

  try {
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
    await addToRoomPool(roomId, ROOM_STAKE_COINS);

    return getRoomWithMembers(roomId);
  } catch (error) {
    await awardCoins(userId, ROOM_STAKE_COINS);
    throw error;
  }
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

  const hasCoins = await deductCoins(userId, ROOM_STAKE_COINS);
  if (!hasCoins) {
    throw new Error(`Insufficient coins. Need ${ROOM_STAKE_COINS} coins to create/join a room.`);
  }

  try {
    await db.insert(roomMembers).values({
      id: nanoid(),
      roomId: room.id,
      userId,
      score: 0,
      streak: 0,
      quizzesCompleted: 0,
      joinedAt: new Date().toISOString(),
    });
    await addToRoomPool(room.id, ROOM_STAKE_COINS);
  } catch (error) {
    await awardCoins(userId, ROOM_STAKE_COINS);
    throw error;
  }

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
  const poolCoins = await getRoomPool(room.id);

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
    poolCoins,
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

  const leaderboard = await getLeaderboard(roomId);
  const winner = leaderboard[0];
  let awardedCoins = 0;

  if (winner) {
    const poolCoins = await getRoomPool(roomId);
    if (poolCoins > 0) {
      await awardCoins(winner.userId, poolCoins);
      await resetRoomPool(roomId);
      awardedCoins = poolCoins;
    }
  }

  return {
    score: newScore,
    streak: newStreak,
    quizzesCompleted: newQuizzes,
    awardedCoins,
  };
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
