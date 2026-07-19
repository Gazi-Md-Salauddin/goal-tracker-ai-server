import { Router } from "express";
import { goalRoutes } from "./goal.routes.js";
import { taskRoutes } from "./task.routes.js";
import { notificationRoutes } from "./notification.routes.js";
import { analyticsRoutes } from "./analytics.routes.js";
import { assistantRoutes } from "./assistant.routes.js";

export function apiRoutes(): Router {
  const router = Router();

  router.use("/goals", goalRoutes);
  router.use("/goals", taskRoutes); // /goals/:goalId/tasks
  router.use("/notifications", notificationRoutes);
  router.use("/analytics", analyticsRoutes);
  router.use("/assistant", assistantRoutes);

  return router;
}
