import type { Express } from "express";
import { authStorage } from "./storage";
import { requireAuth, signToken } from "../../jwtAuth";
import {
  createLocalUser,
  verifyLocalUser,
  signupSchema,
  loginSchema,
} from "../../localAuth";
import { z } from "zod";

function userPublic(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export function registerAuthRoutes(app: Express): void {
  // ─── Get current authenticated user ────────────────────────────────────────
  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      res.json(userPublic(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ─── Sign up ────────────────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = signupSchema.parse(req.body);
      const user = await createLocalUser(email, password, firstName, lastName);
      const token = signToken(user.id);
      res.status(201).json({ token, user: userPublic(user) });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err.message?.includes("already exists")) {
        return res.status(409).json({ message: err.message });
      }
      console.error("Signup error:", err);
      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });

  // ─── Sign in ────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await verifyLocalUser(email, password);
      const token = signToken(user.id);
      res.json({ token, user: userPublic(user) });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(401).json({ message: err.message || "Invalid email or password." });
    }
  });

  // ─── Sign out ───────────────────────────────────────────────────────────────
  // JWT is stateless — client drops the token; server just acknowledges
  app.post("/api/auth/logout", (_req, res) => {
    res.json({ success: true });
  });
}
