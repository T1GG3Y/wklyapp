// WKLY App Budget Utilities
// Weekly carryover calculation

import { startOfWeek, differenceInWeeks } from 'date-fns';

/**
 * Calculate available amount for a budget category with weekly carryover.
 *
 * Available = (weeksElapsed × weeklyBudget) − totalSpentAllTime
 *
 * Example: $10/wk groceries, 2 weeks in, spent $5 total → (2 × $10) − $5 = $15
 *
 * @param weeklyBudget - The weekly budget amount for this category
 * @param totalSpentAllTime - Total spent in this category across all time
 * @param budgetStartDate - When to start counting weeks (earliest transaction or account creation)
 * @param weekStartsOn - Day the week starts (0=Sun, 1=Mon, etc.)
 */
export function calculateAvailable(
  weeklyBudget: number,
  totalSpentAllTime: number,
  budgetStartDate: Date,
  weekStartsOn: number,
): number {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn });
  const firstWeekStart = startOfWeek(budgetStartDate, { weekStartsOn });

  // Number of complete weeks + 1 for the current week
  const weeksElapsed = Math.max(1, differenceInWeeks(currentWeekStart, firstWeekStart) + 1);

  const totalBudgeted = weeksElapsed * weeklyBudget;
  return totalBudgeted - totalSpentAllTime;
}
