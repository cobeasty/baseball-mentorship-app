import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// ─── Stripe: Initialize schema + managed webhook + backfill ─────────────────
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log("DATABASE_URL not set — skipping Stripe init", "stripe");
    return;
  }
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    await runMigrations({ databaseUrl });
    log("Stripe schema ready", "stripe");

    const { getStripeSync } = await import("./stripeClient");
    const stripeSync = await getStripeSync();

    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    if (domain) {
      const webhookUrl = `https://${domain}/api/stripe/webhook`;
      await stripeSync.findOrCreateManagedWebhook(webhookUrl);
      log(`Managed webhook registered: ${webhookUrl}`, "stripe");
    }

    // Backfill runs in the background so startup is not blocked
    stripeSync
      .syncBackfill()
      .then(() => log("Stripe backfill complete", "stripe"))
      .catch((err: any) => log(`Stripe backfill error: ${err.message}`, "stripe"));
  } catch (err: any) {
    log(`Stripe init warning: ${err.message}`, "stripe");
    // Non-fatal — app can run without Stripe (routes return 503)
  }
}

// ─── Stripe Webhook Route ────────────────────────────────────────────────────
// CRITICAL: Must be registered BEFORE express.json() to receive raw Buffer body
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }
    const sig = Array.isArray(signature) ? signature[0] : signature;
    try {
      const { processStripeWebhook } = await import("./webhookHandlers");
      await processStripeWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      log(`Webhook error: ${err.message}`, "stripe");
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

// ─── JSON + URL middleware ───────────────────────────────────────────────────
// Must come AFTER the webhook route
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Request logging ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Redact sensitive fields before logging
        const { token: _token, password: _pwd, passwordHash: _hash, ...safe } = capturedJsonResponse as any;
        logLine += ` :: ${JSON.stringify(safe)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Init Stripe before registering routes
  await initStripe();

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
