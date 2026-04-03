'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Sparkles,
  Shirt,
  Hammer,
  Tv,
  Wifi,
  Heart,
  Baby,
  Users,
  Plane,
  Dumbbell,
  Gift,
  Dog,
  MoreHorizontal,
  CreditCard,
  User,
  CalendarIcon,
  Plus,
  Edit,
  Calculator,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HelpDialog } from '@/components/HelpDialog';
import { BudgetTotalsBox } from '@/components/BudgetTotalsBox';
import {
  DISCRETIONARY_CATEGORIES,
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
import { useToast } from '@/hooks/use-toast';

interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  name?: string;
  plannedAmount: number;
  frequency?: Frequency;
  description?: string;
  dueDate?: string;
}

interface UserProfile extends DocumentData {
  startDayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
}

const iconMap: Record<string, LucideIcon> = {
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
  'Custom': MoreHorizontal,
};

const dayIndexMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

export default function DiscretionaryExpensesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<DiscretionaryExpense | null>(null);
  const [weeklySpentByCategory, setWeeklySpentByCategory] = useState<Record<string, number>>({});
  const hasLoadedTransactions = useRef(false);

  const [formState, setFormState] = useState<{
    category: string;
    name: string;
    amount: string;
    frequency: Frequency;
    description: string;
    dueDate?: Date;
  }>({
    category: 'Personal Care',
    name: '',
    amount: '',
    frequency: 'Weekly',
    description: '',
    dueDate: undefined,
  });

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/discretionaryExpenses` : null;
  }, [user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);
  const { data: expenses, loading } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);

  // Fetch current week's transactions to calculate Available amounts
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
      const spentByCategory: Record<string, number> = {};

      snapshot.forEach((d) => {
        const data = d.data();
        if (data.type === 'Expense' && data.date) {
          const txDate = data.date.toDate();
          if (isWithinInterval(txDate, { start: weekStart, end: weekEnd })) {
            const cat = data.category || '';
            spentByCategory[cat] = (spentByCategory[cat] || 0) + Math.abs(data.amount);
          }
        }
      });

      setWeeklySpentByCategory(spentByCategory);
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
        amount: formatAmountInput(expenseToEdit.plannedAmount.toFixed(2)),
        frequency: (expenseToEdit.frequency as Frequency) || 'Weekly',
        description: expenseToEdit.description || '',
        dueDate: expenseToEdit.dueDate ? parseISO(expenseToEdit.dueDate) : undefined,
      });
    }
  }, [expenseToEdit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setFormState({ ...formState, amount: formatted });
  };

  const handleOpenCategoryPicker = () => {
    setIsCategoryPickerOpen(true);
  };

  const handleCategorySelected = (category: string) => {
    setIsCategoryPickerOpen(false);
    setExpenseToEdit(null);
    setFormState({
      category,
      name: category,
      amount: '',
      frequency: 'Weekly',
      description: '',
      dueDate: undefined,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenEditDialog = (expense: DiscretionaryExpense) => {
    setExpenseToEdit(expense);
    setIsEditDialogOpen(true);
  };

  // Check how many times a category is used
  const getCategoryCount = (categoryName: string) => {
    return (expenses || []).filter((e) => e.category === categoryName).length;
  };

  const handleSaveExpense = async () => {
    if (!firestore || !user) return;

    const amount = parseFormattedAmount(formState.amount);
    if (amount <= 0) {
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
      plannedAmount: amount,
      frequency: formState.frequency,
      description: formState.description,
      ...(formState.dueDate && {
        dueDate: format(formState.dueDate, 'yyyy-MM-dd'),
      }),
    };

    try {
      if (expenseToEdit) {
        const docRef = doc(firestore, `users/${user.uid}/discretionaryExpenses`, expenseToEdit.id);
        await updateDoc(docRef, expenseData);
      } else {
        const coll = collection(firestore, `users/${user.uid}/discretionaryExpenses`);
        await addDoc(coll, expenseData);
      }
      setIsEditDialogOpen(false);
      setExpenseToEdit(null);
    } catch (error) {
      console.error('Error saving discretionary expense: ', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/discretionaryExpenses`, expenseId));
      if (expenseToEdit?.id === expenseId) {
        setIsEditDialogOpen(false);
        setExpenseToEdit(null);
      }
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
      setFormState({ ...formState, amount: formatAmountInput(average.toFixed(2)) });

      toast({
        title: 'Auto Calculated',
        description: `Average of ${count} transaction(s): ${formatCurrency(average)}`,
      });
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
      const freq = expense.frequency || 'Weekly';
      return total + getWeeklyAmount(expense.plannedAmount, freq);
    }, 0);
    return { weeklyTotal: weekly, overBudgetTotal: 0 };
  }, [expenses]);

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
  const getDisplayName = (expense: DiscretionaryExpense) => {
    const name = expense.category;
    if (expense.description) {
      return `${name} - ${expense.description}`;
    }
    return name;
  };

  const getCategoryExpense = (categoryName: string) => {
    return expenses?.find((e) => e.category === categoryName);
  };

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen h-screen overflow-y-auto">
      <PageHeader
        title="MY DISCRETIONARY EXPENSES"
        helpTitle="My Discretionary Expenses"
        helpContent={PAGE_HELP.discretionaryExpenses}
        subheader="For Setup select 'Add New Expense' below and start adding each Expense"
        rightContent={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/loans">
                Loans
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <HamburgerMenu />
          </div>
        }
        leftContent={
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/essential-expenses">
              <ArrowLeft className="h-4 w-4" />
              Essential
            </Link>
          </Button>
        }
      />

      <main className="flex-1 pb-8">
        <div className="px-4 py-4 space-y-4">
          <Button onClick={handleOpenCategoryPicker} className="w-full h-12">
            <Plus className="size-5 mr-2" />
            Add New Expense
          </Button>

          <BudgetTotalsBox
            weeklyTotal={weeklyTotal}
            overbudgetTotal={overBudgetTotal}
            showOverbudget={true}
            title="My Discretionary Expense Totals"
          />

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
                  const weeklyAmount = getWeeklyAmount(expense.plannedAmount, expense.frequency || 'Weekly');
                  const spent = weeklySpentByCategory[expense.category] || 0;
                  const amountAvailable = weeklyAmount - spent;

                  return (
                    <div key={expense.id} className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors">
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
                <p className="text-center text-muted-foreground py-6">No expenses added yet.</p>
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
            {DISCRETIONARY_CATEGORIES.map(({ name }) => {
              const Icon = iconMap[name] || MoreHorizontal;
              const categoryExpenses = (expenses || []).filter((e) => e.category === name);
              const count = categoryExpenses.length;
              const isAdded = count > 0;
              const weeklyAmount = count === 1
                ? getWeeklyAmount(categoryExpenses[0].plannedAmount, categoryExpenses[0].frequency || 'Weekly')
                : 0;

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

      {/* Edit Box – My Discretionary Expense */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Box – My Discretionary Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formState.category}
                disabled={formState.category !== 'Custom'}
                className={formState.category !== 'Custom' ? 'opacity-60' : ''}
                onChange={(e) => setFormState({ ...formState, category: e.target.value, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Add a description"
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
                  onValueChange={(value: Frequency) => setFormState({ ...formState, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date <span className="text-muted-foreground font-normal text-xs">(Opt.)</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal px-3', !formState.dueDate && 'text-muted-foreground')}
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
                      onSelect={(date) => setFormState({ ...formState, dueDate: date as Date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Button variant="outline" size="sm" onClick={handleAutoCalculate} className="gap-2">
                <Calculator className="size-4" />
                Auto Calculate
              </Button>
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
                <Button variant="destructive" className="flex-1" onClick={() => handleDeleteExpense(expenseToEdit.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
