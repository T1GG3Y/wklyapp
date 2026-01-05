
'use client';

import { useCollection, useDoc, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Menu, Calendar, Receipt, ArrowDownLeft, ArrowUpRight, Edit, TrendingDown, TrendingUp, Wallet, Info } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IncomeSource extends DocumentData {
  id: string;
  name: string;
  amount: number;
  frequency: 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Yearly';
}

interface RequiredExpense extends DocumentData {
  id: string;
  category: string;
  amount: number;
  frequency: 'Weekly' | 'Monthly' | 'Yearly';
}

interface Loan extends DocumentData {
  id: string;
  name: string;
  totalBalance: number;
  paymentFrequency: 'Weekly' | 'Monthly';
}

interface DiscretionaryExpense extends DocumentData {
  id:string;
  category: string;
  plannedAmount: number;
}

interface SavingsGoal extends DocumentData {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
}

interface Transaction extends DocumentData {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: Timestamp;
  category: string;
  description?: string;
}

interface UserProfile extends DocumentData {
    startDayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
}

interface WeeklySummary extends DocumentData {
    safeToSpendRollover?: number;
    needToSpendRollover?: number;
}

const SAFE_TO_SPEND_CATEGORY = "Safe to Spend";

const ProgressCircle = ({ title, remaining, total, progress, colorClass, rollover }: { title: string, remaining: number, total: number, progress: number, colorClass: string, rollover?: number }) => (
    <div className="flex flex-col items-center gap-3">
        <div
          className="progress-circle-sm neon-glow"
          style={{
            background: `conic-gradient(${colorClass} ${progress}%, hsl(var(--muted) / 0.3) 0deg)`,
          }}
        >
            <div className="relative z-10 text-center">
                <p className={cn("text-3xl font-black tracking-tight font-headline", remaining >= 0 ? 'text-foreground' : 'text-red-500')}>
                    ${remaining.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">of ${total.toFixed(0)}</p>
            </div>
        </div>
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          {rollover !== undefined && rollover !== 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Includes ${rollover.toFixed(2)} from last week.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
    </div>
);


export default function DashboardScreen() {
  const { user } = useUser();
  const dayIndexMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const incomeSourcesPath = useMemo(() => (user ? `users/${user.uid}/incomeSources` : null), [user]);
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);
  const transactionsPath = useMemo(() => (user ? `users/${user.uid}/transactions` : null), [user]);
  const weeklySummariesPath = useMemo(() => (user ? `users/${user.uid}/weeklySummaries` : null), [user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);
  const { data: incomeSources } = useCollection<IncomeSource>(incomeSourcesPath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: transactions } = useCollection<Transaction>(transactionsPath, { orderBy: ['date', 'desc'], limit: 15 });
  const { data: weeklySummaries } = useCollection<WeeklySummary>(weeklySummariesPath, { orderBy: ['weekStartDate', 'desc'], limit: 1 });
  
  const lastWeekSummary = useMemo(() => (weeklySummaries && weeklySummaries.length > 0 ? weeklySummaries[0] : null), [weeklySummaries]);


  const getWeeklyAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'Weekly':
        return amount;
      case 'Bi-weekly':
        return amount / 2;
      case 'Monthly':
        return amount / 4.33;
      case 'Yearly':
        return amount / 52;
      default:
        return 0;
    }
  };

  const weeklyCalculations = useMemo(() => {
    const safeToSpendRollover = lastWeekSummary?.safeToSpendRollover ?? 0;
    const needToSpendRollover = lastWeekSummary?.needToSpendRollover ?? 0;

    const weeklyIncome = (incomeSources || []).reduce((total, source) => {
        return total + getWeeklyAmount(source.amount, source.frequency);
    }, 0);

    const weeklyRequiredExpenses = (requiredExpenses || []).reduce((total, expense) => {
        return total + getWeeklyAmount(expense.amount, expense.frequency);
    }, 0);
    
    const weeklyPlannedDiscretionary = (discretionaryExpenses || []).reduce((total, expense) => {
        return total + expense.plannedAmount;
    }, 0);
    
    const initialSafeToSpend = (weeklyIncome - weeklyRequiredExpenses) + safeToSpendRollover;
    const totalNeedToSpend = weeklyPlannedDiscretionary + needToSpendRollover;

    const startDay = userProfile?.startDayOfWeek || 'Sunday';
    const weekStartsOn = dayIndexMap[startDay as keyof typeof dayIndexMap];
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn });
    const weekEnd = endOfWeek(now, { weekStartsOn });

    const weeklyTransactions = (transactions || []).filter(t => {
        if (!t.date) return false;
        const transactionDate = t.date.toDate();
        return isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
    });

    const discretionaryCategories = (discretionaryExpenses || []).map(e => e.category);
    
    let weeklyActualDiscretionarySpending = 0;
    let actualSafeToSpendSpending = 0;

    for (const transaction of weeklyTransactions) {
      if (transaction.type === 'Expense') {
        if (discretionaryCategories.includes(transaction.category)) {
            weeklyActualDiscretionarySpending += transaction.amount;
        } else if (transaction.category === SAFE_TO_SPEND_CATEGORY) {
            actualSafeToSpendSpending += transaction.amount;
        }
      }
    }
    
    const remainingSafeToSpend = initialSafeToSpend - actualSafeToSpendSpending;
    const remainingNeedToSpend = totalNeedToSpend - weeklyActualDiscretionarySpending;
    
    const safeToSpendProgress = initialSafeToSpend > 0 ? (actualSafeToSpendSpending / initialSafeToSpend) * 100 : 0;
    const needToSpendProgress = totalNeedToSpend > 0 ? (weeklyActualDiscretionarySpending / totalNeedToSpend) * 100 : 0;

    return {
      initialSafeToSpend,
      remainingSafeToSpend,
      safeToSpendProgress,
      safeToSpendRollover,
      totalNeedToSpend,
      remainingNeedToSpend,
      needToSpendProgress,
      needToSpendRollover,
    };
  }, [incomeSources, requiredExpenses, discretionaryExpenses, transactions, userProfile, lastWeekSummary]);


  const { 
      initialSafeToSpend, 
      remainingSafeToSpend, 
      safeToSpendProgress,
      safeToSpendRollover,
      totalNeedToSpend,
      remainingNeedToSpend,
      needToSpendProgress,
      needToSpendRollover,
  } = weeklyCalculations;

  return (
    <>
      <header className="px-5 py-4 flex items-center justify-between sticky top-0 glass z-20">
        <h1 className="text-xl font-bold font-headline tracking-tight text-foreground">
          Dashboard
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 space-y-5 pt-4">
        <div className="glass rounded-3xl p-6 flex items-start justify-around relative">
            <ProgressCircle 
                title="Safe to Spend"
                remaining={remainingSafeToSpend}
                total={initialSafeToSpend}
                progress={safeToSpendProgress}
                colorClass="hsl(var(--primary))"
                rollover={safeToSpendRollover}
            />
            <ProgressCircle 
                title="Need to Spend"
                remaining={remainingNeedToSpend}
                total={totalNeedToSpend}
                progress={needToSpendProgress}
                colorClass="hsl(var(--secondary))"
                rollover={needToSpendRollover}
            />
        </div>
        
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <Receipt className="text-white h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold font-headline text-foreground">
                Recent Activity
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center text-center mb-6">
            <Button asChild className="w-full" size="lg">
              <Link href="/transaction/new">Add a transaction</Link>
            </Button>
          </div>

          <div className="space-y-1">
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <Link key={transaction.id} href={`/transaction/edit/${transaction.id}`} className="block group">
                  <div className="flex items-center gap-4 p-2 rounded-lg group-hover:bg-muted">
                    <div className={cn("size-10 rounded-lg flex items-center justify-center", transaction.type === 'Income' ? 'bg-primary/10' : 'bg-secondary/10')}>
                      {transaction.type === 'Income' ? (
                        <ArrowUpRight className="text-primary" />
                      ) : (
                        <ArrowDownLeft className="text-secondary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{transaction.description || transaction.category}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date ? format(transaction.date.toDate(), 'MMM d, yyyy') : ''}</p>
                    </div>
                    <p className={cn("font-bold text-lg", transaction.type === 'Income' ? 'text-primary' : 'text-secondary')}>
                      {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </p>
                     <Edit className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent transactions.</p>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
