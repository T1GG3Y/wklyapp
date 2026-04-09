'use client';

import { Button } from '@/components/ui/button';
import {
  Home,
  ShoppingBasket,
  Flame,
  Droplet,
  Trash2,
  Lightbulb,
  Phone,
  Wrench,
  FileText,
  Heart,
  Smile,
  MoreHorizontal,
  Car,
  Shield,
  ShieldCheck,
  Receipt,
  CalendarIcon,
  Plus,
  Edit,
  Calculator,
  ArrowLeft,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, differenceInWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HelpDialog } from '@/components/HelpDialog';
import { BudgetTotalsBox } from '@/components/BudgetTotalsBox';
import {
  ESSENTIAL_CATEGORIES,
  FREQUENCY_OPTIONS,
  CATEGORY_HELP,
  PAGE_HELP,
  type Frequency,
} from '@/lib/constants';
import {
  formatCurrency,
  formatAmountInput,
  parseFormattedAmount,
  getWeeklyAmount,
} from '@/lib/format';
import { calculateAvailable } from '@/lib/budget';
import { useToast } from '@/hooks/use-toast';

interface RequiredExpense extends DocumentData {
  id: string;
  category: string;
  name?: string;
  amount: number;
  frequency: Frequency;
  dueDate?: string;
  description?: string;
}

interface UserProfile extends DocumentData {
  startDayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
}

interface Transaction extends DocumentData {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  date: Timestamp;
}

// Icon mapping for categories
const iconMap: Record<string, LucideIcon> = {
  'Groceries': ShoppingBasket,
  'Rent': Home,
  'Natural Gas': Flame,
  'Electrical': Lightbulb,
  'Water/Sewer': Droplet,
  'Garbage': Trash2,
  'Phone': Phone,
  'Gas/Parking/Tolls': Car,
  'Auto Insurance': Shield,
  'Auto Maintenance': Wrench,
  'Auto Registration': FileText,
  'Home Insurance': ShieldCheck,
  'Property Taxes': Receipt,
  'Medical': Heart,
  'Dental': Smile,
  'Custom': MoreHorizontal,
};

const dayIndexMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

