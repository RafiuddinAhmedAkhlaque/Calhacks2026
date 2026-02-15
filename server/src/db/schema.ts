import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  token: text("token").notNull(),
  createdAt: text("created_at").notNull(),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const roomMembers = sqliteTable("room_members", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  score: integer("score").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  quizzesCompleted: integer("quizzes_completed").notNull().default(0),
  joinedAt: text("joined_at").notNull(),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation"),
  createdAt: text("created_at").notNull(),
});

export const userStats = sqliteTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  totalUsageSeconds: integer("total_usage_seconds").notNull().default(0),
  totalQuestionsCompleted: integer("total_questions_completed")
    .notNull()
    .default(0),
  updatedAt: text("updated_at").notNull(),
});

export const wrongQuestions = sqliteTable("wrong_questions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  roomId: text("room_id").references(() => rooms.id),
  documentId: text("document_id").references(() => documents.id),
  question: text("question").notNull(),
  options: text("options").notNull(),
  correctIndex: integer("correct_index").notNull(),
  selectedIndex: integer("selected_index").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userWallets = sqliteTable("user_wallets", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  coins: integer("coins").notNull().default(50),
  updatedAt: text("updated_at").notNull(),
});

export const roomPools = sqliteTable("room_pools", {
  roomId: text("room_id")
    .primaryKey()
    .references(() => rooms.id),
  totalCoins: integer("total_coins").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});
