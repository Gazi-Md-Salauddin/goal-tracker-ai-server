import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  done: z.boolean().default(false),
  createdAt: z.string().optional(),
});

export const goalCategoryEnum = z.enum([
  "personal",
  "work",
  "health",
  "finance",
  "education",
  "hobby",
  "other",
]);

export const goalPriorityEnum = z.enum(["low", "medium", "high"]);

export const goalStatusEnum = z.enum(["active", "completed", "archived"]);

export const goalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  category: goalCategoryEnum.default("personal"),
  priority: goalPriorityEnum.default("medium"),
  status: goalStatusEnum.default("active"),
  progress: z.number().min(0).max(100).default(0),
  deadline: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  tasks: z.array(taskSchema).default([]),
});

export type Task = z.infer<typeof taskSchema>;
export type Goal = z.infer<typeof goalSchema>;

export interface GoalDocument extends Goal {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalInput = z.infer<typeof goalSchema>;
