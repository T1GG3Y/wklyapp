'use client';

import { useMemo, useState } from 'react';
import { useCollection, useDoc, useUser } from '@/firebase';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  isWithinInterval,
  subMonths,
  subDays,
} from 'date-fns';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { BottomNav } from '@/components/BottomNav';
import { formatCurrency, getWeeklyAmount } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Frequency } from '@/lib/constants';

interface Transaction extends DocumentData {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  date: Timestamp;
}

interface RequiredExpense extends DocumentData {
  id: string;
  category: string;
  name?: string;
  amount: number;
  frequency: Frequency;
}

interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  name?: string;
  plannedAmount: number;
  frequency?: Frequency;
}

interface Loan extends DocumentData {
  id: string;
  name: string;
  category: string;
  totalBalance: number;
  paymentFrequency: Frequency;
}

interface SavingsGoal extends DocumentData {
  id: string;
  name: string;
  category: string;
  weeklyContribution?: number;
  frequency?: Frequency;
}

interface UserProfile extends DocumentData {
  startDayOfWeek?: string;
}

interface OverBudgetRow {
  weekLabel: string;
  weekStart: Date;
  category: string;
  amountAvailable: number;
  amountSpent: number;
  overBudget: number;
}

const dayIndexMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const DATE_RANGE_OPTIONS = [
  { label: 'Last 4 Weeks', value: '4weeks' },
  { label: 'Last 8 Weeks', value: '8weeks' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

export default function ReportsScreen() {
  const { user } = useUser();
  const [dateRange, setDateRange] = useState('8weeks');

  // Paths
  const userProfilePath = useMemo(
    () => (user ? `users/${user.uid}` : null),
    [user]
  );
  const transactionsPath = useMemo(
    () => (user ? `users/${user.uid}/transactions` : null),
    [user]
  );
  const requiredExpensesPath = useMemo(
    () => (user ? `users/${user.uid}/requiredExpenses` : null),
    [user]
  );
  const discretionaryExpensesPath = useMemo(
    () => (user ? `users/${user.uid}/discretionaryExpenses` : null),
    [user]
  );
  const loansPath = useMemo(
    () => (user ? `users/${user.uid}/loans` : null),
    [user]
  );
  const savingsGoalsPath = useMemo(
    () => (user ? `users/${user.uid}/savingsGoals` : null),
    [user]
  );

  // Fetch data
  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);
  const { data: transactions, loading: txLoading } =
    useCollection<Transaction>(transactionsPath);
  const { data: requiredExpenses } =
    useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } =
    useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: loans } = useCollection<Loan>(loansPath);
  const { data: savingsGoals } = useCollection<SavingsGoal>(savingsGoalsPath);

  const weekStartsOn = useMemo(() => {
    const startDay = userProfile?.startDayOfWeek || 'Sunday';
    return dayIndexMap[startDay] ?? 0;
  }, [userProfile]);

  // Build a map of category → weekly budget amount
  const categoryBudgets = useMemo(() => {
    const budgets: Record<string, number> = {};

    // Essential expenses
    (requiredExpenses || []).forEach((expense) => {
      const name = expense.name || expense.category;
      const weekly = getWeeklyAmount(expense.amount, expense.frequency);
      budgets[name] = (budgets[name] || 0) + weekly;
    });

    // Discretionary expenses
    (discretionaryExpenses || []).forEach((expense) => {
      const name = expense.name || expense.category;
      const freq = expense.frequency || 'Weekly';
      const weekly = getWeeklyAmount(expense.plannedAmount, freq);
      budgets[name] = (budgets[name] || 0) + weekly;
    });

    // Loans (totalBalance is the payment amount per frequency)
    (loans || []).forEach((loan) => {
      const weekly = getWeeklyAmount(loan.totalBalance, loan.paymentFrequency);
      budgets[loan.name] = (budgets[loan.name] || 0) + weekly;
    });

    // Savings goals
    (savingsGoals || [])
      .filter((g) => g.category !== 'Income Balance')
      .forEach((goal) => {
        const weekly = getWeeklyAmount(
          goal.weeklyContribution || 0,
          goal.frequency || 'Weekly'
        );
        if (weekly > 0) {
          budgets[goal.name] = (budgets[goal.name] || 0) + weekly;
        }
      });

    return budgets;
  }, [requiredExpenses, discretionaryExpenses, loans, savingsGoals]);

  // Also build a category name → transaction category mapping
  // so we can match transactions to budget items
  const categoryToTransactionCategory = useMemo(() => {
    const mapping: Record<string, string[]> = {};

    (requiredExpenses || []).forEach((expense) => {
      const name = expense.name || expense.category;
      if (!mapping[name]) mapping[name] = [];
      mapping[name].push(expense.category);
      if (expense.name && expense.name !== expense.category) {
        mapping[name].push(expense.name);
      }
    });

    (discretionaryExpenses || []).forEach((expense) => {
      const name = expense.name || expense.category;
      if (!mapping[name]) mapping[name] = [];
      mapping[name].push(expense.category);
      if (expense.name && expense.name !== expense.category) {
        mapping[name].push(expense.name);
      }
    });

    (loans || []).forEach((loan) => {
      if (!mapping[loan.name]) mapping[loan.name] = [];
      mapping[loan.name].push(loan.category);
      mapping[loan.name].push(loan.name);
      mapping[loan.name].push(`Loan: ${loan.category}`);
    });

    (savingsGoals || [])
      .filter((g) => g.category !== 'Income Balance')
      .forEach((goal) => {
        if (!mapping[goal.name]) mapping[goal.name] = [];
        mapping[goal.name].push(goal.category);
        mapping[goal.name].push(goal.name);
        mapping[goal.name].push(`Savings: ${goal.category}`);
      });

    return mapping;
  }, [requiredExpenses, discretionaryExpenses, loans, savingsGoals]);

  // Calculate over budget rows
  const overBudgetRows = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const now = new Date();
    let rangeStart: Date;

    switch (dateRange) {
      case '4weeks':
        rangeStart = subDays(now, 28);
        break;
      case '8weeks':
        rangeStart = subDays(now, 56);
        break;
      case '3months':
        rangeStart = subMonths(now, 3);
        break;
      case '6months':
        rangeStart = subMonths(now, 6);
        break;
      case 'year':
        rangeStart = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        rangeStart = new Date(2020, 0, 1);
        break;
      default:
        rangeStart = subDays(now, 56);
    }

    // Get weeks in the interval
    const weeks = eachWeekOfInterval(
      { start: rangeStart, end: now },
      { weekStartsOn }
    );

    const rows: OverBudgetRow[] = [];

    for (const weekStart of weeks) {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn });

      // Get transactions for this week
      const weekTransactions = transactions.filter((t) => {
        if (!t.date || t.type !== 'Expense') return false;
        const txDate = t.date.toDate();
        return isWithinInterval(txDate, { start: weekStart, end: weekEnd });
      });

      if (weekTransactions.length === 0) continue;

      // Group spending by budget category
      const spendingByCategory: Record<string, number> = {};

      for (const tx of weekTransactions) {
        // Find which budget category this transaction belongs to
        let matched = false;
        for (const [budgetName, matchCategories] of Object.entries(
          categoryToTransactionCategory
        )) {
          if (matchCategories.includes(tx.category)) {
            spendingByCategory[budgetName] =
              (spendingByCategory[budgetName] || 0) + tx.amount;
            matched = true;
            break;
          }
        }
        // If no match, use the transaction category directly
        if (!matched) {
          spendingByCategory[tx.category] =
            (spendingByCategory[tx.category] || 0) + tx.amount;
        }
      }

      // Check each category for over-budget
      for (const [category, spent] of Object.entries(spendingByCategory)) {
        const available = categoryBudgets[category] || 0;
        const over = spent - available;

        if (over > 0.01) {
          rows.push({
            weekLabel: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
            weekStart,
            category,
            amountAvailable: available,
            amountSpent: spent,
            overBudget: over,
          });
        }
      }
    }

    // Sort by week descending, then category
    rows.sort((a, b) => {
      const weekDiff = b.weekStart.getTime() - a.weekStart.getTime();
      if (weekDiff !== 0) return weekDiff;
      return a.category.localeCompare(b.category);
    });

    return rows;
  }, [
    transactions,
    dateRange,
    weekStartsOn,
    categoryBudgets,
    categoryToTransactionCategory,
  ]);

  const loading = txLoading;

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col">
      <PageHeader
        title="MY REPORTS"
        subheader="View your over-budget categories by week."
        rightContent={<HamburgerMenu />}
      />

      <main className="flex-1 overflow-y-auto p-4 pb-40 space-y-4">
        {/* Over Budget Table Card */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {/* Header with Date Range */}
          <div className="p-4 border-b flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-foreground">
              Over Budget Table
            </h3>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="size-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table Header */}
          <div className="bg-indigo-600 text-white text-center py-2 text-sm font-bold uppercase tracking-wider">
            Over Budget Table
          </div>
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] bg-indigo-400/20 text-xs font-bold uppercase tracking-wider border-b">
            <div className="px-3 py-2.5 bg-indigo-500/30 text-indigo-900 dark:text-indigo-200">
              Week
            </div>
            <div className="px-3 py-2.5 text-foreground">Category</div>
            <div className="px-3 py-2.5 text-foreground text-right">
              Amt Available
            </div>
            <div className="px-3 py-2.5 text-foreground text-right">
              Amt Spent
            </div>
            <div className="px-3 py-2.5 text-foreground text-right">
              Over Budget
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="text-center text-muted-foreground py-10">
              Loading...
            </div>
          ) : overBudgetRows.length > 0 ? (
            <div className="divide-y">
              {overBudgetRows.map((row, i) => (
                <div
                  key={`${row.weekLabel}-${row.category}-${i}`}
                  className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] text-sm hover:bg-muted/50 transition-colors"
                >
                  <div className="px-3 py-3 bg-indigo-500/10 font-semibold text-xs text-indigo-900 dark:text-indigo-200">
                    {row.weekLabel}
                  </div>
                  <div className="px-3 py-3 font-medium truncate text-xs">
                    {row.category}
                  </div>
                  <div className="px-3 py-3 text-right tabular-nums text-xs">
                    {formatCurrency(row.amountAvailable)}
                  </div>
                  <div className="px-3 py-3 text-right tabular-nums text-xs">
                    {formatCurrency(row.amountSpent)}
                  </div>
                  <div className="px-3 py-3 text-right tabular-nums font-bold text-destructive text-xs">
                    {formatCurrency(row.overBudget)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p className="font-semibold">No over-budget categories found</p>
              <p className="text-sm mt-1">
                You&apos;re staying within budget for the selected time period.
              </p>
            </div>
          )}

          {/* Summary footer */}
          {overBudgetRows.length > 0 && (
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] bg-muted/50 border-t text-sm font-bold">
              <div className="px-3 py-3 col-span-4 text-right">
                Total Over Budget:
              </div>
              <div className="px-3 py-3 text-right tabular-nums text-destructive">
                {formatCurrency(
                  overBudgetRows.reduce((sum, row) => sum + row.overBudget, 0)
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex gap-3 pt-2">
          <Link href="/transaction/new" className="flex-1">
            <Button
              variant="outline"
              className="w-full py-3 h-12 font-semibold rounded-xl text-base gap-2"
            >
              <ArrowLeft className="size-4" />
              <span>
                <span className="font-bold">Back</span> to Transactions
              </span>
            </Button>
          </Link>
          <Link href="/profile" className="flex-1">
            <Button className="w-full py-3 h-12 font-semibold rounded-xl text-base gap-2">
              <span>
                <span className="font-bold">Continue</span> to My Profile
              </span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
