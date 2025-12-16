
'use client';

import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Briefcase,
  Car,
  ChevronRight,
  Coffee,
  CreditCard,
  Dog,
  Dumbbell,
  FileText,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  Lightbulb,
  MoreHorizontal,
  Phone,
  PiggyBank,
  Plane,
  Recycle,
  School,
  Shield,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Tv,
  Users,
  Utensils,
  Wallet,
  Wrench,
  Wifi,
  Droplet,
  Edit,
} from 'lucide-react';
import { useMemo } from 'react';
import type { DocumentData } from 'firebase/firestore';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

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
  category: string;
  totalBalance: number;
}

interface SavingsGoal extends DocumentData {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
}

// Icon Mappings
const requiredExpenseIcons: { [key: string]: LucideIcon } = {
  'Rent/Mortgage': Home,
  Insurance: Shield,
  Taxes: Landmark,
  'Natural Gas': Droplet,
  Electrical: Lightbulb,
  Water: Droplet,
  Garbage: Recycle,
  Phone: Phone,
  'Gas/Parking/Tolls': Car,
  'Auto Maintenance': Wrench,
  'Auto Registration': FileText,
  Medical: Heart,
  Dental: Briefcase,
};

const discretionaryExpenseIcons: { [key: string]: LucideIcon } = {
    Groceries: ShoppingBasket,
    'Dining Out': Utensils,
    'Personal Care': Sparkles,
    Clothes: Shirt,
    'House Maintenance': Wrench,
    'Cable TV': Tv,
    Internet: Wifi,
    Date: Coffee,
    'Family Activities': Users,
    Vacation: Plane,
    Gym: Dumbbell,
    Gifts: Gift,
    Pets: Dog,
    Subscriptions: CreditCard,
    Miscellaneous: MoreHorizontal,
};

const loanIcons: { [key: string]: LucideIcon } = {
  'Credit Card': CreditCard,
  Auto: Car,
  Mortgage: Home,
  Student: School,
};

const savingsGoalIcons: { [key: string]: LucideIcon } = {
    'Vacation': Plane,
    'Car': Car,
    'House down payment': Home,
    'Education': GraduationCap,
    'Emergency/back-up': PiggyBank,
};


