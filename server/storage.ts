import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  modules, userProgress, videos, videoFeedback, agreements, users,
  type Module, type UserProgress, type Video, type VideoFeedback, type Agreement, type User,
  type CreateModuleRequest, type UpdateModuleRequest, type CreateVideoRequest, type UpdateVideoRequest,
  type CreateFeedbackRequest, type CreateAgreementRequest
} from "@shared/schema";

export interface IStorage {
  // Modules
  getModules(): Promise<Module[]>;
  createModule(data: CreateModuleRequest): Promise<Module>;
  
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
  createFeedback(data: CreateFeedbackRequest, adminId: string): Promise<VideoFeedback>;
  
  // Agreements
  createAgreement(data: CreateAgreementRequest, userId: string): Promise<Agreement>;

  // Users 
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getModules(): Promise<Module[]> {
    return await db.select().from(modules).orderBy(modules.orderIndex);
  }

  async createModule(data: CreateModuleRequest): Promise<Module> {
    const [mod] = await db.insert(modules).values(data).returning();
    return mod;
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async completeModule(userId: string, moduleId: number): Promise<UserProgress> {
    const [progress] = await db.insert(userProgress).values({
      userId,
      moduleId
    }).returning();
    return progress;
  }

  async getVideos(athleteId?: string): Promise<Video[]> {
    if (athleteId) {
      return await db.select().from(videos).where(eq(videos.athleteId, athleteId));
    }
    return await db.select().from(videos);
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(data: CreateVideoRequest, athleteId: string): Promise<Video> {
    const [video] = await db.insert(videos).values({
      ...data,
      athleteId
    }).returning();
    return video;
  }

  async updateVideoStatus(id: number, status: string): Promise<Video> {
    const [video] = await db.update(videos).set({ status }).where(eq(videos.id, id)).returning();
    return video;
  }

  async getVideoFeedback(videoId: number): Promise<VideoFeedback[]> {
    return await db.select().from(videoFeedback).where(eq(videoFeedback.videoId, videoId));
  }

  async createFeedback(data: CreateFeedbackRequest, adminId: string): Promise<VideoFeedback> {
    const [feedback] = await db.insert(videoFeedback).values({
      ...data,
      adminId
    }).returning();
    return feedback;
  }

  async createAgreement(data: CreateAgreementRequest, userId: string): Promise<Agreement> {
    const [agreement] = await db.insert(agreements).values({
      ...data,
      userId
    }).returning();
    return agreement;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new DatabaseStorage();
