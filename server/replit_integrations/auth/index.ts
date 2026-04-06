import type { Response, NextFunction } from "express";

export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";

/**
 * Session-based authentication middleware (Passport).
 * Calls req.isAuthenticated() — populated by Passport after a successful login.
 * Sets req.userId so all existing route handlers continue to work unchanged.
 */
export function isAuthenticated(req: any, res: Response, next: NextFunction): void {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    req.userId = (req.user as any).id;
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
