'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
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
import { useUser, useFirestore, useCollection } from '@/firebase';
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
} from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
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
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HelpDialog } from '@/components/HelpDialog';
import { BudgetTotalsBox } from '@/components/BudgetTotalsBox';
import { BottomNav } from '@/components/BottomNav';
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
  'Miscellaneous': MoreHorizontal,
};

export default function DiscretionaryExpensesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<DiscretionaryExpense | null>(null);

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

  const discretionaryExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/discretionaryExpenses` : null;
  }, [user]);

  const { data: expenses, loading } = useCollection<DiscretionaryExpense>(
    discretionaryExpensesPath
  );

  useEffect(() => {
    if (expenseToEdit) {
      setFormState({
        category: expenseToEdit.category,
        name: expenseToEdit.name || expenseToEdit.category,
        amount: formatAmountInput(expenseToEdit.plannedAmount.toString()),
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

  const handleSaveExpense = async () => {
    if (!firestore || !user) return;

    const amount = parseFormattedAmount(formState.amount);
    if (amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (formState.category === 'Miscellaneous' && !formState.description.trim()) {
      alert('Please enter a description for Miscellaneous expenses.');
      return;
    }

    const expenseData = {
      userProfileId: user.uid,
      category: formState.category,
      name: formState.name || formState.category,
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
        if (data.amount && data.type === 'expense') {
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

  const getCategoryExpense = (categoryName: string) => {
    return expenses?.find((e) => e.category === categoryName);
  };

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen overflow-hidden">
      <PageHeader
        title="MY DISCRETIONARY EXPENSES"
        helpTitle="My Discretionary Expenses"
        helpContent={PAGE_HELP.discretionaryExpenses}
        subheader="For Setup select 'Add New Expense' below and start adding each Expense"
        rightContent={<HamburgerMenu />}
        leftContent={
          <Button variant="ghost" size="icon" asChild>
            <Link href="/essential-expenses">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <main className="flex-1 overflow-y-auto pb-48">
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
              ) : expenses && expenses.length > 0 ? (
                expenses.map((expense) => {
                  const Icon = iconMap[expense.category] || MoreHorizontal;
                  const weeklyAmount = getWeeklyAmount(expense.plannedAmount, expense.frequency || 'Weekly');
                  const amountAvailable = weeklyAmount;

                  return (
                    <div key={expense.id} className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="size-4" />
                        </div>
                        <p className="font-semibold text-foreground truncate">
                          {expense.name || expense.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Wk Budget</p>
                          <p className="font-semibold">{formatCurrency(weeklyAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="font-semibold">{formatCurrency(amountAvailable)}</p>
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
              const expense = getCategoryExpense(name);
              const isAdded = !!expense;
              const weeklyAmount = expense
                ? getWeeklyAmount(expense.plannedAmount, expense.frequency || 'Weekly')
                : 0;

              return (
                <button
                  key={name}
                  onClick={() =>
                    isAdded && expense
                      ? (setIsCategoryPickerOpen(false), handleOpenEditDialog(expense))
                      : handleCategorySelected(name)
                  }
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
                      content={CATEGORY_HELP[name] || CATEGORY_HELP['Miscellaneous']}
                      iconClassName="size-3"
                    />
                  </div>
                  <span className="text-xs font-semibold leading-tight">{name}</span>
                  {isAdded && (
                    <span className="text-[10px] font-bold">{formatCurrency(weeklyAmount)}/wk</span>
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
                placeholder="e.g. Personal Care"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="description"
                placeholder="Add a note"
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

      {/* Footer Buttons */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none w-full z-10">
        <div className="pointer-events-auto flex gap-3">
          <Button asChild variant="outline" className="flex-1 h-12 text-base font-bold" size="lg">
            <Link href="/essential-expenses">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Essential
            </Link>
          </Button>
          <Button asChild className="flex-1 h-12 text-base font-bold shadow-lg" size="lg">
            <Link href="/loans">
              Continue to Loans
            </Link>
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