export default function BudgetScreen() {
  const { user } = useUser();

  // Firestore paths
  const incomeSourcesPath = useMemo(() => (user ? `users/${user.uid}/incomeSources` : null), [user]);
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);
  const loansPath = useMemo(() => (user ? `users/${user.uid}/loans` : null), [user]);
  const savingsGoalsPath = useMemo(() => (user ? `users/${user.uid}/savingsGoals` : null), [user]);

  // Data fetching
  const { data: incomeSources } = useCollection<IncomeSource>(incomeSourcesPath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: loans } = useCollection<Loan>(loansPath);
  const { data: savingsGoals } = useCollection<SavingsGoal>(savingsGoalsPath);

  // Helper to get weekly amounts
  const getWeeklyAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'Weekly': return amount;
      case 'Bi-weekly': return amount / 2;
      case 'Monthly': return amount / 4.33;
      case 'Yearly': return amount / 52;
      default: return 0;
    }
  };

  // Memoized totals
  const totalWeeklyIncome = useMemo(() => {
    return (incomeSources || []).reduce((total, source) => total + getWeeklyAmount(source.amount, source.frequency), 0);
  }, [incomeSources]);

  const totalWeeklyRequired = useMemo(() => {
    return (requiredExpenses || []).reduce((total, expense) => total + getWeeklyAmount(expense.amount, expense.frequency), 0);
  }, [requiredExpenses]);
  
  const totalWeeklyDiscretionary = useMemo(() => {
    return (discretionaryExpenses || []).reduce((total, expense) => total + expense.plannedAmount, 0);
  }, [discretionaryExpenses]);
  
  const totalSavingsTarget = useMemo(() => {
    return (savingsGoals || []).reduce((total, goal) => total + goal.targetAmount, 0);
  }, [savingsGoals]);
  
  const totalDebt = useMemo(() => {
    return (loans || []).reduce((total, loan) => total + loan.totalBalance, 0);
  }, [loans]);

  const renderListItem = (
    key: string,
    Icon: LucideIcon,
    primaryText: string,
    secondaryText: string | React.ReactNode
  ) => (
    <div key={key} className="flex items-center gap-4 py-3">
      <div className="flex items-center justify-center rounded-lg bg-muted text-foreground shrink-0 size-10 border">
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-semibold truncate">{primaryText}</p>
        <div className="text-sm text-muted-foreground">{secondaryText}</div>
      </div>
      <ChevronRight className="size-5 text-muted-foreground" />
    </div>
  );
  

  return (
    <>
      <header className="px-5 py-3 flex items-center justify-center sticky top-0 bg-background/90 backdrop-blur-sm z-20 border-b">
        <h1 className="text-lg font-bold font-headline tracking-tight text-foreground">
          My Budget
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4 pt-2">
        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full space-y-2">
            
          {/* Income Sources */}
          <AccordionItem value="item-1" className='bg-card rounded-lg border px-4 shadow-sm'>
            <AccordionTrigger className='py-4'>
                <div className='flex items-center gap-3'>
                    <Wallet className='text-primary size-5'/>
                    <div className='text-left'>
                        <p className='font-semibold text-foreground'>Income</p>
                        <p className='text-xs text-muted-foreground'>${totalWeeklyIncome.toFixed(2)} / week</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className='divide-y border-t'>
              <div className="pt-2 pb-3">
                  <Button variant="outline" className="w-full" asChild>
                      <Link href="/setup/income">
                          <Edit className="mr-2 size-4" /> Edit Income
                      </Link>
                  </Button>
              </div>
              {incomeSources?.map(item => renderListItem(
                item.id,
                Briefcase,
                item.name,
                `$${item.amount.toFixed(2)} ${item.frequency}`
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Required Expenses */}
          <AccordionItem value="item-2" className='bg-card rounded-lg border px-4 shadow-sm'>
            <AccordionTrigger className='py-4'>
                 <div className='flex items-center gap-3'>
                    <Home className='text-primary size-5'/>
                    <div className='text-left'>
                        <p className='font-semibold text-foreground'>Required</p>
                        <p className='text-xs text-muted-foreground'>${totalWeeklyRequired.toFixed(2)} / week</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className='divide-y border-t'>
              <div className="pt-2 pb-3">
                  <Button variant="outline" className="w-full" asChild>
                      <Link href="/setup/required-expenses">
                          <Edit className="mr-2 size-4" /> Edit Required
                      </Link>
                  </Button>
              </div>
              {requiredExpenses?.map(item => renderListItem(
                item.id,
                requiredExpenseIcons[item.category] || Wallet,
                item.category,
                `$${item.amount.toFixed(2)} ${item.frequency}`
              ))}
            </AccordionContent>
          </AccordionItem>
          
          {/* Discretionary Spending */}
          <AccordionItem value="item-3" className='bg-card rounded-lg border px-4 shadow-sm'>
            <AccordionTrigger className='py-4'>
                <div className='flex items-center gap-3'>
                    <ShoppingBasket className='text-primary size-5'/>
                    <div className='text-left'>
                        <p className='font-semibold text-foreground'>Discretionary</p>
                        <p className='text-xs text-muted-foreground'>${totalWeeklyDiscretionary.toFixed(2)} / week</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className='divide-y border-t'>
               <div className="pt-2 pb-3">
                  <Button variant="outline" className="w-full" asChild>
                      <Link href="/setup/discretionary">
                          <Edit className="mr-2 size-4" /> Edit Discretionary
                      </Link>
                  </Button>
              </div>
              {discretionaryExpenses?.map(item => renderListItem(
                item.id,
                discretionaryExpenseIcons[item.category] || Wallet,
                item.category,
                `$${item.plannedAmount.toFixed(2)} / week`
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Loans */}
          <AccordionItem value="item-4" className='bg-card rounded-lg border px-4 shadow-sm'>
            <AccordionTrigger className='py-4'>
                <div className='flex items-center gap-3'>
                    <Landmark className='text-primary size-5'/>
                    <div className='text-left'>
                        <p className='font-semibold text-foreground'>Loans</p>
                        <p className='text-xs text-muted-foreground'>${totalDebt.toFixed(2)} total</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className='divide-y border-t'>
               <div className="pt-2 pb-3">
                  <Button variant="outline" className="w-full" asChild>
                      <Link href="/setup/loans">
                          <Edit className="mr-2 size-4" /> Edit Loans
                      </Link>
                  </Button>
              </div>
              {loans?.map(item => renderListItem(
                item.id,
                loanIcons[item.category] || CreditCard,
                item.name,
                `$${item.totalBalance.toFixed(2)} balance`
              ))}
            </AccordionContent>
          </AccordionItem>
          
          {/* Savings Goals */}
          <AccordionItem value="item-5" className='bg-card rounded-lg border px-4 shadow-sm'>
            <AccordionTrigger className='py-4'>
                <div className='flex items-center gap-3'>
                    <PiggyBank className='text-primary size-5'/>
                    <div className='text-left'>
                        <p className='font-semibold text-foreground'>Savings Goals</p>
                        <p className='text-xs text-muted-foreground'>${totalSavingsTarget.toFixed(2)} target</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className='divide-y border-t'>
               <div className="pt-2 pb-3">
                  <Button variant="outline" className="w-full" asChild>
                      <Link href="/setup/savings">
                          <Edit className="mr-2 size-4" /> Edit Savings
                      </Link>
                  </Button>
              </div>
              {savingsGoals?.map(item => renderListItem(
                item.id,
                savingsGoalIcons[item.category] || PiggyBank,
                item.name,
                 <div className='flex flex-col'>
                    <span>${(item.currentAmount / item.targetAmount * 100).toFixed(0)}% saved</span>
                    <span className='text-xs text-muted-foreground'>${item.currentAmount.toFixed(2)} of ${item.targetAmount.toFixed(2)}</span>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </>
  );
}
