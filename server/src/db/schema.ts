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
  createdAt: text("created_at").notNull(),
});
