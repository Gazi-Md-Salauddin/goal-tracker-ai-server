import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get("/", notificationController.list);
notificationRoutes.post("/", notificationController.create);
notificationRoutes.patch("/:id/read", notificationController.markRead);
notificationRoutes.post("/read-all", notificationController.markAllRead);
notificationRoutes.delete("/:id", notificationController.remove);
