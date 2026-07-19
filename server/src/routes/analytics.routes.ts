import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAuth);

analyticsRoutes.get("/overview", analyticsController.overview);
analyticsRoutes.get("/weekly", analyticsController.weekly);
analyticsRoutes.get("/monthly", analyticsController.monthly);
analyticsRoutes.get("/categories", analyticsController.categories);
