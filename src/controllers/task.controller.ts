import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { getDb } from "../config/db.js";
import { taskSchema, type GoalDocument } from "../models/goal.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function collection() {
  return getDb().collection<GoalDocument>("goals");
}

async function findOwnedGoal(goalId: string, userId: string) {
  const goal = await collection().findOne({ _id: goalId, userId });
  if (!goal) throw ApiError.notFound("Goal not found");
  return goal;
}

function recomputeProgress(goal: GoalDocument): GoalDocument {
  const tasks = goal.tasks ?? [];
  if (tasks.length === 0) {
    goal.progress = 0;
    return goal;
  }
  const done = tasks.filter((t) => t.done).length;
  goal.progress = Math.round((done / tasks.length) * 100);
  goal.status = goal.progress === 100 ? "completed" : goal.status === "completed" ? "active" : goal.status;
  return goal;
}

export const taskController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const goal = await findOwnedGoal(req.params.goalId, req.user!.sub);
    res.json({ tasks: goal.tasks ?? [] });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const goal = await findOwnedGoal(req.params.goalId, req.user!.sub);
    const task = taskSchema.parse({
      ...req.body,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });

    const tasks = [...(goal.tasks ?? []), task];
    const updated = recomputeProgress({ ...goal, tasks });

    await collection().updateOne(
      { _id: req.params.goalId, userId: req.user!.sub },
      { $set: { tasks, progress: updated.progress, status: updated.status, updatedAt: new Date().toISOString() } },
    );
    res.status(201).json({ task });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const goal = await findOwnedGoal(req.params.goalId, req.user!.sub);
    const taskId = req.params.taskId;
    const idx = (goal.tasks ?? []).findIndex((t) => t.id === taskId);
    if (idx === -1) throw ApiError.notFound("Task not found");

    const patch = taskSchema.partial().parse(req.body);
    const tasks = [...(goal.tasks ?? [])];
    tasks[idx] = { ...tasks[idx], ...patch };
    const updated = recomputeProgress({ ...goal, tasks });

    await collection().updateOne(
      { _id: req.params.goalId, userId: req.user!.sub },
      { $set: { tasks, progress: updated.progress, status: updated.status, updatedAt: new Date().toISOString() } },
    );
    res.json({ task: tasks[idx] });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const goal = await findOwnedGoal(req.params.goalId, req.user!.sub);
    const tasks = (goal.tasks ?? []).filter((t) => t.id !== req.params.taskId);
    if (tasks.length === (goal.tasks ?? []).length) {
      throw ApiError.notFound("Task not found");
    }
    const updated = recomputeProgress({ ...goal, tasks });

    await collection().updateOne(
      { _id: req.params.goalId, userId: req.user!.sub },
      { $set: { tasks, progress: updated.progress, status: updated.status, updatedAt: new Date().toISOString() } },
    );
    res.status(200).json({ message: "Task deleted" });
  }),
};
