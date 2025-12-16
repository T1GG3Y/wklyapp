
'use client';

import { useCollection, useDoc, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Menu, Calendar, Receipt, ArrowDownLeft, ArrowUpRight, Edit, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';
import { cn } from '@/lib/utils';

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


export default function DashboardScreen() {
  const { user } = useUser();
  const dayIndexMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const incomeSourcesPath = useMemo(() => (user ? `users/${user.uid}/incomeSources` : null), [user]);
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);
  const transactionsPath = useMemo(() => (user ? `users/${user.uid}/transactions` : null), [user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);
  const { data: incomeSources } = useCollection<IncomeSource>(incomeSourcesPath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: transactions } = useCollection<Transaction>(transactionsPath, { orderBy: ['date', 'desc'], limit: 15 });

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
    const weeklyIncome = (incomeSources || []).reduce((total, source) => {
        return total + getWeeklyAmount(source.amount, source.frequency);
    }, 0);

    const weeklyRequiredExpenses = (requiredExpenses || []).reduce((total, expense) => {
        return total + getWeeklyAmount(expense.amount, expense.frequency);
    }, 0);
    
    const weeklyPlannedDiscretionary = (discretionaryExpenses || []).reduce((total, expense) => {
        return total + expense.plannedAmount;
    }, 0);
    
    // "Safe to Spend" is what's left after required expenses.
    const safeToSpend = weeklyIncome - weeklyRequiredExpenses;

    // Filter transactions to only include those from the current week
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

    const weeklyActualDiscretionarySpending = weeklyTransactions.reduce((total, transaction) => {
        if (transaction.type === 'Expense' && discretionaryCategories.includes(transaction.category)) {
            return total + transaction.amount;
        }
        return total;
    }, 0);
    
    const remainingBudget = weeklyPlannedDiscretionary - weeklyActualDiscretionarySpending;
    const weeklyNet = weeklyIncome - weeklyRequiredExpenses - weeklyActualDiscretionarySpending; // This might need refinement based on total spending
    const spendingProgress = weeklyPlannedDiscretionary > 0 ? (weeklyActualDiscretionarySpending / weeklyPlannedDiscretionary) * 100 : 0;

    return {
      safeToSpend,
      weeklyPlannedDiscretionary,
      weeklyActualSpending: weeklyActualDiscretionarySpending,
      remainingBudget,
      weeklyNet,
      weeklyIncome,
      spendingProgress,
    };
  }, [incomeSources, requiredExpenses, discretionaryExpenses, transactions, userProfile]);


  const { safeToSpend, weeklyPlannedDiscretionary, remainingBudget, weeklyNet, weeklyIncome, spendingProgress } = weeklyCalculations;

  return (
    <>
      <header className="px-5 py-3 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-sm z-20 border-b">
        <Button variant="ghost" size="icon">
          <Menu className="text-muted-foreground" />
        </Button>
        <h1 className="text-lg font-bold font-headline tracking-tight text-foreground">
          Dashboard
        </h1>
        <Button variant="ghost" size="icon">
          <Calendar className="text-muted-foreground" />
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4 pt-2">
        <div className="bg-card rounded-2xl p-6 shadow-soft flex flex-col items-center justify-center relative">
            <div className="progress-circle" style={{background: `conic-gradient(hsl(var(--primary)) ${spendingProgress}%, hsl(var(--muted)) 0deg)`}}>
                <div className="relative z-10 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                    <p className={cn("text-3xl font-bold tracking-tight font-headline", remainingBudget >= 0 ? 'text-primary' : 'text-red-500')}>
                        ${remainingBudget.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">of ${weeklyPlannedDiscretionary.toFixed(2)}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center mt-6 w-full">
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">Safe to Spend</p>
                    <p className="text-xl font-bold text-foreground">${safeToSpend.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">Need to Spend</p>
                    <p className="text-xl font-bold text-foreground">${weeklyPlannedDiscretionary.toFixed(2)}</p>
                </div>
            </div>
        </div>
        
        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="text-primary h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold font-headline text-foreground">
                Recent Activity
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center text-center mb-6">
            <Button asChild className="w-full h-12 shadow-lg shadow-primary/25" size="lg">
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

    
