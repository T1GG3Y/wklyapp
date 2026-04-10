// WKLY App Budget Utilities
// Two-path budget engine: target-date (Path B) + simple rollover (Path A)

import { startOfWeek, differenceInWeeks, addMonths, addWeeks, addYears, subMonths, subWeeks, subYears, parseISO, startOfDay, isBefore, isEqual } from 'date-fns';
import { getWeeklyAmount } from './format';
import type { Frequency } from './constants';

/**
 * Path A: Simple rollover (unchanged from original).
 * For categories WITHOUT a due date (e.g., Groceries $100/week).
 *
 * Available = (weeksElapsed × weeklyBudget) − totalSpentAllTime
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

/**
 * Count how many times `startDay` occurs between two dates.
 * Counts the week containing `from` and every subsequent startDay up to (but not including)
 * the week containing `to`. Always returns at least 1.
 */
export function countStartDays(from: Date, to: Date, weekStartsOn: number): number {
  const fromWeekStart = startOfWeek(from, { weekStartsOn });
  const toWeekStart = startOfWeek(to, { weekStartsOn });
  const weeks = differenceInWeeks(toWeekStart, fromWeekStart);
  return Math.max(1, weeks + 1);
}

/**
 * Walk backwards from a reference `dueDate` by `frequency` increments
 * to find the most recent due date at or before `asOfDate`.
 */
export function getPrevDueDate(dueDate: Date, frequency: Frequency, asOfDate: Date): Date {
  let candidate = startOfDay(dueDate);
  const target = startOfDay(asOfDate);

  // If dueDate is in the future, walk backwards to find the most recent past occurrence
  while (isBefore(target, candidate) && !isEqual(target, candidate)) {
    candidate = subtractFrequency(candidate, frequency);
  }

  // If dueDate is in the past, walk forward until we overshoot, then step back once
  if (isBefore(candidate, target)) {
    while (isBefore(candidate, target) || isEqual(candidate, target)) {
      const next = addFrequency(candidate, frequency);
      if (isBefore(target, next)) break;
      candidate = next;
    }
  }

  return candidate;
}

/**
 * Get the next due date after `prevDue`.
 */
export function getNextDueDate(prevDue: Date, frequency: Frequency): Date {
  return addFrequency(prevDue, frequency);
}

function addFrequency(date: Date, frequency: Frequency): Date {
  switch (frequency) {
    case 'Weekly': return addWeeks(date, 1);
    case 'Bi-Weekly': return addWeeks(date, 2);
    case 'Twice a month': return addWeeks(date, 2); // approximate
    case 'Monthly': return addMonths(date, 1);
    case 'Quarterly': return addMonths(date, 3);
    case 'Semi-Annual': return addMonths(date, 6);
    case 'Yearly': return addYears(date, 1);
    case 'One time': return addYears(date, 100); // effectively never repeats
    default: return addMonths(date, 1);
  }
}

function subtractFrequency(date: Date, frequency: Frequency): Date {
  switch (frequency) {
    case 'Weekly': return subWeeks(date, 1);
    case 'Bi-Weekly': return subWeeks(date, 2);
    case 'Twice a month': return subWeeks(date, 2); // approximate
    case 'Monthly': return subMonths(date, 1);
    case 'Quarterly': return subMonths(date, 3);
    case 'Semi-Annual': return subMonths(date, 6);
    case 'Yearly': return subYears(date, 1);
    case 'One time': return subYears(date, 100);
    default: return subMonths(date, 1);
  }
}

/**
 * Path B: Target-date formula.
 * For categories WITH a due date (e.g., Electric $400/month, due 29th).
 *
 * Guarantees Available = billAmount on the due date by computing a
 * cycle-specific weekly rate: billAmount / sundaysBetween(prevDue, nextDue).
 */
export function calculateAvailableTargetDate(
  billAmount: number,
  frequency: Frequency,
  dueDate: Date,
  weekStartsOn: number,
  spentThisCycle: number,
): { available: number; weeklyRate: number } {
  const now = new Date();
  const prevDue = getPrevDueDate(dueDate, frequency, now);
  const nextDue = getNextDueDate(prevDue, frequency);

  const sundaysBetween = countStartDays(prevDue, nextDue, weekStartsOn);
  const weeklyRate = billAmount / sundaysBetween;

  const sundaysSincePrev = countStartDays(prevDue, now, weekStartsOn);
  // Cap at sundaysBetween so we don't exceed the bill amount
  const effectiveSundays = Math.min(sundaysSincePrev, sundaysBetween);

  const available = effectiveSundays * weeklyRate - spentThisCycle;

  return { available, weeklyRate };
}

/**
 * Convenience wrapper: picks Path A or Path B based on whether `dueDate` is set.
 * Returns both `available` and the effective `weeklyRate` for display.
 */
export function getAvailable(opts: {
  amount: number;
  frequency: Frequency;
  dueDate: string | null;       // yyyy-MM-dd or null
  startDay: number;             // 0=Sun..6=Sat
  totalSpentAllTime: number;    // used by Path A
  budgetStartDate: Date;        // used by Path A
  spentThisCycle: number;       // used by Path B
}): { available: number; weeklyRate: number } {
  if (opts.dueDate) {
    const dueDateObj = parseISO(opts.dueDate);
    return calculateAvailableTargetDate(
      opts.amount,
      opts.frequency,
      dueDateObj,
      opts.startDay,
      opts.spentThisCycle,
    );
  } else {
    const weeklyRate = getWeeklyAmount(opts.amount, opts.frequency);
    const available = calculateAvailable(
      weeklyRate,
      opts.totalSpentAllTime,
      opts.budgetStartDate,
      opts.startDay,
    );
    return { available, weeklyRate };
  }
}

/**
 * Compute spent-this-cycle for a single category.
 * Filters transactions to [prevDue, nextDue) window.
 * Expense → positive, Income → negative (same as allTimeSpent convention).
 */
export function getSpentThisCycle(
  transactions: Array<{ category: string; type: string; amount: number; date?: { toDate(): Date } }>,
  categoryDisplayName: string,
  dueDate: string,
  frequency: Frequency,
): number {
  const dueDateObj = parseISO(dueDate);
  const now = new Date();
  const prevDue = getPrevDueDate(dueDateObj, frequency, now);
  const nextDue = getNextDueDate(prevDue, frequency);

  let spent = 0;
  for (const tx of transactions) {
    if ((tx.category || '') !== categoryDisplayName) continue;
    if (!tx.date) continue;
    const txDate = tx.date.toDate();
    if (txDate < prevDue || txDate >= nextDue) continue;
    if (tx.type === 'Expense') spent += Math.abs(tx.amount);
    else if (tx.type === 'Income') spent -= Math.abs(tx.amount);
  }
  return spent;
}
