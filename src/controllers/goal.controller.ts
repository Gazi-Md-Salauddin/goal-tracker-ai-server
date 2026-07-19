import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { getDb } from "../config/db.js";
import { goalSchema, type Goal, type GoalDocument } from "../models/goal.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function collection() {
  return getDb().collection<GoalDocument>("goals");
}

function recomputeProgress(goal: Goal): Goal {
  const tasks = goal.tasks ?? [];
  if (tasks.length === 0) {
    goal.progress = 0;
    return goal;
  }
  const done = tasks.filter((t) => t.done).length;
  goal.progress = Math.round((done / tasks.length) * 100);
  if (goal.progress === 100) goal.status = "completed";
  return goal;
}

export const goalController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { status, category, priority, q } = req.query;
    const filter: Record<string, unknown> = { userId: req.user!.sub };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (q) filter.title = { $regex: q, $options: "i" };

    const goals = await collection()
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ goals });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const goal = await collection().findOne({
      _id: req.params.id,
      userId: req.user!.sub,
    });
    if (!goal) throw ApiError.notFound("Goal not found");
    res.json({ goal });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const parsed = goalSchema.parse(req.body);
    recomputeProgress(parsed);

    const now = new Date().toISOString();
    const doc: GoalDocument = {
      ...parsed,
      _id: randomUUID(),
      userId: req.user!.sub,
      createdAt: now,
      updatedAt: now,
    };

    await collection().insertOne(doc);
    res.status(201).json({ goal: doc });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const existing = await collection().findOne({
      _id: req.params.id,
      userId: req.user!.sub,
    });
    if (!existing) throw ApiError.notFound("Goal not found");

    const parsed = goalSchema.partial().parse(req.body);
    const merged = recomputeProgress({ ...existing, ...parsed } as Goal);

    const update: Record<string, unknown> = { ...parsed, updatedAt: new Date().toISOString() };
    if ("tasks" in parsed) update.progress = merged.progress;
    if (merged.status !== existing.status) update.status = merged.status;

    await collection().updateOne(
      { _id: req.params.id, userId: req.user!.sub },
      { $set: update },
    );
    const updated = await collection().findOne({ _id: req.params.id, userId: req.user!.sub });
    res.json({ goal: updated });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await collection().deleteOne({
      _id: req.params.id,
      userId: req.user!.sub,
    });
    if (result.deletedCount === 0) throw ApiError.notFound("Goal not found");
    res.status(200).json({ message: "Goal deleted" });
  }),
};
