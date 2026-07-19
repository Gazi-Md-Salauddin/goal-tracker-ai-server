import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    return next(ApiError.unauthorized("Authentication token is required"));
  }
  req.user = verifyToken(token);
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // ignore — leave req.user undefined for optional auth
    }
  }
  next();
}
