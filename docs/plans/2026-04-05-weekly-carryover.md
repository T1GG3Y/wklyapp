# Weekly Budget Carryover Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement weekly carryover so unused budget amounts accumulate across weeks — Available = (total weeks × weekly budget) − total spent all-time.

**Architecture:** Instead of `Available = weeklyBudget - currentWeekSpent`, compute `Available = (weeksElapsed × weeklyBudget) - totalSpentAllTime`. The `loadWeeklyTransactions` function already fetches ALL transactions but filters to current week — we change it to compute both all-time and current-week totals per category. We also need to know the "budget start date" (when to start counting weeks). We derive this from the earliest transaction date or the user's `createdAt` field.

**Tech Stack:** React, Firebase/Firestore, date-fns

---

## Current State

Both `essential-expenses/page.tsx` and `discretionary-expenses/page.tsx` have identical patterns:

```typescript
// Currently: only tracks current week spending
const weeklyAmount = getWeeklyAmount(expense.amount, expense.frequency);
const spent = weeklySpentByCategory[expense.category] || 0;
const amountAvailable = weeklyAmount - spent; // NO CARRYOVER
```

The `loadWeeklyTransactions` function fetches ALL transactions but only counts those within the current week.

## Formula

```
weeksElapsed = number of complete weeks from budgetStartDate to currentWeekStart
               + 1 (for the current in-progress week)

totalBudgeted = weeksElapsed × weeklyBudget
totalSpent    = sum of ALL expense transactions in this category (all time)
available     = totalBudgeted - totalSpent
```

Example: $10/wk groceries, 2 weeks in, spent $5 total → Available = (2 × $10) − $5 = $15 ✓

---

### Task 1: Create `calculateAvailable` utility function

**Files:**
- Create: `src/lib/budget.ts`

**Step 1: Write the utility**

```typescript
// src/lib/budget.ts
import { startOfWeek, differenceInWeeks } from 'date-fns';
import { getWeeklyAmount } from './format';
import type { Frequency } from './constants';

/**
 * Calculate available amount for a budget category with weekly carryover.
 *
 * Available = (weeksElapsed × weeklyBudget) − totalSpentAllTime
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
```

**Step 2: Commit**

```bash
git add src/lib/budget.ts
git commit -m "feat: add calculateAvailable utility for weekly carryover"
```

---

### Task 2: Update `essential-expenses/page.tsx` to use carryover

**Files:**
- Modify: `src/app/essential-expenses/page.tsx`

**Changes needed:**

1. Import `calculateAvailable` from `@/lib/budget`
2. Change `loadWeeklyTransactions` to compute **two** maps:
   - `weeklySpentByCategory` (current week only — kept for overbudget display)
   - `allTimeSpentByCategory` (all time — for carryover)
3. Track `budgetStartDate` (earliest transaction date)
4. Update the available calculation from `weeklyAmount - spent` to `calculateAvailable(...)`

**Step 1: Update the state and data loading**

In the state declarations area, add:

```typescript
const [allTimeSpentByCategory, setAllTimeSpentByCategory] = useState<Record<string, number>>({});
const [budgetStartDate, setBudgetStartDate] = useState<Date>(new Date());
```

In `loadWeeklyTransactions`, change from filtering to current-week-only to computing both:

```typescript
const loadWeeklyTransactions = useCallback(async () => {
  if (!firestore || !user || hasLoadedTransactions.current) return;
  try {
    const startDay = userProfile?.startDayOfWeek || 'Sunday';
    const weekStartsOn = dayIndexMap[startDay];
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn });
    const weekEnd = endOfWeek(now, { weekStartsOn });

    const txRef = collection(firestore, `users/${user.uid}/transactions`);
    const snapshot = await getDocs(txRef);
    const currentWeekSpent: Record<string, number> = {};
    const allTimeSpent: Record<string, number> = {};
    let earliestDate: Date | null = null;

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.type === 'Expense' && data.date) {
        const txDate = data.date.toDate();
        const cat = data.category || '';
        const amt = Math.abs(data.amount);

        // All-time totals
        allTimeSpent[cat] = (allTimeSpent[cat] || 0) + amt;

        // Track earliest transaction date
        if (!earliestDate || txDate < earliestDate) {
          earliestDate = txDate;
        }

        // Current week totals
        if (isWithinInterval(txDate, { start: weekStart, end: weekEnd })) {
          currentWeekSpent[cat] = (currentWeekSpent[cat] || 0) + amt;
        }
      }
    });

    setWeeklySpentByCategory(currentWeekSpent);
    setAllTimeSpentByCategory(allTimeSpent);
    if (earliestDate) setBudgetStartDate(earliestDate);
    hasLoadedTransactions.current = true;
  } catch (error) {
    console.error('Error loading weekly transactions:', error);
  }
}, [firestore, user, userProfile]);
```

