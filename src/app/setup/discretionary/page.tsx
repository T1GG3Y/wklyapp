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
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { Suspense, useMemo, useState, useEffect } from 'react';
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
import { OverBudgetBox } from '@/components/OverBudgetBox';
import {
  DISCRETIONARY_CATEGORIES,
  FREQUENCY_OPTIONS,
  CATEGORY_HELP,
  PAGE_HELP,
  PAGE_SUBHEADERS,
  type Frequency,
} from '@/lib/constants';
import {
  formatCurrency,
  formatAmountInput,
  parseFormattedAmount,
  getWeeklyAmount,
} from '@/lib/format';

interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  plannedAmount: number;
  frequency?: Frequency;
  description?: string;
  dueDate?: string;
}

// Icon mapping for categories
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

function DiscretionaryExpensesContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('source') === 'budget';
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<DiscretionaryExpense | null>(null);

  const [formState, setFormState] = useState<{
    category: string;
    amount: string;
    frequency: Frequency;
    description: string;
    dueDate?: Date;
  }>({
    category: 'Personal Care',
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
        amount: formatAmountInput(expenseToEdit.plannedAmount.toString()),
        frequency: (expenseToEdit.frequency as Frequency) || 'Weekly',
        description: expenseToEdit.description || '',
        dueDate: expenseToEdit.dueDate ? parseISO(expenseToEdit.dueDate) : undefined,
      });
    } else {
      setFormState({
        category: 'Personal Care',
        amount: '',
        frequency: 'Weekly',
        description: '',
        dueDate: undefined,
      });
    }
  }, [expenseToEdit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setFormState({ ...formState, amount: formatted });
  };

  const handleOpenAddDialog = (category: string) => {
    setExpenseToEdit(null);
    setFormState({
      category: category,
      amount: '',
      frequency: 'Weekly',
      description: '',
      dueDate: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (expense: DiscretionaryExpense) => {
    setExpenseToEdit(expense);
    setIsDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!firestore || !user) return;

    const amount = parseFormattedAmount(formState.amount);
    if (amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    // Require description for Miscellaneous
    if (formState.category === 'Miscellaneous' && !formState.description.trim()) {
      alert('Please enter a description for Miscellaneous expenses.');
      return;
    }

    const expenseData = {
      userProfileId: user.uid,
      category: formState.category,
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
        const discretionaryExpensesCollection = collection(firestore, `users/${user.uid}/discretionaryExpenses`);
        await addDoc(discretionaryExpensesCollection, expenseData);
      }
      setIsDialogOpen(false);
      setExpenseToEdit(null);
    } catch (error) {
      console.error('Error saving discretionary expense: ', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(
        doc(firestore, `users/${user.uid}/discretionaryExpenses`, expenseId)
      );
      if (expenseToEdit?.id === expenseId) {
        setIsDialogOpen(false);
        setExpenseToEdit(null);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const { weeklyTotal, overBudgetTotal } = useMemo(() => {
    if (!expenses) return { weeklyTotal: 0, overBudgetTotal: 0 };

    const weekly = expenses.reduce((total, expense) => {
      const freq = expense.frequency || 'Weekly';
      return total + getWeeklyAmount(expense.plannedAmount, freq);
    }, 0);

    // Over budget would need actual spending data
    const overBudget = 0;

    return { weeklyTotal: weekly, overBudgetTotal: overBudget };
  }, [expenses]);

  // Get expense for a category
  const getCategoryExpense = (categoryName: string) => {
    return expenses?.find((e) => e.category === categoryName);
  };

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen overflow-hidden">
      <PageHeader
        title="MY DISCRETIONARY EXPENSES"
        helpTitle="My Discretionary Expenses"
        helpContent={PAGE_HELP.discretionaryExpenses}
        subheader={PAGE_SUBHEADERS.discretionaryExpenses}
        rightContent={<HamburgerMenu />}
        leftContent={
          <Button variant="ghost" size="icon" asChild>
            <Link href={isEditMode ? "/budget" : "/setup/required-expenses"}>
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <main className={cn("flex-1 overflow-y-auto relative", isEditMode ? "pb-8" : "pb-32")}>
        {isEditMode ? (
          /* Edit Mode Layout - matches Essential Expenses */
          <div className="px-4 py-4 space-y-4">
            {/* Add New Expense Button */}
            <Button
              onClick={() => handleOpenAddDialog('Personal Care')}
              className="w-full h-12"
            >
              <Plus className="size-5 mr-2" />
              Add New Expense
            </Button>

            {/* My Discretionary Budget Totals */}
            <BudgetTotalsBox
              weeklyTotal={weeklyTotal}
              overbudgetTotal={overBudgetTotal}
              showOverbudget={true}
              title="My Discretionary Budget Totals"
            />

            {/* Planned Expenses - only shows categories with values */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 border-b text-center">
                Planned Expenses
              </h3>
              <div className="divide-y">
                {expenses && expenses.length > 0 ? (
                  expenses.map((expense) => {
                    const weeklyAmount = getWeeklyAmount(expense.plannedAmount, expense.frequency || 'Weekly');
                    // Amount available would come from actual spending data
                    const amountAvailable = weeklyAmount; // Placeholder

                    return (
                      <div
                        key={expense.id}
                        className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{expense.category}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">WK Budget</p>
                            <p className="font-semibold">{formatCurrency(weeklyAmount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Amount Available</p>
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
                  <p className="text-center text-muted-foreground py-6">
                    No expenses added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Onboarding Layout - category grid */
          <>
            {/* Budget Totals and Over Budget */}
            <div className="px-4 py-4 space-y-3">
              <BudgetTotalsBox weeklyTotal={weeklyTotal} title="Budget Totals" />
              <OverBudgetBox overBudgetAmount={overBudgetTotal} />
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4 mb-6">
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
                    onClick={() => isAdded && expense ? handleOpenEditDialog(expense) : handleOpenAddDialog(name)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 text-center p-4 rounded-xl border-2 transition-all duration-200 relative',
                      isAdded
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card hover:bg-muted border-dashed'
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Icon className="size-5" />
                      <HelpDialog
                        title={name}
                        content={CATEGORY_HELP[name] || CATEGORY_HELP['Miscellaneous']}
                        iconClassName="size-3"
                      />
                    </div>
                    <span className="text-sm font-semibold">{name}</span>
                    {isAdded && (
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold">{formatCurrency(weeklyAmount)}/wk</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Added Expenses List */}
            <div className="flex flex-col gap-4 px-4">
              <h3 className="text-muted-foreground font-bold uppercase tracking-wider text-sm">
                Added Expenses
              </h3>
              {loading ? (
                <p>Loading expenses...</p>
              ) : expenses && expenses.length > 0 ? (
                expenses.map((expense) => {
                  const Icon = iconMap[expense.category] || MoreHorizontal;
                  const weeklyAmount = getWeeklyAmount(
                    expense.plannedAmount,
                    expense.frequency || 'Weekly'
                  );

                  return (
                    <div
                      key={expense.id}
                      className="bg-card rounded-xl p-4 border shadow-sm relative group cursor-pointer"
                      onClick={() => handleOpenEditDialog(expense)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <span className="text-foreground font-bold text-lg block">
                              {expense.category}
                            </span>
                            {expense.description && (
                              <span className="text-muted-foreground text-sm">
                                {expense.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExpense(expense.id);
                          }}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-background rounded-lg px-3 py-2 border">
                          <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                            Weekly
                          </label>
                          <span className="font-bold text-foreground">
                            {formatCurrency(weeklyAmount)}
                          </span>
                        </div>
                        <div className="bg-background rounded-lg px-3 py-2 border">
                          <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                            Amount
                          </label>
                          <span className="font-bold text-foreground">
                            {formatCurrency(expense.plannedAmount)}
                          </span>
                        </div>
                        <div className="bg-background rounded-lg px-3 py-2 border">
                          <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                            Frequency
                          </label>
                          <span className="font-bold text-foreground text-sm">
                            {expense.frequency || 'Weekly'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No discretionary expenses added yet.
                </p>
              )}
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {expenseToEdit ? `Edit ${formState.category}` : 'Add Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Category dropdown - only show when adding new expense */}
            {!expenseToEdit && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="category">Category</Label>
                  <HelpDialog
                    title={formState.category}
                    content={CATEGORY_HELP[formState.category] || CATEGORY_HELP['Miscellaneous']}
                    iconClassName="size-3"
                  />
                </div>
                <Select
                  value={formState.category}
                  onValueChange={(value) =>
                    setFormState({ ...formState, category: value })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCRETIONARY_CATEGORIES.map(({ name }) => {
                      const Icon = iconMap[name] || MoreHorizontal;
                      return (
                        <SelectItem key={name} value={name}>
                          <div className="flex items-center gap-2">
                            <Icon className="size-4" />
                            <span>{name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formState.category === 'Miscellaneous' && (
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="description"
                  placeholder="Describe this expense"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState({ ...formState, description: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={formState.amount}
                  onChange={handleAmountChange}
                  className="pl-8 h-12 text-lg"
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
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select frequency" />
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
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal h-12',
                      !formState.dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.dueDate ? (
                      format(formState.dueDate, 'PPP')
                    ) : (
                      <span>Pick a date</span>
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

            {formState.category !== 'Miscellaneous' && (
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Add a note"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState({ ...formState, description: e.target.value })
                  }
                />
              </div>
            )}
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
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Continue Button - only show during onboarding */}
      {!isEditMode && (
        <div className="p-4 bg-background/95 backdrop-blur-md border-t fixed bottom-0 w-full z-30 left-0 right-0">
          <Button
            asChild
            className="w-full h-14 rounded-xl text-lg font-bold shadow-lg"
          >
            <Link href="/setup/loans">
              Continue <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DiscretionaryExpensesScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DiscretionaryExpensesContent />
    </Suspense>
  );
}
