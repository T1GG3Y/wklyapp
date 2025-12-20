
'use client';

import { Button } from '@/components/ui/button';
import { useCollection, useUser } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { DocumentData } from 'firebase/firestore';
import { Signal, Wifi, BatteryFull } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

// Data Interfaces
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

interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  plannedAmount: number;
}

interface Loan extends DocumentData {
    id: string;
    name: string;
    totalBalance: number;
    paymentFrequency: 'Weekly' | 'Monthly';
}

interface SavingsGoal extends DocumentData {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
}


export default function WeeklySummaryScreen() {
  const summaryImage = PlaceHolderImages.find(
    (img) => img.id === 'weekly-summary'
  );
  
  const { user } = useUser();

  const incomeSourcesPath = useMemo(() => (user ? `users/${user.uid}/incomeSources` : null), [user]);
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);
  const loansPath = useMemo(() => (user ? `users/${user.uid}/loans` : null), [user]);
  const savingsGoalsPath = useMemo(() => (user ? `users/${user.uid}/savingsGoals` : null), [user]);

  const { data: incomeSources } = useCollection<IncomeSource>(incomeSourcesPath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: loans } = useCollection<Loan>(loansPath);
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
        // Discretionary expenses are stored as weekly planned amounts
        return total + expense.plannedAmount;
    }, 0);

    // TODO: Add loan payments and savings contributions to the calculation
    const weeklyLoanPayments = 0;
    const weeklySavingsContributions = 0;

    return weeklyIncome - weeklyRequiredExpenses - weeklyDiscretionaryExpenses - weeklyLoanPayments - weeklySavingsContributions;
  }, [incomeSources, requiredExpenses, discretionaryExpenses, loans, savingsGoals]);

  return (
    <div className="bg-background font-sans antialiased h-screen flex flex-col overflow-hidden">
        <div className="bg-surface-dark pt-20 pb-16 px-6 flex flex-col items-center justify-center relative transition-colors duration-300">
          {summaryImage && (
            <div className="relative w-full max-w-xs aspect-[4/3] flex items-end justify-center">
              <Image
                alt={summaryImage.description}
                src={summaryImage.imageUrl}
                width={400}
                height={300}
                className="object-contain w-full h-full drop-shadow-md z-10"
                data-ai-hint={summaryImage.imageHint}
              />
            </div>
          )}
        </div>
        <div
          className="flex-1 bg-card px-6 pt-8 pb-8 flex flex-col justify-between z-10 shadow-soft transition-colors duration-300"
          style={{
            borderTopLeftRadius: '2rem',
            borderTopRightRadius: '2rem',
            marginTop: '-2rem',
          }}
        >
          <div className="flex flex-col items-center">
            <h2 className="text-muted-foreground font-medium text-lg mb-2">
              Nice work!
            </h2>
            <h1 className="text-2xl font-bold font-headline text-center text-foreground mb-8 leading-tight">
              Your weekly spending
              <br />
              limit is{' '}
              <span className="text-primary">${safeToSpend.toFixed(2)}</span>
            </h1>
            <div className="w-full space-y-3 mb-6">
              <div className="flex justify-between items-center text-base font-bold">
                <span className="text-muted-foreground">
                  Weekly spending limit
                </span>
                <span className="text-primary">${safeToSpend.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between w-full mt-8">
            <Button variant="link" asChild>
              <Link href="/setup/savings">Back</Link>
            </Button>
            <Button asChild className="py-3 px-10 rounded-full shadow-lg">
              <Link href="/dashboard">Continue</Link>
            </Button>
          </div>
        </div>
    </div>
  );
}
