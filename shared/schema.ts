import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { sql } from "drizzle-orm";

// Export all auth models so they are included in schema
export * from "./models/auth";

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  level: integer("level").notNull(), // 1 (Foundations), 2 (Competitive Mindset), 3 (Recruiting Blueprint)
  orderIndex: integer("order_index").notNull(),
  videoUrl: text("video_url"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => modules.id),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  videoUrl: text("video_url").notNull(),
  status: text("status").default("submitted"), // 'submitted', 'review', 'completed'
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const videoFeedback = pgTable("video_feedback", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  feedbackText: text("feedback_text"),
  feedbackVideoUrl: text("feedback_video_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agreements = pgTable("agreements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  agreementType: text("agreement_type").notNull(), // 'tos', 'privacy', 'liability', 'consent'
  acceptedAt: timestamp("accepted_at").defaultNow(),
});

// AI Chat Tables
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertProgressSchema = createInsertSchema(userProgress).omit({ id: true, completedAt: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, submittedAt: true, status: true });
export const insertFeedbackSchema = createInsertSchema(videoFeedback).omit({ id: true, createdAt: true });
export const insertAgreementSchema = createInsertSchema(agreements).omit({ id: true, acceptedAt: true });

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Module = typeof modules.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type VideoFeedback = typeof videoFeedback.$inferSelect;
export type Agreement = typeof agreements.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type CreateModuleRequest = z.infer<typeof insertModuleSchema>;
export type UpdateModuleRequest = Partial<CreateModuleRequest>;

export type CreateVideoRequest = z.infer<typeof insertVideoSchema>;
export type UpdateVideoRequest = Partial<z.infer<typeof insertVideoSchema>>;

export type CreateFeedbackRequest = z.infer<typeof insertFeedbackSchema>;
export type CreateAgreementRequest = z.infer<typeof insertAgreementSchema>;