export default function EssentialExpensesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<RequiredExpense | null>(null);
  const [weeklySpentByCategory, setWeeklySpentByCategory] = useState<Record<string, number>>({});
  const [allTimeSpentByCategory, setAllTimeSpentByCategory] = useState<Record<string, number>>({});
  const [budgetStartDateByCategory, setBudgetStartDateByCategory] = useState<Record<string, Date>>({});
  const hasLoadedTransactions = useRef(false);
  const [autoCalcResult, setAutoCalcResult] = useState<number | null>(null);

  const [formState, setFormState] = useState<{
    category: string;
    name: string;
    amount: string;
    frequency: Frequency;
    dueDate?: Date;
    description: string;
  }>({
    category: 'Groceries',
    name: '',
    amount: '',
    frequency: 'Monthly',
    dueDate: undefined,
    description: '',
  });

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const requiredExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/requiredExpenses` : null;
  }, [user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);
  const { data: expenses, loading } = useCollection<RequiredExpense>(requiredExpensesPath);

  // Fetch transactions to calculate Available amounts with weekly carryover
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
      const earliestByCategory: Record<string, Date> = {};

      snapshot.forEach((d) => {
        const data = d.data();
        if (!data.date) return;
        const txDate = data.date.toDate();
        const cat = data.category || '';

        // Expense adds to spent, Income (from Moves) subtracts from spent
        let amt = 0;
        if (data.type === 'Expense') {
          amt = Math.abs(data.amount);
        } else if (data.type === 'Income') {
          amt = -Math.abs(data.amount);
        } else {
          return;
        }

        // All-time net spent for carryover
        allTimeSpent[cat] = (allTimeSpent[cat] || 0) + amt;

        // Track earliest transaction per category
        if (!earliestByCategory[cat] || txDate < earliestByCategory[cat]) {
          earliestByCategory[cat] = txDate;
        }

        // Current week net spent
        if (isWithinInterval(txDate, { start: weekStart, end: weekEnd })) {
          currentWeekSpent[cat] = (currentWeekSpent[cat] || 0) + amt;
        }
      });

      setWeeklySpentByCategory(currentWeekSpent);
      setAllTimeSpentByCategory(allTimeSpent);
      setBudgetStartDateByCategory(earliestByCategory);
      hasLoadedTransactions.current = true;
    } catch (error) {
      console.error('Error loading weekly transactions:', error);
    }
  }, [firestore, user, userProfile]);

  useEffect(() => {
    if (user && firestore && userProfile) loadWeeklyTransactions();
  }, [user, firestore, userProfile, loadWeeklyTransactions]);

  useEffect(() => {
    if (expenseToEdit) {
      setFormState({
        category: expenseToEdit.category,
        name: expenseToEdit.name || expenseToEdit.category,
        amount: formatAmountInput(expenseToEdit.amount.toFixed(2)),
        frequency: expenseToEdit.frequency as Frequency,
        dueDate: expenseToEdit.dueDate ? parseISO(expenseToEdit.dueDate) : undefined,
        description: expenseToEdit.description || '',
      });
    }
  }, [expenseToEdit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setFormState({ ...formState, amount: formatted });
  };

  // Open category picker when "Add New Expense" is clicked
  const handleOpenCategoryPicker = () => {
    setIsCategoryPickerOpen(true);
  };

  // When a category is selected from the picker, open the edit dialog
  const handleCategorySelected = (category: string) => {
    setIsCategoryPickerOpen(false);
    setExpenseToEdit(null);
    setFormState({
      category: category,
      name: category,
      amount: '',
      frequency: 'Monthly',
      dueDate: undefined,
      description: '',
    });
    setAutoCalcResult(null);
    setIsEditDialogOpen(true);
  };

  // Open edit dialog for an existing expense
  const handleOpenEditDialog = (expense: RequiredExpense) => {
    setExpenseToEdit(expense);
    setAutoCalcResult(null);
    setIsEditDialogOpen(true);
  };

  // Check how many times a category is used
  const getCategoryCount = (categoryName: string) => {
    return (expenses || []).filter((e) => e.category === categoryName).length;
  };

  const handleSaveExpense = async () => {
    if (!firestore || !user) return;

    const expenseAmount = parseFormattedAmount(formState.amount);
    if (expenseAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (formState.category === 'Custom' && !formState.description.trim()) {
      alert('Please enter a description for Custom expenses.');
      return;
    }

    // Require description if subcategory is used more than once
    const existingCount = getCategoryCount(formState.category);
    const willBeDuplicate = expenseToEdit
      ? existingCount > 1
      : existingCount >= 1;

    if (willBeDuplicate && !formState.description.trim()) {
      alert(`Please enter a description since "${formState.category}" is used more than once.`);
      return;
    }

    const expenseData = {
      userProfileId: user.uid,
      category: formState.category,
      name: formState.category,
      amount: expenseAmount,
      frequency: formState.frequency,
      description: formState.description,
      ...(formState.dueDate && {
        dueDate: format(formState.dueDate, 'yyyy-MM-dd'),
      }),
    };

    try {
      if (expenseToEdit) {
        const expenseDocRef = doc(firestore, `users/${user.uid}/requiredExpenses`, expenseToEdit.id);
        await updateDoc(expenseDocRef, expenseData);
      } else {
        const requiredExpensesCollection = collection(firestore, `users/${user.uid}/requiredExpenses`);
        await addDoc(requiredExpensesCollection, expenseData);

        // Seed initial available balance if payment date is set
        if (formState.dueDate) {
          const weeklyAmount = getWeeklyAmount(expenseAmount, formState.frequency);
          const weeksUntilDue = Math.max(1, differenceInWeeks(formState.dueDate, new Date()) + 1);
          // Subtract an extra week because calculateAvailable always includes
          // the current week's budget (weeksElapsed starts at 1)
          const budgetWillAccumulate = weeklyAmount * (weeksUntilDue + 1);
          const initialSeed = expenseAmount - budgetWillAccumulate;

          if (initialSeed > 0) {
            const displayName = formState.description
              ? `${formState.category} - ${formState.description}`
              : formState.category;
            const txCollection = collection(firestore, `users/${user.uid}/transactions`);
            await addDoc(txCollection, {
              userProfileId: user.uid,
              type: 'Income',
              amount: initialSeed,
              description: `Initial balance seed for ${displayName}`,
              category: displayName,
              date: Timestamp.fromDate(new Date()),
              autoGenerated: true,
            });
          }
        }
      }
      setIsEditDialogOpen(false);
      setExpenseToEdit(null);
      hasLoadedTransactions.current = false;
      loadWeeklyTransactions();
    } catch (error) {
      console.error('Error saving required expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!firestore || !user) return;
    try {
      // Find the expense to get its available amount before deleting
      const expense = expenses?.find((e) => e.id === expenseId);
      if (expense) {
        const weeklyAmount = getWeeklyAmount(expense.amount, expense.frequency);
        const startDay = userProfile?.startDayOfWeek || 'Sunday';
        const wsOn = dayIndexMap[startDay];
        const displayName = expense.description ? `${expense.category} - ${expense.description}` : expense.category;
        const totalSpent = allTimeSpentByCategory[displayName] || 0;
        const catStart = budgetStartDateByCategory[displayName] || new Date();
        const available = calculateAvailable(weeklyAmount, totalSpent, catStart, wsOn);

        // If there's a positive available balance, move it to Unassigned Income
        if (available > 0) {
          const txCollection = collection(firestore, `users/${user.uid}/transactions`);
          const moveGroup = Date.now().toString();
          // Deduct from source (zeroes out the available)
          const expenseDisplayName = expense.description ? `${expense.category} - ${expense.description}` : expense.category;
          await addDoc(txCollection, {
            userProfileId: user.uid,
            type: 'Expense',
            amount: available,
            description: `Deleted: ${expense.name || expense.category}`,
            category: expenseDisplayName,
            date: Timestamp.fromDate(new Date()),
            moveGroup,
            autoGenerated: true,
          });
          // Add to Unassigned Income (Income type, matching Move pattern)
          await addDoc(txCollection, {
            userProfileId: user.uid,
            type: 'Income',
            amount: available,
            description: `From deleted: ${expense.name || expense.category}`,
            category: 'Savings: Unassigned Income',
            date: Timestamp.fromDate(new Date()),
            moveGroup,
            autoGenerated: true,
          });
        }
      }

      await deleteDoc(
        doc(firestore, `users/${user.uid}/requiredExpenses`, expenseId)
      );
      if (expenseToEdit?.id === expenseId) {
        setIsEditDialogOpen(false);
        setExpenseToEdit(null);
      }
      hasLoadedTransactions.current = false;
      loadWeeklyTransactions();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleAutoCalculate = async () => {
    if (!firestore || !user) return;

    try {
      const txRef = collection(firestore, `users/${user.uid}/transactions`);
      const q = query(txRef, where('category', '==', formState.category));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({
          title: 'Not enough data',
          description: 'No transaction history found for this category to calculate an average.',
        });
        return;
      }

      let total = 0;
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.amount && data.type === 'Expense') {
          total += Math.abs(data.amount);
          count++;
        }
      });

      if (count === 0) {
        toast({
          title: 'Not enough data',
          description: 'No expense transactions found for this category.',
        });
        return;
      }

      const average = total / count;
      setAutoCalcResult(average);
    } catch (error) {
      console.error('Error auto calculating:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not calculate average from transaction history.',
      });
    }
  };

  const { weeklyTotal, overBudgetTotal } = useMemo(() => {
    if (!expenses) return { weeklyTotal: 0, overBudgetTotal: 0 };

    const weekly = expenses.reduce((total, expense) => {
      return total + getWeeklyAmount(expense.amount, expense.frequency);
    }, 0);

    const startDay = userProfile?.startDayOfWeek || 'Sunday';
    const wsOn = dayIndexMap[startDay];
    const overBudget = expenses.reduce((total, expense) => {
      const wkAmt = getWeeklyAmount(expense.amount, expense.frequency);
      const dn = expense.description ? `${expense.category} - ${expense.description}` : expense.category;
      const totalSpent = allTimeSpentByCategory[dn] || 0;
      const catStart = budgetStartDateByCategory[dn] || new Date();
      const avail = calculateAvailable(wkAmt, totalSpent, catStart, wsOn);
      return total + (avail < 0 ? Math.abs(avail) : 0);
    }, 0);

    return { weeklyTotal: weekly, overBudgetTotal: overBudget };
  }, [expenses, allTimeSpentByCategory, budgetStartDateByCategory, userProfile]);

  // Sort expenses alphabetically by category then description
  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    return [...expenses].sort((a, b) => {
      const catCmp = a.category.localeCompare(b.category);
      if (catCmp !== 0) return catCmp;
      return (a.description || '').localeCompare(b.description || '');
    });
  }, [expenses]);

  // Display name: "Category - Description" if description exists
  const getDisplayName = (expense: RequiredExpense) => {
    const name = expense.category;
    if (expense.description) {
      return `${name} - ${expense.description}`;
    }
    return name;
  };

  // Get first expense for a category (for the category picker display)
  const getCategoryExpense = (categoryName: string) => {
    return expenses?.find((e) => e.category === categoryName);
  };

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen h-screen overflow-y-auto">
      <PageHeader
        title="MY ESSENTIAL EXPENSES"
        helpTitle="My Essential Expenses"
        helpContent={PAGE_HELP.essentialExpenses}
        subheader="For Setup select 'Add New Expense' below and start adding each Expense"
        rightContent={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/discretionary-expenses">
                Discretionary
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <HamburgerMenu />
          </div>
        }
        leftContent={
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/income">
              <ArrowLeft className="h-4 w-4" />
              Income
            </Link>
          </Button>
        }
      />

      <main className="flex-1 pb-8">
        <div className="px-4 py-4 space-y-4">
          {/* Add New Expense Button */}
          <Button
            onClick={handleOpenCategoryPicker}
            className="w-full h-12"
          >
            <Plus className="size-5 mr-2" />
            Add New Expense
          </Button>

          {/* My Essential Expense Totals */}
          <BudgetTotalsBox
            weeklyTotal={weeklyTotal}
            overbudgetTotal={overBudgetTotal}
            showOverbudget={true}
            title="My Essential Expense Totals"
          />

          {/* Planned Expenses */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 border-b text-center">
              Planned Expenses
            </h3>
            <div className="divide-y">
              {loading ? (
                <p className="text-center text-muted-foreground py-6">Loading...</p>
              ) : sortedExpenses.length > 0 ? (
                sortedExpenses.map((expense) => {
                  const Icon = iconMap[expense.category] || MoreHorizontal;
                  const weeklyAmount = getWeeklyAmount(expense.amount, expense.frequency);
                  const startDay = userProfile?.startDayOfWeek || 'Sunday';
                  const wsOn = dayIndexMap[startDay];
                  const dn = expense.description ? `${expense.category} - ${expense.description}` : expense.category;
                  const totalSpent = allTimeSpentByCategory[dn] || 0;
                  const catStart = budgetStartDateByCategory[dn] || new Date();
                  const amountAvailable = calculateAvailable(weeklyAmount, totalSpent, catStart, wsOn);

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="size-4" />
                        </div>
                        <p className="font-semibold text-foreground truncate">
                          {getDisplayName(expense)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Wk Budget</p>
                          <p className="font-semibold">{formatCurrency(weeklyAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className={cn("font-semibold", amountAvailable < 0 ? "text-destructive" : "")}>
                            {formatCurrency(amountAvailable)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleOpenEditDialog(expense)}
                        >
                          <Edit className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No expenses added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Category Picker Dialog */}
      <Dialog open={isCategoryPickerOpen} onOpenChange={setIsCategoryPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Category</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2">
            {ESSENTIAL_CATEGORIES.map(({ name }) => {
              const Icon = iconMap[name] || MoreHorizontal;
              const categoryExpenses = (expenses || []).filter((e) => e.category === name);
              const count = categoryExpenses.length;
              const isAdded = count > 0;
              const weeklyAmount = count === 1 ? getWeeklyAmount(categoryExpenses[0].amount, categoryExpenses[0].frequency) : 0;

              return (
                <button
                  key={name}
                  onClick={() => handleCategorySelected(name)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 text-center p-3 rounded-xl border transition-all duration-200 relative min-h-[80px]',
                    isAdded
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card hover:bg-muted border-border'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Icon className="size-4" />
                    <HelpDialog
                      title={name}
                      content={CATEGORY_HELP[name] || CATEGORY_HELP['Custom']}
                      iconClassName="size-3"
                    />
                  </div>
                  <span className="text-xs font-semibold leading-tight">{name}</span>
                  {isAdded && (
                    count > 1
                      ? <span className="text-[10px] font-bold">{count} added</span>
                      : <span className="text-[10px] font-bold">{formatCurrency(weeklyAmount)}/wk</span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Box – My Essential Expense */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onFocusOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Box – My Essential Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formState.category}
                disabled={formState.category !== 'Custom'}
                className={formState.category !== 'Custom' ? 'opacity-60' : ''}
                onChange={(e) =>
                  setFormState({ ...formState, category: e.target.value, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Add a description"
                value={formState.description}
                onChange={(e) =>
                  setFormState({ ...formState, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    placeholder="0.00"
                    value={formState.amount}
                    onChange={handleAmountChange}
                    className="pl-7"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formState.frequency}
                  onValueChange={(value: Frequency) =>
                    setFormState({ ...formState, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Date <span className="text-muted-foreground font-normal text-xs">(Opt.)</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal px-3',
                        !formState.dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {formState.dueDate ? (
                        <span className="text-xs">{format(formState.dueDate, 'MM/dd/yy')}</span>
                      ) : (
                        <span className="text-xs">Pick</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarPicker
                      mode="single"
                      selected={formState.dueDate}
                      onSelect={(date) =>
                        setFormState({ ...formState, dueDate: date as Date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Auto Calculate */}
            <div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoCalculate}
                  className="gap-2"
                >
                  <Calculator className="size-4" />
                  Auto Calculate
                </Button>
                {autoCalcResult !== null && (
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 border">
                    <span className="text-sm font-semibold">{formatCurrency(autoCalcResult)}</span>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setFormState({ ...formState, amount: formatAmountInput(autoCalcResult.toFixed(2)) });
                        setAutoCalcResult(null);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Calculate budget amount based on your previous average spending.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={handleSaveExpense}>
              {expenseToEdit ? 'Update Item' : 'Add'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {expenseToEdit && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteExpense(expenseToEdit.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
