import type { Goal, GoalCategory, Priority } from './types';

export const CATEGORIES: { value: GoalCategory; label: string; color: string }[] = [
  { value: 'career', label: 'Career', color: 'hsl(221 83% 53%)' },
  { value: 'health', label: 'Health', color: 'hsl(142 71% 45%)' },
  { value: 'learning', label: 'Learning', color: 'hsl(280 65% 60%)' },
  { value: 'finance', label: 'Finance', color: 'hsl(38 92% 50%)' },
  { value: 'personal', label: 'Personal', color: 'hsl(340 75% 55%)' },
  { value: 'relationships', label: 'Relationships', color: 'hsl(190 80% 50%)' },
];

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'hsl(142 71% 45%)' },
  { value: 'medium', label: 'Medium', color: 'hsl(38 92% 50%)' },
  { value: 'high', label: 'High', color: 'hsl(0 84% 60%)' },
];

export function categoryMeta(value: GoalCategory) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
}

export function priorityMeta(value: Priority) {
  return PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[1];
}

export function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export function isOverdue(goal: Goal) {
  return !goal.completed && new Date(goal.deadline) < new Date();
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
