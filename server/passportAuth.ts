/**
 * Passport.js configuration — LocalStrategy with bcrypt password verification.
 * Sessions are stored in PostgreSQL via connect-pg-simple.
 *
 * serializeUser  → stores user.id (string) in the session
 * deserializeUser → loads the full user record from the DB on each request
 */
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as any).id as string);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email.toLowerCase().trim());
        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid email or password." });
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: "Invalid email or password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
