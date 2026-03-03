import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // On conflict (same id), only update non-sensitive identity fields.
      // We do NOT update email on conflict to prevent unique-constraint crashes
      // when two Replit accounts share the same email address.
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (err: any) {
      // Email uniqueness conflict — a local-auth account already uses this email.
      // Gracefully look up and return that existing account so login can proceed.
      if (err.code === "23505" && err.constraint?.includes("email")) {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email!));
        if (existing) return existing;
      }
      throw err;
    }
  }
}

export const authStorage = new AuthStorage();
