'use client';

import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plane,
  Car,
  ArrowLeft,
  ArrowRight,
  Home,
  Trash2,
  GraduationCap,
  PiggyBank,
  type LucideIcon,
  ShieldAlert,
  Bike,
  Wallet,
  MoreHorizontal,
  Plus,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { addWeeks, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HelpDialog } from '@/components/HelpDialog';
import {
  SAVINGS_CATEGORIES,
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

interface SavingsGoal extends DocumentData {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  weeklyContribution?: number;
  frequency?: Frequency;
  description?: string;
}

interface IncomeSource extends DocumentData {
  id: string;
  amount: number;
  frequency: Frequency;
}

interface RequiredExpense extends DocumentData {
  id: string;
  amount: number;
  frequency: Frequency;
}

interface DiscretionaryExpense extends DocumentData {
  id: string;
  plannedAmount: number;
}

const iconMap: Record<string, LucideIcon> = {
  'Emergency Fund': ShieldAlert,
  'Real Estate Purchase': Home,
  'Automobile': Car,
  'Vacation': Plane,
  'Recreation Equipment': Bike,
  'Education': GraduationCap,
  'Custom': MoreHorizontal,
  'Income Balance': Wallet,
};

export default function SavingsGoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);

  const [formState, setFormState] = useState<{
    category: string;
    name: string;
    targetAmount: string;
    currentAmount: string;
    weeklyContribution: string;
    frequency: Frequency;
    description: string;
  }>({
    category: 'Emergency Fund',
    name: '',
    targetAmount: '',
    currentAmount: '',
    weeklyContribution: '',
    frequency: 'Weekly',
    description: '',
  });

  const savingsGoalsPath = useMemo(() => (user ? `users/${user.uid}/savingsGoals` : null), [user]);
  const incomeSourcesPath = useMemo(() => (user ? `users/${user.uid}/incomeSources` : null), [user]);
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);

  const { data: goals, loading } = useCollection<SavingsGoal>(savingsGoalsPath);
  const { data: incomeSources } = useCollection<IncomeSource>(incomeSourcesPath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);

  const weeklyIncome = useMemo(() => {
    if (!incomeSources) return 0;
    return incomeSources.reduce((total, source) => total + getWeeklyAmount(source.amount, source.frequency), 0);
  }, [incomeSources]);

  const weeklyExpenses = useMemo(() => {
    const requiredTotal = (requiredExpenses || []).reduce((total, expense) => total + getWeeklyAmount(expense.amount, expense.frequency), 0);
    const discretionaryTotal = (discretionaryExpenses || []).reduce((total, expense) => total + getWeeklyAmount(expense.plannedAmount, (expense as any).frequency || 'Weekly'), 0);
    return requiredTotal + discretionaryTotal;
  }, [requiredExpenses, discretionaryExpenses]);

  const weeklyPlannedSavings = useMemo(() => {
    if (!goals) return 0;
    return goals
      .filter(g => g.category !== 'Income Balance')
      .reduce((total, goal) => total + getWeeklyAmount(goal.weeklyContribution || 0, goal.frequency || 'Weekly'), 0);
  }, [goals]);

  const incomeBalance = useMemo(() => {
    return Math.max(0, weeklyIncome - weeklyExpenses - weeklyPlannedSavings);
  }, [weeklyIncome, weeklyExpenses, weeklyPlannedSavings]);

  const savingsTotals = useMemo(() => {
    if (!goals || goals.length === 0) {
      return { totalTarget: 0, totalSaved: 0, percentSaved: 0 };
    }
    const filtered = goals.filter(g => g.category !== 'Income Balance');
    const totalTarget = filtered.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = filtered.reduce((sum, g) => sum + g.currentAmount, 0);
    const percentSaved = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    return { totalTarget, totalSaved, percentSaved };
  }, [goals]);

  const getEstimatedTargetDate = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0 || !goal.weeklyContribution || goal.weeklyContribution <= 0) return null;
    const weeksToGoal = Math.ceil(remaining / getWeeklyAmount(goal.weeklyContribution, goal.frequency || 'Weekly'));
    return addWeeks(new Date(), weeksToGoal);
  };

  useEffect(() => {
    if (goalToEdit) {
      setFormState({
        category: goalToEdit.category,
        name: goalToEdit.name,
        targetAmount: formatAmountInput(goalToEdit.targetAmount.toFixed(2)),
        currentAmount: formatAmountInput(goalToEdit.currentAmount.toFixed(2)),
        weeklyContribution: formatAmountInput((goalToEdit.weeklyContribution || 0).toFixed(2)),
        frequency: goalToEdit.frequency || 'Weekly',
        description: goalToEdit.description || '',
      });
    }
  }, [goalToEdit]);

  const handleAmountChange = (field: 'targetAmount' | 'currentAmount' | 'weeklyContribution') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormState({ ...formState, [field]: formatAmountInput(e.target.value) });
  };

  const handleOpenCategoryPicker = () => {
    setIsCategoryPickerOpen(true);
  };

  const handleCategorySelected = (category: string) => {
    setIsCategoryPickerOpen(false);
    setGoalToEdit(null);
    setFormState({
      category,
      name: category,
      targetAmount: '',
      currentAmount: '',
      weeklyContribution: '',
      frequency: 'Weekly',
      description: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenEditDialog = (goal: SavingsGoal) => {
    if (goal.category === 'Income Balance') return;
    setGoalToEdit(goal);
    setIsEditDialogOpen(true);
  };

  // Check how many times a category is used
  const getCategoryCount = (categoryName: string) => {
    return (goals || []).filter((g) => g.category === categoryName).length;
  };

  const handleSaveGoal = async () => {
    if (!firestore || !user) return;

    const targetAmount = parseFormattedAmount(formState.targetAmount);
    const currentAmount = parseFormattedAmount(formState.currentAmount);
    const weeklyContribution = parseFormattedAmount(formState.weeklyContribution);

    if (targetAmount <= 0) {
      alert('Please enter a valid savings goal amount.');
      return;
    }

    if (formState.category === 'Custom' && !formState.description.trim()) {
      alert('Please enter a description for Custom goals.');
      return;
    }

    // Require description if subcategory is used more than once
    const existingCount = getCategoryCount(formState.category);
    const willBeDuplicate = goalToEdit
      ? existingCount > 1
      : existingCount >= 1;

    if (willBeDuplicate && !formState.description.trim()) {
      alert(`Please enter a description since "${formState.category}" is used more than once.`);
      return;
    }

    const goalData = {
      userProfileId: user.uid,
      name: formState.category,
      category: formState.category,
      targetAmount,
      currentAmount,
      weeklyContribution,
      frequency: formState.frequency,
      description: formState.description,
    };

    try {
      if (goalToEdit) {
        const docRef = doc(firestore, `users/${user.uid}/savingsGoals`, goalToEdit.id);
        await updateDoc(docRef, goalData);
      } else {
        const goalsCollection = collection(firestore, `users/${user.uid}/savingsGoals`);
        await addDoc(goalsCollection, goalData);
      }
      setIsEditDialogOpen(false);
      setGoalToEdit(null);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!firestore || !user) return;
    try {
      const goal = goals?.find((g) => g.id === goalId);

      // Transfer current balance saved to Unassigned Income
      if (goal && goal.currentAmount > 0) {
        const txCollection = collection(firestore, `users/${user.uid}/transactions`);
        const moveGroup = Date.now().toString();
        // Deduct from the savings category
        await addDoc(txCollection, {
          userProfileId: user.uid,
          type: 'Expense',
          amount: goal.currentAmount,
          description: `Deleted savings: ${goal.name || goal.category}`,
          category: `Savings: ${goal.category}`,
          date: serverTimestamp(),
          moveGroup,
          autoGenerated: true,
        });
        // Add to Unassigned Income (Income type, matching Move pattern)
        await addDoc(txCollection, {
          userProfileId: user.uid,
          type: 'Income',
          amount: goal.currentAmount,
          description: `From deleted savings: ${goal.name || goal.category}`,
          category: 'Savings: Unassigned Income',
          date: serverTimestamp(),
          moveGroup,
          autoGenerated: true,
        });
      }

      await deleteDoc(doc(firestore, `users/${user.uid}/savingsGoals`, goalId));
      if (goalToEdit?.id === goalId) {
        setIsEditDialogOpen(false);
        setGoalToEdit(null);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Sort goals alphabetically by category then description
  const sortedGoals = useMemo(() => {
    if (!goals) return [];
    return [...goals]
      .filter(g => g.category !== 'Income Balance')
      .sort((a, b) => {
        const catCmp = a.category.localeCompare(b.category);
        if (catCmp !== 0) return catCmp;
        return (a.description || '').localeCompare(b.description || '');
      });
  }, [goals]);

  // Display name: "Category - Description" if description exists
  const getDisplayName = (goal: SavingsGoal) => {
    const name = goal.category;
    if (goal.description) {
      return `${name} - ${goal.description}`;
    }
    return name;
  };

  const getCategoryGoals = (categoryName: string) => {
    return goals?.filter((g) => g.category === categoryName) || [];
  };

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col h-screen overflow-y-auto">
      <PageHeader
        title="MY SAVINGS GOALS"
        helpTitle="My Savings Goals"
        helpContent={PAGE_HELP.savings}
        subheader="For Setup select 'Add New Saving Goal' below and start adding each Savings Goal. This week's balance will be added to next week."
        rightContent={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/transaction/new">
                Transactions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <HamburgerMenu />
          </div>
        }
        leftContent={
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/loans">
              <ArrowLeft className="h-4 w-4" />
              Loans
            </Link>
          </Button>
        }
      />

      <main className="flex-1 flex flex-col p-4 w-full pb-8">
        <div className="space-y-4">
          <Button onClick={handleOpenCategoryPicker} className="w-full h-12">
            <Plus className="size-5 mr-2" />
            Add New Saving Goal
          </Button>

          {/* My Savings Goal Totals Box */}
          <div className="bg-card rounded-xl p-4 border shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
              My Savings Goal Totals
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Saved</p>
                <p className="text-lg font-bold">{formatCurrency(savingsTotals.totalSaved)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Goal</p>
                <p className="text-lg font-bold">{formatCurrency(savingsTotals.totalTarget)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Weekly</p>
                <p className="text-lg font-bold">{formatCurrency(weeklyPlannedSavings)}</p>
              </div>
            </div>
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.min(100, savingsTotals.percentSaved)}%` }} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                {savingsTotals.percentSaved.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* My Goals Table */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 border-b text-center">
              My Goals
            </h3>
            <div className="divide-y">
              {/* Unassigned Income - always at top */}
              <div className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Wallet className="size-4" />
                  </div>
                  <span className="font-semibold text-foreground">Unassigned Income</span>
                </div>
                <p className="text-lg font-bold text-primary">{formatCurrency(incomeBalance)}<span className="text-sm font-normal text-muted-foreground"> / week</span></p>
              </div>

              {loading ? (
                <p className="text-center text-muted-foreground py-6">Loading...</p>
              ) : sortedGoals.length > 0 ? (
                sortedGoals.map((goal) => {
                  const Icon = iconMap[goal.category] || PiggyBank;
                  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  const estimatedDate = getEstimatedTargetDate(goal);

                  return (
                    <div key={goal.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="size-4" />
                          </div>
                          <span className="font-semibold text-foreground">{getDisplayName(goal)}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenEditDialog(goal)}>
                          <Edit className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Saved: </span>
                          <span className="font-semibold">{formatCurrency(goal.currentAmount)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Goal: </span>
                          <span className="font-semibold">{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target: </span>
                          <span className="font-semibold">
                            {estimatedDate ? format(estimatedDate, 'MMM yyyy') : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.min(100, progress)}%` }} />
                        <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-6">No savings goals added yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Category Picker Dialog - Income Balance removed */}
      <Dialog open={isCategoryPickerOpen} onOpenChange={setIsCategoryPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Category</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2">
            {SAVINGS_CATEGORIES.map(({ name }) => {
              const Icon = iconMap[name] || PiggyBank;
              const categoryGoals = getCategoryGoals(name);
              const hasGoals = categoryGoals.length > 0;

              return (
                <button
                  key={name}
                  onClick={() => handleCategorySelected(name)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 text-center p-3 rounded-xl border transition-all duration-200 relative min-h-[80px]',
                    hasGoals
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
                  {hasGoals && (
                    <span className="text-[10px] font-bold">{categoryGoals.length} goal(s)</span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Box – My Savings Goal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Box – My Savings Goal</DialogTitle>
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

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Savings Goal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="targetAmount"
                  placeholder="0.00"
                  value={formState.targetAmount}
                  onChange={handleAmountChange('targetAmount')}
                  className="pl-7"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weeklyContribution">Contribution Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="weeklyContribution"
                    placeholder="0.00"
                    value={formState.weeklyContribution}
                    onChange={handleAmountChange('weeklyContribution')}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Balance Saved</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="currentAmount"
                  placeholder="0.00"
                  value={formState.currentAmount}
                  onChange={handleAmountChange('currentAmount')}
                  className="pl-7"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={handleSaveGoal}>
              {goalToEdit ? 'Update Item' : 'Add'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {goalToEdit && (
                <Button variant="destructive" className="flex-1" onClick={() => handleDeleteGoal(goalToEdit.id)}>
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
