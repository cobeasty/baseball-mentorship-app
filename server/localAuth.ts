/**
 * Local email/password authentication
 * Handles sign-up and sign-in for athletes and parents who don't use Replit OAuth.
 */
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const SALT_ROUNDS = 12;

export const signupSchema = z.object({
  email: z.string().email("Valid email address required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  firstName: z.string().min(1, "First name required").max(50),
  lastName: z.string().min(1, "Last name required").max(50),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email address required"),
  password: z.string().min(1, "Password required"),
});

export async function createLocalUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  // Check if email is already taken
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = randomUUID();

  const [user] = await db
    .insert(users)
    .values({
      id,
      email: email.toLowerCase(),
      firstName,
      lastName,
      passwordHash,
      role: "athlete", // default — changed during onboarding
      approvalStatus: "pending",
      tier: "none",
    })
    .returning();

  return user;
}

export async function verifyLocalUser(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user || !user.passwordHash) {
    // Generic message — do not reveal whether email exists
    throw new Error("Invalid email or password.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password.");
  }

  return user;
}

/**
 * Build a session user object compatible with the existing isAuthenticated
 * middleware. We set expires_at far in the future (30 days) and mark this
 * as a local auth session so token-refresh logic is skipped.
 */
export function buildLocalSessionUser(userId: string) {
  return {
    claims: { sub: userId },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    authType: "local" as const,
  };
}
