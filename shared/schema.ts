import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// NOTE: This schema is primarily used for Frontend Generation and Type Sharing.
// The actual database is implemented in SQLite/SQLAlchemy on the Python backend.

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("user").notNull(), // 'admin' | 'user' | 'guest'
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(), // The extracted text
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(), // 'pdf', 'txt', 'md'
  createdAt: timestamp("created_at").defaultNow(),
});

// For RAG search results (not a table, but a type for the frontend)
export const searchResultSchema = z.object({
  id: z.number(),
  documentId: z.number(),
  content: z.string(),
  score: z.number(),
  metadata: z.record(z.any()).optional(),
});

// Zod Schemas for Forms
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Document = typeof documents.$inferSelect;
export type SearchResult = z.infer<typeof searchResultSchema>;

// API Request/Response Types
export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type ChatRequest = {
  query: string;
  history?: { role: string; content: string }[];
};

export type ChatResponse = {
  answer: string;
  sources: SearchResult[];
};
