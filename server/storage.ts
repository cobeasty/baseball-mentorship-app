import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  modules, userProgress, videos, videoFeedback, agreements, users, subscriptions, announcements, parentConsents,
  type Module, type UserProgress, type Video, type VideoFeedback, type Agreement, type User,
  type Subscription, type Announcement, type ParentConsent,
  type CreateModuleRequest, type UpdateModuleRequest, type CreateVideoRequest, type UpdateVideoRequest,
  type CreateFeedbackRequest, type CreateAgreementRequest, type CreateSubscriptionRequest, type CreateAnnouncementRequest
} from "@shared/schema";

export interface IStorage {
  // Modules
  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(data: CreateModuleRequest): Promise<Module>;
  updateModule(id: number, data: Partial<CreateModuleRequest>): Promise<Module>;
  deleteModule(id: number): Promise<void>;

  // Progress
  getUserProgress(userId: string): Promise<UserProgress[]>;
  completeModule(userId: string, moduleId: number): Promise<UserProgress>;

  // Videos
  getVideos(athleteId?: string): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(data: CreateVideoRequest, athleteId: string): Promise<Video>;
  updateVideoStatus(id: number, status: string): Promise<Video>;

  // Feedback
  getVideoFeedback(videoId: number): Promise<VideoFeedback[]>;
  getAllFeedback(): Promise<VideoFeedback[]>;
  createFeedback(data: CreateFeedbackRequest, adminId: string): Promise<VideoFeedback>;

  // Agreements
  createAgreement(data: CreateAgreementRequest, userId: string): Promise<Agreement>;
  getUserAgreements(userId: string): Promise<Agreement[]>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getUsers(): Promise<User[]>;
  getAthletesByParentEmail(parentEmail: string): Promise<User[]>;

  // Subscriptions
  getSubscription(userId: string): Promise<Subscription | undefined>;
  upsertSubscription(userId: string, data: Partial<CreateSubscriptionRequest>): Promise<Subscription>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined>;
  getAllSubscriptions(): Promise<Subscription[]>;
  incrementVideoCredits(userId: string): Promise<void>;

  // Announcements
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(data: CreateAnnouncementRequest, createdBy: string): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;

  // Parent Consents
  createParentConsent(athleteId: string, parentEmail: string, token: string): Promise<ParentConsent>;
  getParentConsentByToken(token: string): Promise<ParentConsent | undefined>;
  approveParentConsent(token: string): Promise<ParentConsent>;
}

export class DatabaseStorage implements IStorage {
  async getModules(): Promise<Module[]> {
    return await db.select().from(modules).orderBy(modules.orderIndex);
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [mod] = await db.select().from(modules).where(eq(modules.id, id));
    return mod;
  }

  async createModule(data: CreateModuleRequest): Promise<Module> {
    const [mod] = await db.insert(modules).values(data).returning();
    return mod;
  }

  async updateModule(id: number, data: Partial<CreateModuleRequest>): Promise<Module> {
    const [mod] = await db.update(modules).set(data).where(eq(modules.id, id)).returning();
    return mod;
  }

  async deleteModule(id: number): Promise<void> {
    await db.delete(modules).where(eq(modules.id, id));
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async completeModule(userId: string, moduleId: number): Promise<UserProgress> {
    const existing = await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.moduleId, moduleId)));
    if (existing.length > 0) return existing[0];
    const [progress] = await db.insert(userProgress).values({ userId, moduleId }).returning();
    return progress;
  }

  async getVideos(athleteId?: string): Promise<Video[]> {
    if (athleteId) {
      return await db.select().from(videos).where(eq(videos.athleteId, athleteId)).orderBy(desc(videos.submittedAt));
    }
    return await db.select().from(videos).orderBy(desc(videos.submittedAt));
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(data: CreateVideoRequest, athleteId: string): Promise<Video> {
    const [video] = await db.insert(videos).values({ ...data, athleteId }).returning();
    return video;
  }

  async updateVideoStatus(id: number, status: string): Promise<Video> {
    const [video] = await db.update(videos).set({ status }).where(eq(videos.id, id)).returning();
    return video;
  }

  async getVideoFeedback(videoId: number): Promise<VideoFeedback[]> {
    return await db.select().from(videoFeedback).where(eq(videoFeedback.videoId, videoId));
  }

  async getAllFeedback(): Promise<VideoFeedback[]> {
    return await db.select().from(videoFeedback).orderBy(desc(videoFeedback.createdAt));
  }

  async createFeedback(data: CreateFeedbackRequest, adminId: string): Promise<VideoFeedback> {
    const [feedback] = await db.insert(videoFeedback).values({ ...data, adminId }).returning();
    return feedback;
  }

  async createAgreement(data: CreateAgreementRequest, userId: string): Promise<Agreement> {
    const [agreement] = await db.insert(agreements).values({ ...data, userId }).returning();
    return agreement;
  }

  async getUserAgreements(userId: string): Promise<Agreement[]> {
    return await db.select().from(agreements).where(eq(agreements.userId, userId)).orderBy(desc(agreements.acceptedAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAthletesByParentEmail(parentEmail: string): Promise<User[]> {
    return await db.select().from(users)
      .where(and(eq(users.parentEmail, parentEmail), eq(users.role, "athlete")));
  }

  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async upsertSubscription(userId: string, data: Partial<CreateSubscriptionRequest>): Promise<Subscription> {
    const existing = await this.getSubscription(userId);
    if (existing) {
      const [sub] = await db.update(subscriptions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId))
        .returning();
      return sub;
    }
    const [sub] = await db.insert(subscriptions).values({ userId, ...data } as any).returning();
    return sub;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return sub;
  }

  async getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, stripeCustomerId));
    return sub;
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }

  async incrementVideoCredits(userId: string): Promise<void> {
    const sub = await this.getSubscription(userId);
    if (sub) {
      await db.update(subscriptions)
        .set({ videoCreditsUsed: (sub.videoCreditsUsed || 0) + 1 })
        .where(eq(subscriptions.userId, userId));
    }
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  }

  async createAnnouncement(data: CreateAnnouncementRequest, createdBy: string): Promise<Announcement> {
    const [ann] = await db.insert(announcements).values({ ...data, createdBy }).returning();
    return ann;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async createParentConsent(athleteId: string, parentEmail: string, token: string): Promise<ParentConsent> {
    const [consent] = await db.insert(parentConsents).values({ athleteId, parentEmail, token, status: "pending" }).returning();
    return consent;
  }

  async getParentConsentByToken(token: string): Promise<ParentConsent | undefined> {
    const [consent] = await db.select().from(parentConsents).where(eq(parentConsents.token, token));
    return consent;
  }

  async approveParentConsent(token: string): Promise<ParentConsent> {
    const [consent] = await db.update(parentConsents)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(parentConsents.token, token))
      .returning();
    return consent;
  }
}

export const storage = new DatabaseStorage();
