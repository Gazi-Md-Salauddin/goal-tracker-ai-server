import { Router } from "express";
import { taskController } from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

taskRoutes.get("/:goalId/tasks", taskController.list);
taskRoutes.post("/:goalId/tasks", taskController.create);
taskRoutes.patch("/:goalId/tasks/:taskId", taskController.update);
taskRoutes.delete("/:goalId/tasks/:taskId", taskController.remove);
