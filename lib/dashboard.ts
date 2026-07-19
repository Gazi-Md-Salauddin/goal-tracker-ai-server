import type { Activity, Goal, GoalCategory } from './types';
import { isOverdue } from './goal-utils';

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  productivityScore: number;
}

export function computeStats(goals: Goal[]): DashboardStats {
  const total = goals.length;
  const completed = goals.filter((g) => g.completed).length;
  const overdue = goals.filter(isOverdue).length;
  const pending = total - completed;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const avgProgress =
    total > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / total)
      : 0;
  const productivityScore = total === 0 ? 0 : Math.round((completionRate + avgProgress) / 2);
  return { total, completed, pending, overdue, completionRate, productivityScore };
}

export function weeklyProgress(goals: Goal[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const day = (today.getDay() + 6) % 7; // 0 = Mon
  const start = new Date(today);
  start.setDate(today.getDate() - day);
  return days.map((label, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayStr = d.toISOString().slice(0, 10);
    const created = goals.filter((g) => g.createdAt.slice(0, 10) === dayStr).length;
    const completed = goals.filter(
      (g) => g.completed && g.updatedAt.slice(0, 10) === dayStr
    ).length;
    return { day: label, created, completed };
  });
}

export function monthlyProgress(goals: Goal[]) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const now = new Date();
  const out: { month: string; created: number; completed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const created = goals.filter((g) => g.createdAt.slice(0, 7) === key).length;
    const completed = goals.filter(
      (g) => g.completed && g.updatedAt.slice(0, 7) === key
    ).length;
    out.push({ month: months[d.getMonth()], created, completed });
  }
  return out;
}

export function categoryBreakdown(goals: Goal[]) {
  const map = new Map<GoalCategory, number>();
  for (const g of goals) {
    map.set(g.category, (map.get(g.category) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
}

export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export function computeBadges(goals: Goal[], activity: Activity[]): BadgeInfo[] {
  const completed = goals.filter((g) => g.completed).length;
  const total = goals.length;
  const highDone = goals.filter((g) => g.completed && g.priority === 'high').length;
  const streak = computeStreak(activity);
  return [
    {
      id: 'first_goal',
      name: 'First Step',
      description: 'Create your first goal',
      icon: 'Target',
      unlocked: total >= 1,
    },
    {
      id: 'five_goals',
      name: 'Getting Serious',
      description: 'Create 5 goals',
      icon: 'ListChecks',
      unlocked: total >= 5,
    },
    {
      id: 'first_complete',
      name: 'First Win',
      description: 'Complete your first goal',
      icon: 'CheckCircle2',
      unlocked: completed >= 1,
    },
    {
      id: 'five_complete',
      name: 'On a Roll',
      description: 'Complete 5 goals',
      icon: 'Trophy',
      unlocked: completed >= 5,
    },
    {
      id: 'high_achiever',
      name: 'High Achiever',
      description: 'Complete a high-priority goal',
      icon: 'Flame',
      unlocked: highDone >= 1,
    },
    {
      id: 'streak_3',
      name: 'Consistent',
      description: '3-day activity streak',
      icon: 'Zap',
      unlocked: streak >= 3,
    },
    {
      id: 'streak_7',
      name: 'Unstoppable',
      description: '7-day activity streak',
      icon: 'Rocket',
      unlocked: streak >= 7,
    },
    {
      id: 'productive_80',
      name: 'Productivity Pro',
      description: 'Reach a productivity score of 80+',
      icon: 'Sparkles',
      unlocked: computeStats(goals).productivityScore >= 80,
    },
  ];
}

export function computeStreak(activity: Activity[]): number {
  if (!activity.length) return 0;
  const days = new Set(activity.map((a) => a.createdAt.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
