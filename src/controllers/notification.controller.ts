import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { getDb } from "../config/db.js";
import { notificationSchema, type NotificationDocument } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function collection() {
  return getDb().collection<NotificationDocument>("notifications");
}

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { unread } = req.query;
    const filter: Record<string, unknown> = { userId: req.user!.sub };
    if (unread === "true") filter.read = false;

    const notifications = await collection()
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ notifications });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const parsed = notificationSchema.parse(req.body);
    const now = new Date().toISOString();
    const doc: NotificationDocument = {
      ...parsed,
      _id: randomUUID(),
      userId: req.user!.sub,
      createdAt: now,
      updatedAt: now,
    };

    await collection().insertOne(doc);
    res.status(201).json({ notification: doc });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const result = await collection().updateOne(
      { _id: req.params.id, userId: req.user!.sub },
      { $set: { read: true, updatedAt: new Date().toISOString() } },
    );
    if (result.matchedCount === 0) throw ApiError.notFound("Notification not found");
    res.json({ message: "Marked as read" });
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await collection().updateMany(
      { userId: req.user!.sub, read: false },
      { $set: { read: true, updatedAt: new Date().toISOString() } },
    );
    res.json({ message: "All notifications marked as read" });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await collection().deleteOne({
      _id: req.params.id,
      userId: req.user!.sub,
    });
    if (result.deletedCount === 0) throw ApiError.notFound("Notification not found");
    res.status(200).json({ message: "Notification deleted" });
  }),
};
