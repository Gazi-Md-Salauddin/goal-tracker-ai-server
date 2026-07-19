export type Priority = 'low' | 'medium' | 'high';
export type GoalCategory =
  | 'career'
  | 'health'
  | 'learning'
  | 'finance'
  | 'personal'
  | 'relationships';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: GoalCategory;
  priority: Priority;
  deadline: string; // ISO date
  progress: number; // 0-100
  completed: boolean;
  subTasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'incomplete_today'
  | 'deadline_near'
  | 'overdue'
  | 'inactive'
  | 'achievement'
  | 'ai';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'created' | 'updated' | 'completed' | 'deleted' | 'login';
  description: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
