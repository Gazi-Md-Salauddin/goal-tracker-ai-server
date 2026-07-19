import type { Request, Response } from "express";
import { getDb } from "../config/db.js";
import type { GoalDocument } from "../models/goal.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

type AssistantAction = "motivate" | "tasks" | "breakdown" | "advice";

const VALID_ACTIONS: AssistantAction[] = ["motivate", "tasks", "breakdown", "advice"];

function pickMotivation(productivity: number): string {
  if (productivity >= 80) return "Outstanding! You're crushing your goals — keep the momentum going!";
  if (productivity >= 50) return "Solid progress. Stay consistent and the results will compound.";
  if (productivity >= 25) return "You've started — that's the hardest part. Pick one task and finish it now.";
  return "Every big goal starts with a single step. Choose one goal and take action today.";
}

function suggestTasks(goals: GoalDocument[]): string[] {
  const suggestions: string[] = [];
  for (const g of goals.slice(0, 5)) {
    const undone = (g.tasks ?? []).filter((t) => !t.done);
    if (undone.length > 0) {
      suggestions.push(`- [${g.title}] ${undone[0].title}`);
    } else if (g.status !== "completed") {
      suggestions.push(`- [${g.title}] Define your next concrete step`);
    }
  }
  if (suggestions.length === 0) suggestions.push("- All caught up! Consider setting a new goal.");
  return suggestions;
}

function breakdownGoal(goal: GoalDocument): string[] {
  const steps = [
    `1. Clarify the outcome: what does "${goal.title}" look like when done?`,
    "2. List 3-5 milestones that mark progress toward it.",
    "3. Break each milestone into tasks under 2 hours of effort.",
    "4. Schedule the first task on your calendar this week.",
    "5. Review progress weekly and adjust the plan.",
  ];
  if (goal.deadline) {
    const days = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
    steps.push(`6. You have ~${days} days until your deadline — pace accordingly.`);
  }
  return steps;
}

function giveAdvice(goals: GoalDocument[]): string[] {
  const tips: string[] = [];
  const overdue = goals.filter((g) => g.deadline && new Date(g.deadline) < new Date() && g.status !== "completed");
  if (overdue.length > 0) {
    tips.push(`- You have ${overdue.length} overdue goal(s). Reschedule or break them down.`);
  }
  const noTasks = goals.filter((g) => (g.tasks ?? []).length === 0 && g.status !== "completed");
  if (noTasks.length > 0) {
    tips.push(`- ${noTasks.length} goal(s) have no tasks. Break them into actionable steps.`);
  }
  const highPriority = goals.filter((g) => g.priority === "high" && g.status === "active");
  if (highPriority.length > 3) {
    tips.push("- You have many high-priority goals active. Consider focusing on fewer at once.");
  }
  if (tips.length === 0) tips.push("- Your goal structure looks healthy. Keep reviewing weekly.");
  return tips;
}

export const assistantController = {
  respond: asyncHandler(async (req: Request, res: Response) => {
    const { action, goalId } = req.body ?? {};
    if (!action || !VALID_ACTIONS.includes(action)) {
      throw ApiError.badRequest(`action must be one of: ${VALID_ACTIONS.join(", ")}`);
    }

    const goalsCol = getDb().collection<GoalDocument>("goals");
    const goals = await goalsCol.find({ userId: req.user!.sub }).toArray();
    const allTasks = goals.flatMap((g) => g.tasks ?? []);
    const productivity = allTasks.length === 0 ? 0 : Math.round((allTasks.filter((t) => t.done).length / allTasks.length) * 100);

    let message = "";
    let items: string[] = [];

    switch (action) {
      case "motivate":
        message = pickMotivation(productivity);
        items = [message];
        break;
      case "tasks":
        items = suggestTasks(goals);
        message = "Here are your suggested next tasks:";
        break;
      case "breakdown": {
        const goal = goalId ? goals.find((g) => g._id === goalId) : goals.find((g) => g.status === "active");
        if (!goal) throw ApiError.notFound("No goal found to break down");
        items = breakdownGoal(goal);
        message = `Breakdown for "${goal.title}":`;
        break;
      }
      case "advice":
        items = giveAdvice(goals);
        message = "Coaching advice:";
        break;
    }

    res.json({ action, message, items, productivity });
  }),
};
