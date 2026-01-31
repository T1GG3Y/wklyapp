'use client';

import { useCollection, useUser } from '@/firebase';
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
  CreditCard,
  Dog,
  Dumbbell,
  Flame,
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
  Shield,
  ShieldAlert,
  Shirt,
  ShoppingBasket,
  Smile,
  Sparkles,
  Tv,
  Trash2,
  Users,
  Wallet,
  Wifi,
  Wrench,
  Droplet,
  Edit,
  Baby,
  Hammer,
  Bike,
  User,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import type { DocumentData } from 'firebase/firestore';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { TopNav } from '@/components/TopNav';
import { formatCurrency, getWeeklyAmount } from '@/lib/format';
import { PAGE_SUBHEADERS, type Frequency } from '@/lib/constants';

// Data Interfaces
interface IncomeSource extends DocumentData {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
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

// Icon Mappings for Essential Expenses
const essentialExpenseIcons: Record<string, LucideIcon> = {
  'Groceries': ShoppingBasket,
  'Rent/Mortgage': Home,
  'Natural Gas': Flame,
  'Electrical': Lightbulb,
  'Water/Sewer': Droplet,
  'Garbage': Trash2,
  'Phone': Phone,
  'Gas/Parking/Tolls': Car,
  'Auto Insurance': Shield,
  'Auto Maintenance': Wrench,
  'Auto Registration': FileText,
  'Medical': Heart,
  'Dental': Smile,
  'Miscellaneous': MoreHorizontal,
};

// Icon Mappings for Discretionary Expenses
const discretionaryExpenseIcons: Record<string, LucideIcon> = {
  'Personal Care': Sparkles,
  'Apparel': Shirt,
  'House Maintenance': Hammer,
  'TV Service': Tv,
  'Internet': Wifi,
  'Children Activities': Baby,
  'Date Activities': Heart,
  'Family Activities': Users,
  'Vacation': Plane,
  'Fitness': Dumbbell,
  'Gifts': Gift,
  'Pets': Dog,
  'Subscriptions': CreditCard,
  'Personal Expenses': User,
  'Miscellaneous': MoreHorizontal,
};

// Icon Mappings for Loans
const loanIcons: Record<string, LucideIcon> = {
  'Credit Cards': CreditCard,
  'Auto Loan': Car,
  'Home Mortgages': Home,
  'Student Loan': GraduationCap,
  'Miscellaneous': MoreHorizontal,
};

// Icon Mappings for Savings Goals
const savingsGoalIcons: Record<string, LucideIcon> = {
  'Emergency Fund': ShieldAlert,
  'House Purchase': Home,
  'Automobile': Car,
  'Vacation': Plane,
  'Recreation Equipment': Bike,
  'Education': GraduationCap,
  'Miscellaneous': MoreHorizontal,
  'Income Balance': Wallet,
};

// LocalStorage key for accordion state
const ACCORDION_STATE_KEY = 'wkly_budget_accordion_state';

export default function BudgetScreen() {
  const { user } = useUser();

  // Accordion state with localStorage persistence
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved accordion state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACCORDION_STATE_KEY);
      if (saved) {
        try {
          setExpandedItems(JSON.parse(saved));
        } catch {
          setExpandedItems(['item-1', 'item-2', 'item-3', 'item-4', 'item-5']);
        }
      } else {
        setExpandedItems(['item-1', 'item-2', 'item-3', 'item-4', 'item-5']);
      }
      setIsInitialized(true);
    }
  }, []);

  // Save accordion state to localStorage
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(ACCORDION_STATE_KEY, JSON.stringify(expandedItems));
    }
  }, [expandedItems, isInitialized]);

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

  // Memoized totals
  const totalWeeklyIncome = useMemo(() => {
    return (incomeSources || []).reduce(
      (total, source) => total + getWeeklyAmount(source.amount, source.frequency),
      0
    );
  }, [incomeSources]);

  const totalWeeklyRequired = useMemo(() => {
    return (requiredExpenses || []).reduce(
      (total, expense) => total + getWeeklyAmount(expense.amount, expense.frequency),
      0
    );
  }, [requiredExpenses]);

  const totalWeeklyDiscretionary = useMemo(() => {
    return (discretionaryExpenses || []).reduce(
      (total, expense) => total + expense.plannedAmount,
      0
    );
  }, [discretionaryExpenses]);

  const totalDebt = useMemo(() => {
    return (loans || []).reduce((total, loan) => total + loan.totalBalance, 0);
  }, [loans]);

  const totalSavingsTarget = useMemo(() => {
    return (savingsGoals || [])
      .filter((g) => g.category !== 'Income Balance')
      .reduce((total, goal) => total + goal.targetAmount, 0);
  }, [savingsGoals]);

  const totalSaved = useMemo(() => {
    return (savingsGoals || [])
      .filter((g) => g.category !== 'Income Balance')
      .reduce((total, goal) => total + goal.currentAmount, 0);
  }, [savingsGoals]);

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
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col">
      <PageHeader
        title="MY BUDGET PLAN"
        subheader={PAGE_SUBHEADERS.budgetPlan}
        rightContent={<TopNav />}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 space-y-3 pt-4">
        <Accordion
          type="multiple"
          value={expandedItems}
          onValueChange={setExpandedItems}
          className="w-full space-y-2"
        >
          {/* My Income */}
          <AccordionItem value="item-1" className="glass rounded-2xl px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                  <Wallet className="text-white size-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">My Income</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalWeeklyIncome)} / week
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="divide-y border-t">
              <div className="pt-2 pb-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/setup/income">
                    <Edit className="mr-2 size-4" /> Edit My Income
                  </Link>
                </Button>
              </div>
              {incomeSources?.map((item) =>
                renderListItem(
                  item.id,
                  Briefcase,
                  item.name,
                  `${formatCurrency(item.amount)} ${item.frequency}`
                )
              )}
            </AccordionContent>
          </AccordionItem>

          {/* My Essential Expenses */}
          <AccordionItem value="item-2" className="glass rounded-2xl px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                  <Home className="text-white size-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">My Essential Expenses</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalWeeklyRequired)} / week
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="divide-y border-t">
              <div className="pt-2 pb-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/setup/required-expenses">
                    <Edit className="mr-2 size-4" /> Edit My Essential Expenses
                  </Link>
                </Button>
              </div>
              {requiredExpenses?.map((item) =>
                renderListItem(
                  item.id,
                  essentialExpenseIcons[item.category] || Wallet,
                  item.name || item.category,
                  `${formatCurrency(item.amount)} ${item.frequency}`
                )
              )}
            </AccordionContent>
          </AccordionItem>

          {/* My Discretionary Expenses */}
          <AccordionItem value="item-3" className="glass rounded-2xl px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                  <ShoppingBasket className="text-white size-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">My Discretionary Expenses</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalWeeklyDiscretionary)} / week
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="divide-y border-t">
              <div className="pt-2 pb-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/setup/discretionary">
                    <Edit className="mr-2 size-4" /> Edit My Discretionary Expenses
                  </Link>
                </Button>
              </div>
              {discretionaryExpenses?.map((item) =>
                renderListItem(
                  item.id,
                  discretionaryExpenseIcons[item.category] || Wallet,
                  item.name || item.category,
                  `${formatCurrency(item.plannedAmount)} / week`
                )
              )}
            </AccordionContent>
          </AccordionItem>

          {/* My Loans */}
          <AccordionItem value="item-4" className="glass rounded-2xl px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                  <Landmark className="text-white size-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">My Loans</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalDebt)} total balance
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="divide-y border-t">
              <div className="pt-2 pb-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/setup/loans">
                    <Edit className="mr-2 size-4" /> Edit My Loans
                  </Link>
                </Button>
              </div>
              {loans?.map((item) =>
                renderListItem(
                  item.id,
                  loanIcons[item.category] || CreditCard,
                  item.name,
                  `${formatCurrency(item.totalBalance)} balance`
                )
              )}
            </AccordionContent>
          </AccordionItem>

          {/* My Planned Savings Goals */}
          <AccordionItem value="item-5" className="glass rounded-2xl px-4">
            <AccordionTrigger className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                  <PiggyBank className="text-white size-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">My Planned Savings Goals</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(totalSaved)} of {formatCurrency(totalSavingsTarget)} saved
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="divide-y border-t">
              <div className="pt-2 pb-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/setup/savings">
                    <Edit className="mr-2 size-4" /> Edit My Planned Savings Goals
                  </Link>
                </Button>
              </div>
              {savingsGoals
                ?.filter((g) => g.category !== 'Income Balance')
                .map((item) =>
                  renderListItem(
                    item.id,
                    savingsGoalIcons[item.category] || PiggyBank,
                    item.name,
                    <div className="flex flex-col">
                      <span>
                        {item.targetAmount > 0
                          ? `${((item.currentAmount / item.targetAmount) * 100).toFixed(0)}% saved`
                          : '0% saved'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(item.currentAmount)} of {formatCurrency(item.targetAmount)}
                      </span>
                    </div>
                  )
                )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </div>
  );
}
