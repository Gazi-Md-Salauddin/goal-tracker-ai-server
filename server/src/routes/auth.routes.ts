import { Router } from "express";
import { createAuthController, type AuthApi } from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

export function authRoutes(authApi: AuthApi): Router {
  const router = Router();
  const ctrl = createAuthController(authApi);

  router.post("/sign-up", authLimiter, ctrl.signUp);
  router.post("/sign-in", authLimiter, ctrl.signIn);
  router.post("/sign-out", ctrl.signOut);
  router.get("/me", ctrl.me);

  return router;
}
