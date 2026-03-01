import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { createLocalUser, verifyLocalUser, buildLocalSessionUser, signupSchema, loginSchema } from "../../localAuth";
import { z } from "zod";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // ─── Get current authenticated user ───────────────────────────────────────
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ─── Local auth: Sign up ────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = signupSchema.parse(req.body);
      const user = await createLocalUser(email, password, firstName, lastName);
      const sessionUser = buildLocalSessionUser(user.id);

      req.login(sessionUser, (err: any) => {
        if (err) {
          console.error("Session error after signup:", err);
          return res.status(500).json({ message: "Account created but login failed. Please sign in." });
        }
        res.status(201).json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      // Handle duplicate email
      if (err.message.includes("already exists")) {
        return res.status(409).json({ message: err.message });
      }
      console.error("Signup error:", err);
      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });

  // ─── Local auth: Sign in ────────────────────────────────────────────────
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await verifyLocalUser(email, password);
      const sessionUser = buildLocalSessionUser(user.id);

      req.login(sessionUser, (err: any) => {
        if (err) {
          console.error("Session error after login:", err);
          return res.status(500).json({ message: "Login failed. Please try again." });
        }
        res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      // Invalid credentials or no password set (Replit OAuth user)
      return res.status(401).json({ message: err.message || "Invalid email or password." });
    }
  });

  // ─── Local auth: Sign out ────────────────────────────────────────────────
  // Works for both local and Replit OIDC sessions
  app.post("/api/auth/logout", (req: any, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    });
  });
}
