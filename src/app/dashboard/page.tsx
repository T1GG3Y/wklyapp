'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Menu, Calendar, Receipt } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import type { DocumentData } from 'firebase/firestore';

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
  category: string;
  totalBalance: number;
  interestRate?: number;
  paymentFrequency: 'Weekly' | 'Monthly';
}

interface DiscretionaryExpense extends DocumentData {
  id:string;
  category: string;
  amount: number;
  frequency: 'Weekly' | 'Monthly';
}

interface SavingsGoal extends DocumentData {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
}


export default function DashboardScreen() {
  const { user } = useUser();

  const incomeSourcesPath = useMemo(() => (user ? `users/${user.uid}/incomeSources` : null), [user]);
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const loansPath = useMemo(() => (user ? `users/${user.uid}/loans` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);
  const savingsGoalsPath = useMemo(() => (user ? `users/${user.uid}/savingsGoals` : null), [user]);

  const { data: incomeSources } = useCollection<IncomeSource>(incomeSourcesPath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: loans } = useCollection<Loan>(loansPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: savingsGoals } = useCollection<SavingsGoal>(savingsGoalsPath);


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

  const safeToSpend = useMemo(() => {
    const weeklyIncome = (incomeSources || []).reduce((total, source) => {
        return total + getWeeklyAmount(source.amount, source.frequency);
    }, 0);

    const weeklyRequiredExpenses = (requiredExpenses || []).reduce((total, expense) => {
        return total + getWeeklyAmount(expense.amount, expense.frequency);
    }, 0);

    const weeklyDiscretionaryExpenses = (discretionaryExpenses || []).reduce((total, expense) => {
        return total + getWeeklyAmount(expense.amount, expense.frequency);
    }, 0);

    // Assuming loan payments are not explicitly stored, so not including them for now.
    // Also assuming savings contributions are not explicitly stored as transactions yet.

    return weeklyIncome - weeklyRequiredExpenses - weeklyDiscretionaryExpenses;
  }, [incomeSources, requiredExpenses, discretionaryExpenses]);


  const safeToSpendDollars = Math.floor(safeToSpend);
  const safeToSpendCents = Math.round((safeToSpend - safeToSpendDollars) * 100);

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
        <div className="bg-card rounded-2xl p-6 shadow-soft flex flex-col items-center relative">
          <div className="mt-4 mb-2 relative flex flex-col items-center justify-center">
            <div className="progress-circle">
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <div className="text-4xl font-bold text-primary tracking-tight font-headline">
                  ${safeToSpendDollars}.<span className="text-2xl align-top">{safeToSpendCents.toString().padStart(2, '0')}</span>
                </div>
                <div className="text-sm font-medium text-muted-foreground mt-1">
                  Safe-to-Spend
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="text-primary h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold font-headline text-foreground">
                Transactions
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center text-center py-4">
            <Button asChild className="w-full h-12 shadow-lg shadow-primary/25" size="lg">
              <Link href="/transaction/new">Add a transaction</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
