import { Router } from "express";
import { assistantController } from "../controllers/assistant.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const assistantRoutes = Router();

assistantRoutes.use(requireAuth);

assistantRoutes.post("/respond", assistantController.respond);
