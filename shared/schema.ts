import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"), // coach lesson notes shown below the video
  level: integer("level").notNull(),
  orderIndex: integer("order_index").notNull(),
  videoUrl: text("video_url"),
  pdfUrl: text("pdf_url"),
  isPublished: boolean("is_published").default(true),
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
  storageKey: text("storage_key"), // S3 object key when using private cloud storage
  notes: text("notes"),
  status: text("status").default("submitted"),
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
  agreementType: text("agreement_type").notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow(),
  ipAddress: text("ip_address"),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  tier: text("tier").default("none"),
  status: text("status").default("inactive"),
  currentPeriodEnd: timestamp("current_period_end"),
  videoCreditsUsed: integer("video_credits_used").default(0),
  videoCreditsLimit: integer("video_credits_limit").default(0),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  pinned: boolean("pinned").default(false),
  targetTier: text("target_tier"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const parentConsents = pgTable("parent_consents", {
  id: serial("id").primaryKey(),
  athleteId: varchar("athlete_id").notNull().references(() => users.id),
  parentEmail: varchar("parent_email").notNull(),
  token: text("token").notNull(),
  status: text("status").default("pending"),
  sentAt: timestamp("sent_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertProgressSchema = createInsertSchema(userProgress).omit({ id: true, completedAt: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, submittedAt: true, status: true });
export const insertFeedbackSchema = createInsertSchema(videoFeedback).omit({ id: true, createdAt: true });
export const insertAgreementSchema = createInsertSchema(agreements).omit({ id: true, acceptedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertParentConsentSchema = createInsertSchema(parentConsents).omit({ id: true, sentAt: true, approvedAt: true });

export type Module = typeof modules.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type VideoFeedback = typeof videoFeedback.$inferSelect;
export type Agreement = typeof agreements.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type ParentConsent = typeof parentConsents.$inferSelect;

export type CreateModuleRequest = z.infer<typeof insertModuleSchema>;
export type UpdateModuleRequest = Partial<CreateModuleRequest>;
export type CreateVideoRequest = z.infer<typeof insertVideoSchema>;
export type UpdateVideoRequest = Partial<z.infer<typeof insertVideoSchema>>;
export type CreateFeedbackRequest = z.infer<typeof insertFeedbackSchema>;
export type CreateAgreementRequest = z.infer<typeof insertAgreementSchema>;
export type CreateSubscriptionRequest = z.infer<typeof insertSubscriptionSchema>;
export type CreateAnnouncementRequest = z.infer<typeof insertAnnouncementSchema>;
