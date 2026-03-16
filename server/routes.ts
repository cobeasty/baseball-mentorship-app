import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated, setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { getUncachableStripeClient } from "./stripeClient";
import { TIER_PRICES, getTierFromPriceId } from "./stripe";
import crypto from "crypto";

// ─── Admin middleware ─────────────────────────────────────────────────────────
// Applies AFTER isAuthenticated — enforces admin role
async function requireAdmin(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.claims?.sub;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await storage.getUser(userId);
  if (user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// ─── Self-or-admin middleware ─────────────────────────────────────────────────
// Allows user to access their own resource, or admin to access any
function requireSelfOrAdmin(getTargetId: (req: any) => string) {
  return async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const targetId = getTargetId(req);
    if (userId === targetId) return next();
    const user = await storage.getUser(userId);
    if (user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  const { registerChatRoutes } = await import("./replit_integrations/chat");
  registerChatRoutes(app);

  // ─── Users ────────────────────────────────────────────────────────────────

  // Update user — self only (or admin). Server-side age validation enforced.
  app.put(
    api.users.update.path,
    isAuthenticated,
    requireSelfOrAdmin((req) => req.params.id),
    async (req: any, res) => {
      try {
        const input = api.users.update.input.parse(req.body);
        const requesterId = req.user.claims.sub;
        const targetId = req.params.id;
        const requester = await storage.getUser(requesterId);

        // Server-side age gate: non-admins cannot bypass age restriction
        if (input.dateOfBirth && requester?.role !== "admin") {
          const ageMs =
            Date.now() - new Date(input.dateOfBirth).getTime();
          const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
          if (ageYears < 14) {
            return res.status(400).json({
              message:
                "Access restricted: This platform is for athletes ages 14–18.",
            });
          }
          if (ageYears >= 19) {
            return res.status(400).json({
              message:
                "Access restricted: This platform is for high school athletes ages 14–18.",
            });
          }
        }

        // Non-admins cannot self-approve or change their own tier
        if (requester?.role !== "admin") {
          delete input.approvalStatus;
          delete input.tier;
        }

        const data: any = { ...input };
        if (input.dateOfBirth) data.dateOfBirth = new Date(input.dateOfBirth);
        const user = await storage.updateUser(targetId, data);
        res.json(user);
      } catch (err) {
        if (err instanceof z.ZodError)
          return res.status(400).json({ message: err.errors[0].message });
        throw err;
      }
    }
  );

  // List all users — admin only
  app.get(
    api.users.list.path,
    isAuthenticated,
    requireAdmin,
    async (_req, res) => {
      const allUsers = await storage.getUsers();
      res.json(allUsers);
    }
  );

  // Suspend user — admin only
  app.post(
    "/api/users/:id/suspend",
    isAuthenticated,
    requireAdmin,
    async (req, res) => {
      try {
        const user = await storage.updateUser(req.params.id, {
          approvalStatus: "suspended",
        });
        res.json(user);
      } catch {
        res.status(400).json({ message: "Failed to suspend user" });
      }
    }
  );

  // Approve user — admin only
  app.post(
    "/api/users/:id/approve",
    isAuthenticated,
    requireAdmin,
    async (req, res) => {
      try {
        const user = await storage.updateUser(req.params.id, {
          approvalStatus: "active",
        });
        res.json(user);
      } catch {
        res.status(400).json({ message: "Failed to approve user" });
      }
    }
  );

  // Get agreements — self or admin
  app.get(
    "/api/users/:id/agreements",
    isAuthenticated,
    requireSelfOrAdmin((req) => req.params.id),
    async (req, res) => {
      const agreements = await storage.getUserAgreements(req.params.id);
      res.json(agreements);
    }
  );

  // Get athletes by parent email — authenticated (parent portal)
  app.get(
    "/api/users/by-parent-email",
    isAuthenticated,
    async (req: any, res) => {
      const { email } = req.query;
      if (!email)
        return res.status(400).json({ message: "Email required" });
      // Only allow querying own email (unless admin)
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (
        user?.role !== "admin" &&
        user?.email?.toLowerCase() !== (email as string).toLowerCase()
      ) {
        return res
          .status(403)
          .json({ message: "You can only view your own linked athletes" });
      }
      const athletes = await storage.getAthletesByParentEmail(email as string);
      res.json(athletes);
    }
  );

  // ─── Modules ──────────────────────────────────────────────────────────────

  // List modules — requires authentication (not publicly accessible)
  app.get(api.modules.list.path, isAuthenticated, async (_req, res) => {
    const mods = await storage.getModules();
    res.json(mods);
  });

  // Create module — admin only
  app.post(
    api.modules.create.path,
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const input = api.modules.create.input.parse(req.body);
        const mod = await storage.createModule(input);
        res.status(201).json(mod);
      } catch (err) {
        if (err instanceof z.ZodError)
          return res.status(400).json({ message: err.errors[0].message });
        throw err;
      }
    }
  );

  // Update module — admin only
  app.put(
    "/api/modules/:id",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
          return res.status(400).json({ message: "Invalid module ID" });
        const input = api.modules.update.input.parse(req.body);
        const mod = await storage.updateModule(id, input);
        res.json(mod);
      } catch (err) {
        if (err instanceof z.ZodError)
          return res.status(400).json({ message: err.errors[0].message });
        res.status(400).json({ message: "Failed to update module" });
      }
    }
  );

  // Delete module — admin only
  app.delete(
    "/api/modules/:id",
    isAuthenticated,
    requireAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
          return res.status(400).json({ message: "Invalid module ID" });
        await storage.deleteModule(id);
        res.json({ success: true });
      } catch {
        res.status(400).json({ message: "Failed to delete module" });
      }
    }
  );

  // ─── Progress ─────────────────────────────────────────────────────────────

  // Get own progress
  app.get(
    api.progress.list.path,
    isAuthenticated,
    async (req: any, res) => {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    }
  );

  // Get progress for specific user — self or admin
  app.get(
    "/api/progress/:userId",
    isAuthenticated,
    requireSelfOrAdmin((req) => req.params.userId),
    async (req, res) => {
      const progress = await storage.getUserProgress(req.params.userId);
      res.json(progress);
    }
  );

  // Mark module complete — self only
  app.post(
    api.progress.complete.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { moduleId } = req.body;
        if (!moduleId || typeof moduleId !== "number") {
          return res.status(400).json({ message: "Valid moduleId required" });
        }
        const userId = req.user.claims.sub;
        const progress = await storage.completeModule(userId, moduleId);
        res.status(201).json(progress);
      } catch {
        res.status(400).json({ message: "Invalid request" });
      }
    }
  );

  // ─── Videos ───────────────────────────────────────────────────────────────

  // List videos — admins see all, athletes see own
  app.get(
    api.videos.list.path,
    isAuthenticated,
    async (req: any, res) => {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const vids =
        user?.role === "admin"
          ? await storage.getVideos()
          : await storage.getVideos(userId);
      res.json(vids);
    }
  );

  // Submit video — requires Tier 2+ subscription with remaining credits
  app.post(
    api.videos.create.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const input = api.videos.create.input.parse(req.body);
        const userId = req.user.claims.sub;

        const sub = await storage.getSubscription(userId);
        const tier = sub?.tier || "none";

        if (tier === "none" || tier === "tier1") {
          return res.status(403).json({
            message:
              "Video submissions require a Tier 2 or higher subscription. Please upgrade your plan.",
          });
        }

        const creditsUsed = sub?.videoCreditsUsed || 0;
        const creditsLimit = sub?.videoCreditsLimit || 0;

        if (creditsUsed >= creditsLimit) {
          return res.status(403).json({
            message: `You have used all ${creditsLimit} video credits for this billing period. Credits reset at the start of your next billing cycle.`,
          });
        }

        const video = await storage.createVideo(input, userId);
        await storage.incrementVideoCredits(userId);
        res.status(201).json(video);
      } catch (err) {
        if (err instanceof z.ZodError)
          return res.status(400).json({ message: err.errors[0].message });
        throw err;
      }
    }
  );

  // Update video status — admin only
  app.patch(
    api.videos.updateStatus.path,
    isAuthenticated,
    requireAdmin,
    async (req, res) => {
      try {
        const validStatuses = ["submitted", "review", "completed"];
        const { status } = req.body;
        if (!validStatuses.includes(status)) {
          return res
            .status(400)
            .json({ message: "Invalid status value" });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id))
          return res.status(400).json({ message: "Invalid video ID" });
        const video = await storage.updateVideoStatus(id, status);
        res.json(video);
      } catch {
        res.status(400).json({ message: "Invalid request" });
      }
    }
  );

  // ─── Feedback ─────────────────────────────────────────────────────────────

  // Create feedback — admin only
  app.post(
    api.feedback.create.path,
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const input = api.feedback.create.input.parse(req.body);
        const adminId = req.user.claims.sub;
        const feedback = await storage.createFeedback(input, adminId);
        res.status(201).json(feedback);
      } catch (err) {
        if (err instanceof z.ZodError)
          return res.status(400).json({ message: err.errors[0].message });
        throw err;
      }
    }
  );

  // Get feedback for a video — authenticated (athlete sees own video's feedback)
  app.get(
    api.feedback.list.path,
    isAuthenticated,
    async (req: any, res) => {
      const videoId = parseInt(req.params.videoId);
      if (isNaN(videoId))
        return res.status(400).json({ message: "Invalid video ID" });

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (user?.role !== "admin") {
        // Verify the video belongs to this user
        const videos = await storage.getVideos(userId);
        const owns = videos.some((v) => v.id === videoId);
        if (!owns) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const feedback = await storage.getVideoFeedback(videoId);
      res.json(feedback);
    }
  );

  // ─── Agreements ───────────────────────────────────────────────────────────

  app.post(
    api.agreements.create.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { agreementType } = req.body;
        if (!agreementType)
          return res.status(400).json({ message: "agreementType required" });
        const userId = req.user.claims.sub;
        const agreement = await storage.createAgreement(
          { agreementType },
          userId
        );
        res.status(201).json(agreement);
      } catch {
        res.status(400).json({ message: "Invalid request" });
      }
    }
  );

  // ─── Subscriptions ────────────────────────────────────────────────────────

  // Get own subscription
  app.get(
    api.subscriptions.get.path,
    isAuthenticated,
    async (req: any, res) => {
      const userId = req.user.claims.sub;
      const sub = await storage.getSubscription(userId);
      res.json(sub || null);
    }
  );

  // Create Stripe checkout session
  app.post(
    api.subscriptions.createCheckout.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const stripe = await getUncachableStripeClient().catch(() => null);
        if (!stripe) {
          return res.status(503).json({
            message:
              "Stripe is not connected. Please check your integration settings.",
          });
        }

        const { tier } = req.body;
        if (!tier || !["tier1", "tier2", "tier3"].includes(tier)) {
          return res.status(400).json({ message: "Invalid tier specified" });
        }

        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const tierInfo = TIER_PRICES[tier];
        if (!tierInfo?.priceId) {
          return res.status(400).json({
            message:
              "Subscription tier not configured. Please contact support.",
          });
        }

        let sub = await storage.getSubscription(userId);
        let customerId = sub?.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email || undefined,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              undefined,
            metadata: { userId },
          });
          customerId = customer.id;
          await storage.upsertSubscription(userId, {
            stripeCustomerId: customerId,
          });
        }

        const origin =
          req.headers.origin || `${req.protocol}://${req.headers.host}`;
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          line_items: [{ price: tierInfo.priceId, quantity: 1 }],
          success_url: `${origin}/?checkout=success`,
          cancel_url: `${origin}/subscribe?checkout=cancelled`,
          subscription_data: { metadata: { userId, tier } },
        });

        res.json({ url: session.url });
      } catch (err: any) {
        console.error("Checkout error:", err);
        res.status(500).json({
          message: err.message || "Failed to create checkout session",
        });
      }
    }
  );

  // Create Stripe billing portal session
  app.post(
    api.subscriptions.createPortal.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const stripe = await getUncachableStripeClient().catch(() => null);
        if (!stripe)
          return res.status(503).json({ message: "Stripe is not connected." });

        const userId = req.user.claims.sub;
        const sub = await storage.getSubscription(userId);
        if (!sub?.stripeCustomerId)
          return res
            .status(400)
            .json({ message: "No active subscription found." });

        const origin =
          req.headers.origin || `${req.protocol}://${req.headers.host}`;
        const portal = await stripe.billingPortal.sessions.create({
          customer: sub.stripeCustomerId,
          return_url: `${origin}/`,
        });

        res.json({ url: portal.url });
      } catch (err: any) {
        res.status(500).json({
          message: err.message || "Failed to create billing portal",
        });
      }
    }
  );

  // Cancel subscription at period end
  app.post(
    api.subscriptions.cancel.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const stripe = await getUncachableStripeClient().catch(() => null);
        if (!stripe)
          return res.status(503).json({ message: "Stripe is not connected." });

        const userId = req.user.claims.sub;
        const sub = await storage.getSubscription(userId);
        if (!sub?.stripeSubscriptionId)
          return res.status(400).json({ message: "No active subscription." });

        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        await storage.upsertSubscription(userId, { cancelAtPeriodEnd: true });

        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({
          message: err.message || "Failed to cancel subscription",
        });
      }
    }
  );

  // ─── Announcements ────────────────────────────────────────────────────────

  // List announcements — any authenticated user
  app.get(
    api.announcements.list.path,
    isAuthenticated,
    async (_req, res) => {
      const ann = await storage.getAnnouncements();
      res.json(ann);
    }
  );

  // Create announcement — admin only
  app.post(
    api.announcements.create.path,
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const input = api.announcements.create.input.parse(req.body);
        const userId = req.user.claims.sub;
        const ann = await storage.createAnnouncement(input, userId);
        res.status(201).json(ann);
      } catch (err) {
        if (err instanceof z.ZodError)
          return res.status(400).json({ message: err.errors[0].message });
        throw err;
      }
    }
  );

  // Delete announcement — admin only
  app.delete(
    "/api/announcements/:id",
    isAuthenticated,
    requireAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
          return res.status(400).json({ message: "Invalid announcement ID" });
        await storage.deleteAnnouncement(id);
        res.json({ success: true });
      } catch {
        res.status(400).json({ message: "Failed to delete announcement" });
      }
    }
  );

  // ─── Admin Metrics ────────────────────────────────────────────────────────

  app.get(
    api.admin.metrics.path,
    isAuthenticated,
    requireAdmin,
    async (_req, res) => {
      try {
        const [allUsers, allVideos, allModules] = await Promise.all([
          storage.getUsers(),
          storage.getVideos(),
          storage.getModules(),
        ]);

        const athletes = allUsers.filter((u) => u.role === "athlete");
        const metrics = {
          totalUsers: allUsers.length,
          activeAthletes: athletes.filter((u) => u.approvalStatus === "active")
            .length,
          pendingApprovals: athletes.filter(
            (u) => u.approvalStatus === "pending"
          ).length,
          suspendedUsers: allUsers.filter(
            (u) => u.approvalStatus === "suspended"
          ).length,
          tierBreakdown: {
            none: athletes.filter((u) => u.tier === "none" || !u.tier).length,
            tier1: athletes.filter((u) => u.tier === "tier1").length,
            tier2: athletes.filter((u) => u.tier === "tier2").length,
            tier3: athletes.filter((u) => u.tier === "tier3").length,
          },
          totalVideos: allVideos.length,
          pendingVideos: allVideos.filter((v) => v.status !== "completed")
            .length,
          totalModules: allModules.length,
        };

        res.json(metrics);
      } catch {
        res.status(500).json({ message: "Failed to load metrics" });
      }
    }
  );

  // ─── Parent Consent ───────────────────────────────────────────────────────

  // Send parent consent request (creates token, logs URL)
  app.post(
    "/api/parent-consent/send",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { parentEmail } = req.body;
        if (!parentEmail || !parentEmail.includes("@")) {
          return res
            .status(400)
            .json({ message: "Valid parent email required" });
        }
        const userId = req.user.claims.sub;
        const token = crypto.randomBytes(32).toString("hex");

        await storage.createParentConsent(userId, parentEmail, token);

        const origin =
          req.headers.origin || `${req.protocol}://${req.headers.host}`;
        const approvalUrl = `${origin}/api/parent-consent/approve?token=${token}`;
        console.log(
          `[consent] Parental consent link for ${parentEmail}: ${approvalUrl}`
        );

        res.json({
          success: true,
          message:
            "Consent request recorded. Share the approval link with your parent.",
          approvalUrl,
        });
      } catch {
        res.status(400).json({ message: "Failed to send consent request" });
      }
    }
  );

  // Approve parent consent (public link, no auth required)
  app.get("/api/parent-consent/approve", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).send("Invalid or missing token");
      }

      const consent = await storage.getParentConsentByToken(token);
      if (!consent) {
        return res.status(404).send("Consent request not found or expired");
      }
      if (consent.status === "approved") {
        return res.send(
          `<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0a;color:white;">
            <h1 style="color:#22c55e;">Already Approved</h1>
            <p>This account has already been activated. Your athlete can log in and start training.</p>
          </body></html>`
        );
      }

      await storage.approveParentConsent(token);
      await storage.updateUser(consent.athleteId, { approvalStatus: "active" });

      res.send(
        `<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0a;color:white;">
          <h1 style="color:#22c55e;">Consent Approved!</h1>
          <p>Your athlete's account has been activated. They can now log in and start training.</p>
          <p style="color:#888;font-size:14px;">You may close this tab.</p>
        </body></html>`
      );
    } catch {
      res.status(500).send("Error processing consent. Please try again.");
    }
  });

  // ─── Database seed (idempotent) ───────────────────────────────────────────
  try {
    const mods = await storage.getModules();
    if (mods.length === 0) {
      await Promise.all([
        storage.createModule({
          title: "Foundations of Swing",
          description: "Learn the core mechanics of an elite swing.",
          level: 1,
          orderIndex: 1,
          videoUrl: "https://example.com/video1.mp4",
        }),
        storage.createModule({
          title: "Load & Stride",
          description: "Mastering your timing and weight transfer.",
          level: 1,
          orderIndex: 2,
        }),
        storage.createModule({
          title: "Contact Zone",
          description: "Hitting through the ball with power.",
          level: 1,
          orderIndex: 3,
        }),
        storage.createModule({
          title: "Mental Approach",
          description: "Developing the competitive mindset for game day.",
          level: 2,
          orderIndex: 4,
          pdfUrl: "https://example.com/mindset.pdf",
        }),
        storage.createModule({
          title: "Pressure Situations",
          description: "Performing when it matters most.",
          level: 2,
          orderIndex: 5,
        }),
        storage.createModule({
          title: "Film Study",
          description: "Learning from your at-bats and the opposition.",
          level: 2,
          orderIndex: 6,
        }),
        storage.createModule({
          title: "Recruiting 101",
          description: "How to get noticed by college scouts.",
          level: 3,
          orderIndex: 7,
        }),
        storage.createModule({
          title: "Building Your Profile",
          description: "Crafting an athletic resume that stands out.",
          level: 3,
          orderIndex: 8,
        }),
        storage.createModule({
          title: "Communication with Coaches",
          description:
            "How to reach out and follow up with college programs.",
          level: 3,
          orderIndex: 9,
        }),
      ]);
    }
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  return httpServer;
}
