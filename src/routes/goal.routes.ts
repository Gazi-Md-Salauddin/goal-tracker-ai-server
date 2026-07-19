import { Router } from "express";
import { goalController } from "../controllers/goal.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const goalRoutes = Router();

goalRoutes.use(requireAuth);

goalRoutes.get("/", goalController.list);
goalRoutes.post("/", goalController.create);
goalRoutes.get("/:id", goalController.get);
goalRoutes.patch("/:id", goalController.update);
goalRoutes.put("/:id", goalController.update);
goalRoutes.delete("/:id", goalController.remove);
