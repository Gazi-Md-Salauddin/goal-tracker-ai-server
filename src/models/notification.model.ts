import { z } from "zod";

export const notificationTypeEnum = z.enum([
  "info",
  "success",
  "warning",
  "reminder",
  "achievement",
]);

export const notificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: notificationTypeEnum.default("info"),
  read: z.boolean().default(false),
  link: z.string().nullable().default(null),
});

export type Notification = z.infer<typeof notificationSchema>;

export interface NotificationDocument extends Notification {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationInput = z.infer<typeof notificationSchema>;
