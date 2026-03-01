import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated, setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  app.put(api.users.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      
      const targetId = req.params.id;
      const user = await storage.updateUser(targetId, input);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.users.list.path, isAuthenticated, async (req: any, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get(api.modules.list.path, async (req, res) => {
    const modules = await storage.getModules();
    res.json(modules);
  });

  app.post(api.modules.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.modules.create.input.parse(req.body);
      const mod = await storage.createModule(input);
      res.status(201).json(mod);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.progress.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const progress = await storage.getUserProgress(userId);
    res.json(progress);
  });

  app.post(api.progress.complete.path, isAuthenticated, async (req: any, res) => {
    try {
      const { moduleId } = req.body;
      const userId = req.user.claims.sub;
      const progress = await storage.completeModule(userId, moduleId);
      res.status(201).json(progress);
    } catch(err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get(api.videos.list.path, isAuthenticated, async (req: any, res) => {
    const videos = await storage.getVideos(); 
    res.json(videos);
  });

  app.post(api.videos.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.videos.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const video = await storage.createVideo(input, userId);
      res.status(201).json(video);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.videos.updateStatus.path, isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const id = parseInt(req.params.id);
      const video = await storage.updateVideoStatus(id, status);
      res.json(video);
    } catch(err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post(api.feedback.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.feedback.create.input.parse(req.body);
      const adminId = req.user.claims.sub;
      const feedback = await storage.createFeedback(input, adminId);
      res.status(201).json(feedback);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.feedback.list.path, isAuthenticated, async (req: any, res) => {
    const videoId = parseInt(req.params.videoId);
    const feedback = await storage.getVideoFeedback(videoId);
    res.json(feedback);
  });

  app.post(api.agreements.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const { agreementType } = req.body;
      const userId = req.user.claims.sub;
      const agreement = await storage.createAgreement({ agreementType }, userId);
      res.status(201).json(agreement);
    } catch(err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Basic seed script inside routes
  try {
    const modules = await storage.getModules();
    if (modules.length === 0) {
      await storage.createModule({
        title: "Foundations of Swing",
        description: "Learn the core mechanics of an elite swing.",
        level: 1,
        orderIndex: 1,
        videoUrl: "https://example.com/video1.mp4",
      });
      await storage.createModule({
        title: "Mental Approach",
        description: "Developing the competitive mindset for game day.",
        level: 2,
        orderIndex: 2,
        pdfUrl: "https://example.com/mindset.pdf",
      });
      await storage.createModule({
        title: "Recruiting 101",
        description: "How to get noticed by college scouts.",
        level: 3,
        orderIndex: 3,
      });
    }
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  return httpServer;
}
