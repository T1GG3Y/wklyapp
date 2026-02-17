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
  ArrowLeft,
  Plus,
  Edit,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  type DocumentData,
} from 'firebase/firestore';
import { Suspense, useMemo, useState, useEffect } from 'react';
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
  PAGE_SUBHEADERS,
  type Frequency,
} from '@/lib/constants';
import {
  formatCurrency,
  formatAmountInput,
  parseFormattedAmount,
  getWeeklyAmount,
  formatPercent,
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

// Icon mapping for savings categories
const iconMap: Record<string, LucideIcon> = {
  'Emergency Fund': ShieldAlert,
  'House Purchase': Home,
  'Automobile': Car,
  'Vacation': Plane,
  'Recreation Equipment': Bike,
  'Education': GraduationCap,
  'Miscellaneous': MoreHorizontal,
  'Income Balance': Wallet,
};

function PlannedSavingsContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('source') === 'budget';
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  // Data paths
  const savingsGoalsPath = useMemo(() => (user ? `users/${user.uid}/savingsGoals` : null), [user]);
  const incomeSourcesPath = useMemo(() => (user ? `users/${user.uid}/incomeSources` : null), [user]);
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);

  // Fetch data
  const { data: goals, loading } = useCollection<SavingsGoal>(savingsGoalsPath);
  const { data: incomeSources } = useCollection<IncomeSource>(incomeSourcesPath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);

  // Calculate weekly income
  const weeklyIncome = useMemo(() => {
    if (!incomeSources) return 0;
    return incomeSources.reduce((total, source) => {
      return total + getWeeklyAmount(source.amount, source.frequency);
    }, 0);
  }, [incomeSources]);

  // Calculate weekly expenses (required + discretionary)
  const weeklyExpenses = useMemo(() => {
    const requiredTotal = (requiredExpenses || []).reduce((total, expense) => {
      return total + getWeeklyAmount(expense.amount, expense.frequency);
    }, 0);
    const discretionaryTotal = (discretionaryExpenses || []).reduce((total, expense) => {
      return total + expense.plannedAmount;
    }, 0);
    return requiredTotal + discretionaryTotal;
  }, [requiredExpenses, discretionaryExpenses]);

  // Calculate weekly savings contributions (excluding Income Balance)
  const weeklyPlannedSavings = useMemo(() => {
    if (!goals) return 0;
    return goals
      .filter(g => g.category !== 'Income Balance')
      .reduce((total, goal) => {
        const contribution = goal.weeklyContribution || 0;
        return total + getWeeklyAmount(contribution, goal.frequency || 'Weekly');
      }, 0);
  }, [goals]);

  // Calculate Income Balance (undesignated income)
  const incomeBalance = useMemo(() => {
    return Math.max(0, weeklyIncome - weeklyExpenses - weeklyPlannedSavings);
  }, [weeklyIncome, weeklyExpenses, weeklyPlannedSavings]);

  // Calculate totals
  const totalSaved = useMemo(() => {
    if (!goals) return 0;
    return goals
      .filter(g => g.category !== 'Income Balance')
      .reduce((sum, goal) => sum + goal.currentAmount, 0);
  }, [goals]);

  const savingsToIncomePercent = useMemo(() => {
    if (weeklyIncome <= 0) return 0;
    return (weeklyPlannedSavings / weeklyIncome) * 100;
  }, [weeklyPlannedSavings, weeklyIncome]);

  // Calculate savings totals for edit mode
  const savingsTotals = useMemo(() => {
    if (!goals || goals.length === 0) {
      return { totalTarget: 0, totalSaved: 0, totalRemaining: 0, percentSaved: 0 };
    }

    const filteredGoals = goals.filter(g => g.category !== 'Income Balance');
    const totalTarget = filteredGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = filteredGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalRemaining = totalTarget - totalSaved;
    const percentSaved = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalSaved,
      totalRemaining,
      percentSaved,
    };
  }, [goals]);

  // Calculate estimated target date based on weekly contribution
  const getEstimatedTargetDate = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return null; // Goal already reached

    const weeklyContribution = goal.weeklyContribution || 0;
    if (weeklyContribution <= 0) return null; // No contribution set

    const weeksToGoal = Math.ceil(remaining / getWeeklyAmount(weeklyContribution, goal.frequency || 'Weekly'));
    return addWeeks(new Date(), weeksToGoal);
  };

  useEffect(() => {
    if (goalToEdit) {
      setFormState({
        category: goalToEdit.category,
        name: goalToEdit.name,
        targetAmount: formatAmountInput(goalToEdit.targetAmount.toString()),
        currentAmount: formatAmountInput(goalToEdit.currentAmount.toString()),
        weeklyContribution: formatAmountInput((goalToEdit.weeklyContribution || 0).toString()),
        frequency: goalToEdit.frequency || 'Weekly',
        description: goalToEdit.description || '',
      });
    } else {
      setFormState({
        category: 'Emergency Fund',
        name: '',
        targetAmount: '',
        currentAmount: '',
        weeklyContribution: '',
        frequency: 'Weekly',
        description: '',
      });
    }
  }, [goalToEdit]);

  const handleAmountChange = (field: 'targetAmount' | 'currentAmount' | 'weeklyContribution') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const formatted = formatAmountInput(e.target.value);
    setFormState({ ...formState, [field]: formatted });
  };

  const handleOpenAddDialog = (category: string) => {
    // Don't allow adding/editing Income Balance
    if (category === 'Income Balance') return;

    setGoalToEdit(null);
    setFormState({
      category: category,
      name: '',
      targetAmount: '',
      currentAmount: '',
      weeklyContribution: '',
      frequency: 'Weekly',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (goal: SavingsGoal) => {
    // Don't allow editing Income Balance
    if (goal.category === 'Income Balance') return;

    setGoalToEdit(goal);
    setIsDialogOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!firestore || !user) return;

    const targetAmount = parseFormattedAmount(formState.targetAmount);
    const currentAmount = parseFormattedAmount(formState.currentAmount);
    const weeklyContribution = parseFormattedAmount(formState.weeklyContribution);

    if (targetAmount <= 0 || !formState.name) {
      alert('Please enter a valid goal name and amount required.');
      return;
    }

    // Require description for Miscellaneous
    if (formState.category === 'Miscellaneous' && !formState.description.trim()) {
      alert('Please enter a description for Miscellaneous goals.');
      return;
    }

    const goalData = {
      userProfileId: user.uid,
      name: formState.name,
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
      setIsDialogOpen(false);
      setGoalToEdit(null);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/savingsGoals`, goalId));
      if (goalToEdit?.id === goalId) {
        setIsDialogOpen(false);
        setGoalToEdit(null);
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Get goals for a category
  const getCategoryGoals = (categoryName: string) => {
    return goals?.filter((g) => g.category === categoryName) || [];
  };

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col overflow-x-hidden">
      <PageHeader
        title="MY PLANNED SAVINGS GOALS"
        helpTitle="My Planned Savings Goals"
        helpContent={PAGE_HELP.savings}
        subheader={PAGE_SUBHEADERS.savings}
        rightContent={<HamburgerMenu />}
        leftContent={
          <Button variant="ghost" size="icon" asChild>
            <Link href={isEditMode ? "/budget" : "/setup/loans"}>
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <main className={cn("flex-1 flex flex-col p-4 w-full", isEditMode ? "pb-8" : "pb-32")}>
        {isEditMode ? (
          /* Edit Mode Layout */
          <div className="space-y-4">
            {/* Add New Saving Goal Button */}
            <Button
              onClick={() => handleOpenAddDialog('Emergency Fund')}
              className="w-full h-12"
            >
              <Plus className="size-5 mr-2" />
              Add New Saving Goal
            </Button>

            {/* My Total Savings Box */}
            <div className="bg-card rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-sm font-bold text-foreground">My Total Savings</h3>
                <div className="flex-1 flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Weekly Goal: </span>
                    <span className="font-semibold">{formatCurrency(weeklyPlannedSavings)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Saved: </span>
                    <span className="font-semibold">{formatCurrency(savingsTotals.totalSaved)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">% Saved: </span>
                    <span className="font-semibold">{formatPercent(savingsTotals.percentSaved)}</span>
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${savingsTotals.percentSaved}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                  {savingsTotals.percentSaved.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* My Savings Goals Table */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 border-b text-center">
                My Savings Goals
              </h3>
              <div className="divide-y">
                {goals && goals.filter(g => g.category !== 'Income Balance').length > 0 ? (
                  goals
                    .filter(g => g.category !== 'Income Balance')
                    .map((goal) => {
                      const progress = goal.targetAmount > 0
                        ? (goal.currentAmount / goal.targetAmount) * 100
                        : 0;
                      const remaining = goal.targetAmount - goal.currentAmount;
                      const estimatedDate = getEstimatedTargetDate(goal);

                      return (
                        <div key={goal.id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{goal.name}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => handleOpenEditDialog(goal)}
                              >
                                <Edit className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                              >
                                <BarChart3 className="size-4" />
                              </Button>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="relative h-5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                            <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          {/* Savings Details */}
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Saved: </span>
                              <span className="font-semibold">{formatCurrency(goal.currentAmount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Remaining: </span>
                              <span className="font-semibold">{formatCurrency(Math.max(0, remaining))}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Target Date: </span>
                              <span className="font-semibold">
                                {estimatedDate ? format(estimatedDate, 'MMM yyyy') : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No savings goals added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Onboarding Layout */
          <>
            {/* Savings Goals Summary Box */}
            <div className="bg-card rounded-xl p-4 border shadow-sm mb-6">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Savings Goals Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Weekly Goal</p>
                  <p className="font-bold text-lg text-primary">
                    {formatCurrency(weeklyPlannedSavings)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Saved</p>
                  <p className="font-bold text-lg text-foreground">
                    {formatCurrency(totalSaved)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">% of Income</p>
                  <p className="font-bold text-lg text-foreground">
                    {formatPercent(savingsToIncomePercent)}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {SAVINGS_CATEGORIES.map(({ name }) => {
                const Icon = iconMap[name] || PiggyBank;
                const categoryGoals = getCategoryGoals(name);
                const hasGoals = categoryGoals.length > 0;
                const isIncomeBalance = name === 'Income Balance';

                return (
                  <button
                    key={name}
                    onClick={() => handleOpenAddDialog(name)}
                    disabled={isIncomeBalance}
                    className={`flex flex-col items-center justify-center gap-2 text-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      isIncomeBalance
                        ? 'bg-muted/50 border-muted cursor-default'
                        : hasGoals
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card hover:bg-muted border-dashed'
                    }`}
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
                    {isIncomeBalance ? (
                      <span className="text-xs font-bold text-muted-foreground">
                        {formatCurrency(incomeBalance)}/wk
                      </span>
                    ) : hasGoals ? (
                      <span className="text-xs font-bold">{categoryGoals.length} goal(s)</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* MY GOALS List */}
            <div className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider">
                MY GOALS
              </h3>
              {loading ? (
                <p>Loading goals...</p>
              ) : goals && goals.filter(g => g.category !== 'Income Balance').length > 0 ? (
                goals
                  .filter(g => g.category !== 'Income Balance')
                  .map((goal) => {
                    const Icon = iconMap[goal.category] || PiggyBank;
                    const progress =
                      goal.targetAmount > 0
                        ? (goal.currentAmount / goal.targetAmount) * 100
                        : 0;
                    return (
                      <div
                        key={goal.id}
                        className="bg-card p-4 rounded-xl border shadow-sm cursor-pointer"
                        onClick={() => handleOpenEditDialog(goal)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="size-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground text-lg">{goal.name}</p>
                            {goal.description && (
                              <p className="text-sm text-muted-foreground">{goal.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-1">
                              <div>
                                <span className="text-xs text-muted-foreground">Balance Saved</span>
                                <p className="font-bold text-foreground">
                                  {formatCurrency(goal.currentAmount)}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Goal Percent</span>
                                <p className="font-bold text-foreground">{formatPercent(progress)}</p>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGoal(goal.id);
                            }}
                          >
                            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-center text-muted-foreground py-4">No savings goals added yet.</p>
              )}
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {goalToEdit ? `Edit ${formState.name || formState.category}` : 'Add Saving Goal'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Category dropdown - only show when adding new goal */}
            {!goalToEdit && (
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
                    {SAVINGS_CATEGORIES.filter(({ name }) => name !== 'Income Balance').map(({ name }) => {
                      const Icon = iconMap[name] || PiggyBank;
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

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Summer Vacation Fund"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="h-12"
              />
            </div>

            {formState.category === 'Miscellaneous' && (
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="description"
                  placeholder="Describe this savings goal"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState({ ...formState, description: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Amount Required</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="targetAmount"
                  placeholder="0.00"
                  value={formState.targetAmount}
                  onChange={handleAmountChange('targetAmount')}
                  className="pl-8 h-12 text-lg"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Balance Saved</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="currentAmount"
                  placeholder="0.00"
                  value={formState.currentAmount}
                  onChange={handleAmountChange('currentAmount')}
                  className="pl-8"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weeklyContribution">Contribution Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="weeklyContribution"
                    placeholder="0.00"
                    value={formState.weeklyContribution}
                    onChange={handleAmountChange('weeklyContribution')}
                    className="pl-8"
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
            <Button className="w-full sm:w-auto" onClick={handleSaveGoal}>
              {goalToEdit ? 'Update Item' : 'Add'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {goalToEdit && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteGoal(goalToEdit.id)}
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
            <Link href="/budget">
              Continue <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PlannedSavingsScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <PlannedSavingsContent />
    </Suspense>
  );
}
