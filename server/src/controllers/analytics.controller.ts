import type { Request, Response } from "express";
import { getDb } from "../config/db.js";
import type { GoalDocument } from "../models/goal.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  return startOfDay(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
}

export const analyticsController = {
  overview: asyncHandler(async (req: Request, res: Response) => {
    const goalsCol = getDb().collection<GoalDocument>("goals");
    const userId = req.user!.sub;

    const [total, active, completed, archived] = await Promise.all([
      goalsCol.countDocuments({ userId }),
      goalsCol.countDocuments({ userId, status: "active" }),
      goalsCol.countDocuments({ userId, status: "completed" }),
      goalsCol.countDocuments({ userId, status: "archived" }),
    ]);

    const allGoals = await goalsCol.find({ userId }).toArray();
    const allTasks = allGoals.flatMap((g) => g.tasks ?? []);
    const tasksDone = allTasks.filter((t) => t.done).length;
    const tasksTotal = allTasks.length;
    const productivity = tasksTotal === 0 ? 0 : Math.round((tasksDone / tasksTotal) * 100);

    const overdue = allGoals.filter((g) => g.deadline && new Date(g.deadline) < new Date() && g.status !== "completed").length;

    res.json({
      stats: { total, active, completed, archived, tasksDone, tasksTotal, productivity, overdue },
    });
  }),

  weekly: asyncHandler(async (req: Request, res: Response) => {
    const goalsCol = getDb().collection<GoalDocument>("goals");
    const userId = req.user!.sub;
    const since = daysAgo(6);

    const goals = await goalsCol
      .find({ userId, createdAt: { $gte: since.toISOString() } })
      .toArray();

    const buckets: { date: string; created: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = daysAgo(i);
      const next = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const created = goals.filter((g) => new Date(g.createdAt) >= day && new Date(g.createdAt) < next).length;
      const completed = goals.filter(
        (g) => g.status === "completed" && g.updatedAt >= day.toISOString() && g.updatedAt < next.toISOString(),
      ).length;
      buckets.push({ date: day.toISOString().slice(0, 10), created, completed });
    }

    res.json({ weekly: buckets });
  }),

  monthly: asyncHandler(async (req: Request, res: Response) => {
    const goalsCol = getDb().collection<GoalDocument>("goals");
    const userId = req.user!.sub;
    const since = daysAgo(29);

    const goals = await goalsCol
      .find({ userId, createdAt: { $gte: since.toISOString() } })
      .toArray();

    const buckets: { date: string; created: number; completed: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = daysAgo(i);
      const next = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const created = goals.filter((g) => new Date(g.createdAt) >= day && new Date(g.createdAt) < next).length;
      const completed = goals.filter(
        (g) => g.status === "completed" && g.updatedAt >= day.toISOString() && g.updatedAt < next.toISOString(),
      ).length;
      buckets.push({ date: day.toISOString().slice(0, 10), created, completed });
    }

    res.json({ monthly: buckets });
  }),

  categories: asyncHandler(async (req: Request, res: Response) => {
    const goalsCol = getDb().collection<GoalDocument>("goals");
    const userId = req.user!.sub;
    const goals = await goalsCol.find({ userId }).toArray();

    const byCategory: Record<string, number> = {};
    for (const g of goals) {
      byCategory[g.category] = (byCategory[g.category] ?? 0) + 1;
    }

    res.json({ categories: byCategory });
  }),
};
