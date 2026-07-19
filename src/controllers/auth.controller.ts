import type { NextFunction, Request, Response } from "express";
import { signToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";

type AuthUser = { id: string; email: string; name?: string | null };

export interface AuthApi {
  signUpEmail: (args: {
    body: { email: string; password: string; name?: string };
  }) => Promise<unknown>;
  signInEmail: (args: {
    body: { email: string; password: string };
  }) => Promise<unknown>;
  signOut: (args: {
    headers: Record<string, string | string[] | undefined>;
  }) => Promise<unknown>;
  getSession: (args: {
    headers: Record<string, string | string[] | undefined>;
  }) => Promise<{ user: AuthUser } | null>;
}

function extractUser(result: unknown): AuthUser | null {
  if (typeof result !== "object" || result === null) return null;
  const user = (result as { user?: AuthUser }).user;
  return user ?? null;
}

export function createAuthController(authApi: AuthApi) {
  return {
    signUp: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password, name } = req.body ?? {};
        if (!email || !password) {
          throw ApiError.badRequest("Email and password are required");
        }

        const result = await authApi.signUpEmail({
          body: { email, password, name },
        });

        const user = extractUser(result);
        const token = user ? signToken({ sub: user.id, email: user.email, name: user.name }) : null;

        res.status(201).json({ user, token });
      } catch (err) {
        next(err);
      }
    },

    signIn: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body ?? {};
        if (!email || !password) {
          throw ApiError.badRequest("Email and password are required");
        }

        const result = await authApi.signInEmail({
          body: { email, password },
        });

        const user = extractUser(result);
        const token = user ? signToken({ sub: user.id, email: user.email, name: user.name }) : null;

        res.status(200).json({ user, token });
      } catch (err) {
        next(err);
      }
    },

    me: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const session = await authApi.getSession({ headers: req.headers });
        if (session) {
          res.status(200).json({ user: session.user, session });
          return;
        }

        // Fallback: verify our own JWT via requireAuth middleware
        if (req.user) {
          res.status(200).json({ user: req.user });
          return;
        }

        throw ApiError.unauthorized("Not authenticated");
      } catch (err) {
        next(err);
      }
    },

    signOut: async (req: Request, res: Response, next: NextFunction) => {
      try {
        await authApi.signOut({ headers: req.headers });
        res.status(200).json({ message: "Signed out" });
      } catch (err) {
        next(err);
      }
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
