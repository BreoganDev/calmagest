import { Goal, GoalContribution } from '@prisma/client';

export function calcGoalProgress(goal: Goal, contributions: GoalContribution[]) {
  const total = contributions.reduce((acc, c) => acc + c.amount, 0);
  const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((total / goal.targetAmount) * 100)) : 0;
  return { total, percent, remaining: Math.max(0, goal.targetAmount - total) };
}

export function calcMonthlySuggestion(goal: Goal, totalContributed: number) {
  if (!goal.targetDate) return null;
  const now = new Date();
  const monthsLeft = Math.max(1, (goal.targetDate.getFullYear() - now.getFullYear()) * 12 + (goal.targetDate.getMonth() - now.getMonth()));
  const remaining = Math.max(0, goal.targetAmount - totalContributed);
  return Math.ceil(remaining / monthsLeft);
}
