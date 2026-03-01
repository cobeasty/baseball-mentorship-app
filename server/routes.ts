import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated, setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { getStripeClient, TIER_PRICES, getTierFromPriceId } from "./stripe";
import crypto from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAuth(app);
  registerAuthRoutes(app);

  const { registerChatRoutes } = await import("./replit_integrations/chat");
  registerChatRoutes(app);

  // ─── Users ───────────────────────────────────────────────────────────────

  app.put(api.users.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const targetId = req.params.id;
      const data: any = { ...input };
      if (input.dateOfBirth) data.dateOfBirth = new Date(input.dateOfBirth);
      const user = await storage.updateUser(targetId, data);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get(api.users.list.path, isAuthenticated, async (req: any, res) => {
    const allUsers = await storage.getUsers();
    res.json(allUsers);
  });

  app.post("/api/users/:id/suspend", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.updateUser(req.params.id, { approvalStatus: "suspended" });
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: "Failed to suspend user" });
    }
  });

  app.post("/api/users/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.updateUser(req.params.id, { approvalStatus: "active" });
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: "Failed to approve user" });
    }
  });

  app.get("/api/users/:id/agreements", isAuthenticated, async (req: any, res) => {
    const agreements = await storage.getUserAgreements(req.params.id);
    res.json(agreements);
  });

  app.get("/api/users/by-parent-email", isAuthenticated, async (req: any, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email required" });
    const athletes = await storage.getAthletesByParentEmail(email as string);
    res.json(athletes);
  });

  // ─── Modules ─────────────────────────────────────────────────────────────

  app.get(api.modules.list.path, async (req, res) => {
    const mods = await storage.getModules();
    res.json(mods);
  });

  app.post(api.modules.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.modules.create.input.parse(req.body);
      const mod = await storage.createModule(input);
      res.status(201).json(mod);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.put("/api/modules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const mod = await storage.updateModule(id, req.body);
      res.json(mod);
    } catch (err) {
      res.status(400).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteModule(id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: "Failed to delete module" });
    }
  });

  // ─── Progress ─────────────────────────────────────────────────────────────

  app.get(api.progress.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const progress = await storage.getUserProgress(userId);
    res.json(progress);
  });

  app.get("/api/progress/:userId", isAuthenticated, async (req: any, res) => {
    const progress = await storage.getUserProgress(req.params.userId);
    res.json(progress);
  });

  app.post(api.progress.complete.path, isAuthenticated, async (req: any, res) => {
    try {
      const { moduleId } = req.body;
      const userId = req.user.claims.sub;
      const progress = await storage.completeModule(userId, moduleId);
      res.status(201).json(progress);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // ─── Videos ───────────────────────────────────────────────────────────────

  app.get(api.videos.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (user?.role === "admin") {
      const vids = await storage.getVideos();
      return res.json(vids);
    }
    const vids = await storage.getVideos(userId);
    res.json(vids);
  });

  app.post(api.videos.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.videos.create.input.parse(req.body);
      const userId = req.user.claims.sub;

      const sub = await storage.getSubscription(userId);
      const tier = sub?.tier || "none";

      if (tier === "none" || tier === "tier1") {
        return res.status(403).json({ message: "Video submissions require Tier 2 or higher subscription." });
      }

      const creditsUsed = sub?.videoCreditsUsed || 0;
      const creditsLimit = sub?.videoCreditsLimit || 0;
      if (creditsUsed >= creditsLimit) {
        return res.status(403).json({ message: `You have used all ${creditsLimit} video credits for this billing period.` });
      }

      const video = await storage.createVideo(input, userId);
      await storage.incrementVideoCredits(userId);
      res.status(201).json(video);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch(api.videos.updateStatus.path, isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const id = parseInt(req.params.id);
      const video = await storage.updateVideoStatus(id, status);
      res.json(video);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // ─── Feedback ─────────────────────────────────────────────────────────────

  app.post(api.feedback.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.feedback.create.input.parse(req.body);
      const adminId = req.user.claims.sub;
      const feedback = await storage.createFeedback(input, adminId);
      res.status(201).json(feedback);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get(api.feedback.list.path, isAuthenticated, async (req: any, res) => {
    const videoId = parseInt(req.params.videoId);
    const feedback = await storage.getVideoFeedback(videoId);
    res.json(feedback);
  });

  // ─── Agreements ───────────────────────────────────────────────────────────

  app.post(api.agreements.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const { agreementType } = req.body;
      const userId = req.user.claims.sub;
      const agreement = await storage.createAgreement({ agreementType }, userId);
      res.status(201).json(agreement);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // ─── Subscriptions ────────────────────────────────────────────────────────

  app.get(api.subscriptions.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const sub = await storage.getSubscription(userId);
    res.json(sub || null);
  });

  app.post(api.subscriptions.createCheckout.path, isAuthenticated, async (req: any, res) => {
    try {
      const stripe = getStripeClient();
      if (!stripe) return res.status(503).json({ message: "Stripe is not configured. Please connect your Stripe account." });

      const { tier } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const tierInfo = TIER_PRICES[tier];
      if (!tierInfo || !tierInfo.priceId) {
        return res.status(400).json({ message: "Invalid tier or Stripe price not configured." });
      }

      let sub = await storage.getSubscription(userId);
      let customerId = sub?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.upsertSubscription(userId, { stripeCustomerId: customerId });
      }

      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
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
      res.status(500).json({ message: err.message || "Failed to create checkout session" });
    }
  });

  app.post(api.subscriptions.createPortal.path, isAuthenticated, async (req: any, res) => {
    try {
      const stripe = getStripeClient();
      if (!stripe) return res.status(503).json({ message: "Stripe is not configured." });

      const userId = req.user.claims.sub;
      const sub = await storage.getSubscription(userId);
      if (!sub?.stripeCustomerId) return res.status(400).json({ message: "No active subscription found." });

      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${origin}/`,
      });

      res.json({ url: portal.url });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create billing portal" });
    }
  });

  app.post(api.subscriptions.cancel.path, isAuthenticated, async (req: any, res) => {
    try {
      const stripe = getStripeClient();
      if (!stripe) return res.status(503).json({ message: "Stripe is not configured." });

      const userId = req.user.claims.sub;
      const sub = await storage.getSubscription(userId);
      if (!sub?.stripeSubscriptionId) return res.status(400).json({ message: "No active subscription." });

      await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
      await storage.upsertSubscription(userId, { cancelAtPeriodEnd: true });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to cancel subscription" });
    }
  });

  // Stripe webhook
  app.post("/api/webhooks/stripe", async (req, res) => {
    const stripe = getStripeClient();
    if (!stripe) return res.status(503).send("Stripe not configured");

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;
    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent((req as any).rawBody || req.body, sig, webhookSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.subscription_data?.metadata?.userId || session.metadata?.userId;
          const tier = session.subscription_data?.metadata?.tier || session.metadata?.tier;
          if (userId && tier) {
            const tierInfo = TIER_PRICES[tier];
            await storage.upsertSubscription(userId, {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              tier,
              status: "active",
              videoCreditsLimit: tierInfo?.credits || 0,
              videoCreditsUsed: 0,
            });
            await storage.updateUser(userId, { tier, approvalStatus: "active" });
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const sub = await storage.getSubscriptionByStripeId(subscription.id);
          if (sub) {
            const tier = getTierFromPriceId(subscription.items.data[0]?.price?.id || "");
            const tierInfo = tier !== "none" ? TIER_PRICES[tier] : null;
            await storage.upsertSubscription(sub.userId, {
              tier: tier || sub.tier || "none",
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
              videoCreditsLimit: tierInfo?.credits ?? sub.videoCreditsLimit ?? 0,
            });
            await storage.updateUser(sub.userId, { tier: tier || sub.tier || "none" });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const sub = await storage.getSubscriptionByStripeId(subscription.id);
          if (sub) {
            await storage.upsertSubscription(sub.userId, { tier: "none", status: "cancelled" });
            await storage.updateUser(sub.userId, { tier: "none" });
          }
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object;
          const sub = await storage.getSubscriptionByStripeCustomerId(invoice.customer);
          if (sub) {
            await storage.upsertSubscription(sub.userId, { videoCreditsUsed: 0 });
          }
          break;
        }
      }
    } catch (err) {
      console.error("Webhook handler error:", err);
    }

    res.json({ received: true });
  });

  // ─── Announcements ────────────────────────────────────────────────────────

  app.get(api.announcements.list.path, isAuthenticated, async (req: any, res) => {
    const ann = await storage.getAnnouncements();
    res.json(ann);
  });

  app.post(api.announcements.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.announcements.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const ann = await storage.createAnnouncement(input, userId);
      res.status(201).json(ann);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.delete("/api/announcements/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteAnnouncement(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: "Failed to delete announcement" });
    }
  });

  // ─── Parent Consent ───────────────────────────────────────────────────────

  app.post("/api/parent-consent/send", isAuthenticated, async (req: any, res) => {
    try {
      const { parentEmail } = req.body;
      const userId = req.user.claims.sub;
      const token = crypto.randomBytes(32).toString("hex");

      await storage.createParentConsent(userId, parentEmail, token);

      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
      const approvalUrl = `${origin}/api/parent-consent/approve?token=${token}`;
      console.log(`Parental consent URL for ${parentEmail}: ${approvalUrl}`);

      res.json({ success: true, message: "Consent request recorded. Parent email functionality requires email provider configuration." });
    } catch (err) {
      res.status(400).json({ message: "Failed to send consent request" });
    }
  });

  app.get("/api/parent-consent/approve", async (req: any, res) => {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).send("Invalid token");

      const consent = await storage.getParentConsentByToken(token as string);
      if (!consent) return res.status(404).send("Consent request not found");
      if (consent.status === "approved") return res.send("<h2>Already approved! Your athlete can now access the platform.</h2>");

      await storage.approveParentConsent(token as string);
      await storage.updateUser(consent.athleteId, { approvalStatus: "active" });

      res.send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0a;color:white;">
          <h1 style="color:#22c55e;">Consent Approved!</h1>
          <p>Your athlete's account has been activated. They can now log in and start training.</p>
          <p style="color:#888;font-size:14px;">You can close this tab.</p>
        </body></html>
      `);
    } catch (err) {
      res.status(500).send("Error processing consent");
    }
  });

  // ─── Admin Metrics ─────────────────────────────────────────────────────────

  app.get(api.admin.metrics.path, isAuthenticated, async (req: any, res) => {
    try {
      const [allUsers, allVideos, allModules, allSubs] = await Promise.all([
        storage.getUsers(),
        storage.getVideos(),
        storage.getModules(),
        storage.getAllSubscriptions(),
      ]);

      const athletes = allUsers.filter(u => u.role === "athlete");
      const metrics = {
        totalUsers: allUsers.length,
        activeAthletes: athletes.filter(u => u.approvalStatus === "active").length,
        pendingApprovals: athletes.filter(u => u.approvalStatus === "pending").length,
        suspendedUsers: allUsers.filter(u => u.approvalStatus === "suspended").length,
        tierBreakdown: {
          none: athletes.filter(u => u.tier === "none").length,
          tier1: athletes.filter(u => u.tier === "tier1").length,
          tier2: athletes.filter(u => u.tier === "tier2").length,
          tier3: athletes.filter(u => u.tier === "tier3").length,
        },
        totalVideos: allVideos.length,
        pendingVideos: allVideos.filter(v => v.status !== "completed").length,
        totalModules: allModules.length,
      };

      res.json(metrics);
    } catch (err) {
      res.status(500).json({ message: "Failed to load metrics" });
    }
  });

  // ─── Seed ─────────────────────────────────────────────────────────────────

  try {
    const mods = await storage.getModules();
    if (mods.length === 0) {
      await storage.createModule({ title: "Foundations of Swing", description: "Learn the core mechanics of an elite swing.", level: 1, orderIndex: 1, videoUrl: "https://example.com/video1.mp4" });
      await storage.createModule({ title: "Load & Stride", description: "Mastering your timing and weight transfer.", level: 1, orderIndex: 2 });
      await storage.createModule({ title: "Contact Zone", description: "Hitting through the ball with power.", level: 1, orderIndex: 3 });
      await storage.createModule({ title: "Mental Approach", description: "Developing the competitive mindset for game day.", level: 2, orderIndex: 4, pdfUrl: "https://example.com/mindset.pdf" });
      await storage.createModule({ title: "Pressure Situations", description: "Performing when it matters most.", level: 2, orderIndex: 5 });
      await storage.createModule({ title: "Film Study", description: "Learning from your at-bats and opposition.", level: 2, orderIndex: 6 });
      await storage.createModule({ title: "Recruiting 101", description: "How to get noticed by college scouts.", level: 3, orderIndex: 7 });
      await storage.createModule({ title: "Building Your Profile", description: "Crafting an athletic resume that stands out.", level: 3, orderIndex: 8 });
      await storage.createModule({ title: "Communication with Coaches", description: "How to reach out and follow up with college programs.", level: 3, orderIndex: 9 });
    }
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  return httpServer;
}