**Step 2: Update the available calculation in the render**

Change:
```typescript
const spent = weeklySpentByCategory[expense.category] || 0;
const amountAvailable = weeklyAmount - spent;
```

To:
```typescript
const totalSpent = allTimeSpentByCategory[expense.category] || 0;
const startDay = userProfile?.startDayOfWeek || 'Sunday';
const weekStartsOn = dayIndexMap[startDay];
const amountAvailable = calculateAvailable(weeklyAmount, totalSpent, budgetStartDate, weekStartsOn);
```

**Step 3: Update overbudget calculation**

The `overBudgetTotal` in the useMemo should use weekly carryover too:
```typescript
const { weeklyTotal, overBudgetTotal } = useMemo(() => {
  if (!expenses) return { weeklyTotal: 0, overBudgetTotal: 0 };
  const weekly = expenses.reduce((total, expense) => {
    return total + getWeeklyAmount(expense.amount, expense.frequency);
  }, 0);
  const startDay = userProfile?.startDayOfWeek || 'Sunday';
  const wsOn = dayIndexMap[startDay];
  const overBudget = expenses.reduce((total, expense) => {
    const wkAmt = getWeeklyAmount(expense.amount, expense.frequency);
    const totalSpent = allTimeSpentByCategory[expense.category] || 0;
    const avail = calculateAvailable(wkAmt, totalSpent, budgetStartDate, wsOn);
    return total + (avail < 0 ? Math.abs(avail) : 0);
  }, 0);
  return { weeklyTotal: weekly, overBudgetTotal: overBudget };
}, [expenses, allTimeSpentByCategory, budgetStartDate, userProfile]);
```

**Step 4: Commit**

```bash
git add src/app/essential-expenses/page.tsx
git commit -m "feat: add weekly carryover to essential expenses available amounts"
```

---

### Task 3: Update `discretionary-expenses/page.tsx` to use carryover

**Files:**
- Modify: `src/app/discretionary-expenses/page.tsx`

**Same pattern as Task 2** — identical changes but using `expense.plannedAmount` and `expense.frequency || 'Weekly'` instead of `expense.amount` and `expense.frequency`.

**Step 1: Apply same state + loading changes as Task 2**
**Step 2: Update available calculation in render**
**Step 3: Update overbudget calculation**
**Step 4: Commit**

```bash
git add src/app/discretionary-expenses/page.tsx
git commit -m "feat: add weekly carryover to discretionary expenses available amounts"
```

---

### Task 4: Verify and push

**Step 1: Build to check for errors**

```bash
npx next build
```

**Step 2: Manual verification checklist**
- [ ] Essential expenses page shows accumulated available amounts
- [ ] Discretionary expenses page shows accumulated available amounts
- [ ] New users (no transactions) see weekly budget as available
- [ ] Categories with overspending show negative available in red
- [ ] Overbudget totals reflect carryover

**Step 3: Commit and push**

```bash
git push
```

---

## Notes

- **One-time expenses** (`frequency: 'One time'`): `getWeeklyAmount` returns 0, so they won't accumulate. This is correct — one-time expenses don't have recurring budget.
- **Budget changes**: If a user changes their budget mid-stream, the carryover will use the NEW weekly amount for all past weeks. This is a known simplification. A more complex system would track budget history, but that's out of scope.
- **Performance**: We already fetch all transactions. The only added cost is iterating them once more (trivial).
- **The `wklyapp-main/` directory**: Also needs the same changes applied if it's a separate deployment.
