import type { Express, NextFunction } from "express";
import { authStorage } from "./storage";
import { createLocalUser, signupSchema } from "../../localAuth";
import { z } from "zod";
import passport from "../../passportAuth";

function userPublic(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export function registerAuthRoutes(app: Express): void {
  // ─── Get current authenticated user ────────────────────────────────────────
  app.get("/api/auth/user", (req: any, res) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return res.json(userPublic(req.user));
    }
    return res.status(401).json({ message: "Unauthorized" });
  });

  // ─── Sign up ────────────────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req: any, res, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName } = signupSchema.parse(req.body);
      const user = await createLocalUser(email, password, firstName, lastName);
      req.login(user, (err: any) => {
        if (err) return next(err);
        res.status(201).json({ user: userPublic(user) });
      });
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
  app.post("/api/auth/login", (req: any, res, next: NextFunction) => {
    passport.authenticate(
      "local",
      (err: any, user: any, info: { message?: string }) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid email or password." });
        }
        req.login(user, (loginErr: any) => {
          if (loginErr) return next(loginErr);
          return res.json({ user: userPublic(user) });
        });
      }
    )(req, res, next);
  });

  // ─── Sign out ───────────────────────────────────────────────────────────────
  app.post("/api/auth/logout", (req: any, res, next: NextFunction) => {
    req.logout((err: any) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  });
}
