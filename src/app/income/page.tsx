'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Gift,
  Hammer,
  Landmark,
  Laptop,
  MoreHorizontal,
  RotateCcw,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  CalendarIcon,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
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
import {
  INCOME_CATEGORIES,
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

// Lucide icon name → component mapping for income categories
const iconMap: Record<string, LucideIcon> = {
  'Salary': Briefcase,
  'Tips': Landmark,
  'Freelance': Laptop,
  'Side Work': Hammer,
  'Bank Transfer': Landmark,
  'Investment': TrendingUp,
  'Refund': RotateCcw,
  'Gift': Gift,
  'Custom': MoreHorizontal,
};

// We need a HandCoins stand-in since lucide might not have it — use Landmark for Tips
// Actually let's just use what we have

interface IncomeSource extends DocumentData {
  id: string;
  name: string;
  category: string;
  description?: string;
  amount: number;
  frequency: Frequency;
  dueDate?: string;
}

interface RequiredExpense extends DocumentData {
  id: string;
  amount: number;
  frequency: Frequency;
}

interface DiscretionaryExpense extends DocumentData {
  id: string;
  plannedAmount: number;
  frequency?: Frequency;
}

interface SavingsGoal extends DocumentData {
  id: string;
  category: string;
  weeklyContribution?: number;
  frequency?: Frequency;
}

interface LoanData extends DocumentData {
  id: string;
  paymentAmount?: number;
  totalBalance?: number;
  paymentFrequency?: Frequency;
}

export default function IncomePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sourceToEdit, setSourceToEdit] = useState<IncomeSource | null>(null);

  const [formState, setFormState] = useState<{
    category: string;
    name: string;
    description: string;
    amount: string;
    frequency: Frequency;
    dueDate?: Date;
  }>({
    category: 'Salary',
    name: '',
    description: '',
    amount: '',
    frequency: 'Monthly',
    dueDate: undefined,
  });

  const incomeSourcesPath = useMemo(() => {
    return user ? `users/${user.uid}/incomeSources` : null;
  }, [user]);

  const requiredExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/requiredExpenses` : null;
  }, [user]);

  const discretionaryExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/discretionaryExpenses` : null;
  }, [user]);

  const savingsGoalsPath = useMemo(() => {
    return user ? `users/${user.uid}/savingsGoals` : null;
  }, [user]);

  const loansPath = useMemo(() => {
    return user ? `users/${user.uid}/loans` : null;
  }, [user]);

  const { data: incomeSources, loading } = useCollection<IncomeSource>(incomeSourcesPath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: savingsGoals } = useCollection<SavingsGoal>(savingsGoalsPath);
  const { data: loans } = useCollection<LoanData>(loansPath);

  useEffect(() => {
    if (sourceToEdit) {
      setFormState({
        category: sourceToEdit.category || 'Custom',
        name: sourceToEdit.name,
        description: sourceToEdit.description || '',
        amount: formatAmountInput(sourceToEdit.amount.toFixed(2)),
        frequency: sourceToEdit.frequency,
        dueDate: sourceToEdit.dueDate ? parseISO(sourceToEdit.dueDate) : undefined,
      });
    }
  }, [sourceToEdit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setFormState({ ...formState, amount: formatted });
  };

  // Open category picker when "Add New Income" is clicked
  const handleOpenCategoryPicker = () => {
    setIsCategoryPickerOpen(true);
  };

  // When a category is selected from the picker, open the edit dialog
  const handleCategorySelected = (category: string) => {
    setIsCategoryPickerOpen(false);
    setSourceToEdit(null);
    setFormState({
      category: category,
      name: category,
      description: '',
      amount: '',
      frequency: 'Monthly',
      dueDate: undefined,
    });
    setIsEditDialogOpen(true);
  };

  // Open edit dialog for an existing income source
  const handleOpenEditDialog = (source: IncomeSource) => {
    setSourceToEdit(source);
    setIsEditDialogOpen(true);
  };

  // Check if a category is used more than once
  const getCategoryCount = (categoryName: string) => {
    return (incomeSources || []).filter((s) => s.category === categoryName).length;
  };

  const handleSaveSource = async () => {
    if (!firestore || !user) return;

    const amount = parseFormattedAmount(formState.amount);
    if (amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    // Require description for Custom category
    if (formState.category === 'Custom' && !formState.description.trim()) {
      alert('Please enter a description for Custom income.');
      return;
    }

    // Check if this category will be duplicated and require description
    const existingCount = getCategoryCount(formState.category);
    const willBeDuplicate = sourceToEdit
      ? existingCount > 1
      : existingCount >= 1;

    if (willBeDuplicate && !formState.description.trim()) {
      alert(`Please enter a description since "${formState.category}" is used more than once.`);
      return;
    }

    const sourceData: Record<string, unknown> = {
      userProfileId: user.uid,
      category: formState.category,
      name: formState.category,
      description: formState.description || '',
      amount: amount,
      frequency: formState.frequency,
    };

    if (formState.dueDate) {
      sourceData.dueDate = format(formState.dueDate, 'yyyy-MM-dd');
    }

    try {
      if (sourceToEdit) {
        const sourceDocRef = doc(firestore, `users/${user.uid}/incomeSources`, sourceToEdit.id);
        await updateDoc(sourceDocRef, sourceData);
      } else {
        const incomeSourcesCollection = collection(firestore, `users/${user.uid}/incomeSources`);
        await addDoc(incomeSourcesCollection, sourceData);
      }
      setIsEditDialogOpen(false);
      setSourceToEdit(null);
    } catch (error) {
      console.error('Error saving income source: ', error);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/incomeSources`, sourceId));
      if (sourceToEdit?.id === sourceId) {
        setIsEditDialogOpen(false);
        setSourceToEdit(null);
      }
    } catch (error) {
      console.error('Error deleting income source:', error);
    }
  };

  // Income totals
  const weeklyTotal = useMemo(() => {
    if (!incomeSources) return 0;
    return incomeSources.reduce((total, source) => {
      return total + getWeeklyAmount(source.amount, source.frequency);
    }, 0);
  }, [incomeSources]);

  // Income Shortage = Income - (Essential + Discretionary + Loans + Savings Contributions)
  const incomeShortage = useMemo(() => {
    const weeklyEssential = (requiredExpenses || []).reduce(
      (t, e) => t + getWeeklyAmount(e.amount, e.frequency), 0
    );
    const weeklyDiscretionary = (discretionaryExpenses || []).reduce(
      (t, e) => t + getWeeklyAmount(e.plannedAmount, (e as any).frequency || 'Weekly'), 0
    );
    const weeklyLoans = (loans || []).reduce(
      (t, l) => t + getWeeklyAmount(l.paymentAmount || l.totalBalance || 0, l.paymentFrequency || 'Monthly'), 0
    );
    const weeklySavings = (savingsGoals || [])
      .filter((g) => g.category !== 'Income Balance')
      .reduce((t, g) => t + getWeeklyAmount(g.weeklyContribution || 0, g.frequency || 'Weekly'), 0);

    const totalOutflows = weeklyEssential + weeklyDiscretionary + weeklyLoans + weeklySavings;
    return weeklyTotal - totalOutflows;
  }, [weeklyTotal, requiredExpenses, discretionaryExpenses, loans, savingsGoals]);

  // Sorted income sources alphabetically by category then description
  const sortedSources = useMemo(() => {
    if (!incomeSources) return [];
    return [...incomeSources].sort((a, b) => {
      const catCmp = (a.category || a.name).localeCompare(b.category || b.name);
      if (catCmp !== 0) return catCmp;
      return (a.description || '').localeCompare(b.description || '');
    });
  }, [incomeSources]);

  // Display name for an income source
  const getDisplayName = (source: IncomeSource) => {
    const name = source.category || source.name;
    if (source.description) {
      return `${name} - ${source.description}`;
    }
    return name;
  };

  // Get existing income source for a category (for category picker display)
  const getCategorySource = (categoryName: string) => {
    return incomeSources?.find((s) => s.category === categoryName);
  };

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen h-screen overflow-y-auto">
      <PageHeader
        title="MY INCOME"
        helpTitle="My Income"
        helpContent={PAGE_HELP.income}
        subheader="For Setup select 'Add New Income' below and start adding each Income Source. To learn how to deal with inconsistent income go to FAQ under My Profile."
        rightContent={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/essential-expenses">
                Essential
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <HamburgerMenu />
          </div>
        }
        leftContent={
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
        }
      />

      <main className="flex-1 pb-8">
        <div className="px-4 py-4 space-y-4">
          {/* Add New Income Button */}
          <Button
            onClick={handleOpenCategoryPicker}
            className="w-full h-12"
          >
            <Plus className="size-5 mr-2" />
            Add New Income
          </Button>

          {/* My Income Totals */}
          <BudgetTotalsBox
            weeklyTotal={weeklyTotal}
            overbudgetTotal={incomeShortage}
            showOverbudget={true}
            overbudgetLabel="Income Shortage"
            title="MY INCOME TOTALS"
          />

          {/* MY INCOME SOURCES */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 border-b text-center">
              MY INCOME SOURCES
            </h3>
            <div className="divide-y">
              {loading ? (
                <p className="text-center text-muted-foreground py-6">Loading...</p>
              ) : sortedSources.length > 0 ? (
                sortedSources.map((source) => {
                  const Icon = iconMap[source.category] || iconMap[source.name] || MoreHorizontal;
                  const weeklyAmount = getWeeklyAmount(source.amount, source.frequency);

                  return (
                    <div
                      key={source.id}
                      className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="size-4" />
                        </div>
                        <p className="font-semibold text-foreground truncate">
                          {getDisplayName(source)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm shrink-0">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(source.amount)}</p>
                          <p className="text-xs text-muted-foreground">{source.frequency}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleOpenEditDialog(source)}
                        >
                          <Edit className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No income sources added yet.
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
            {INCOME_CATEGORIES.map(({ name }) => {
              const Icon = iconMap[name] || MoreHorizontal;
              const categorySources = (incomeSources || []).filter((s) => s.category === name);
              const count = categorySources.length;
              const isAdded = count > 0;
              const weeklyAmount = count === 1 ? getWeeklyAmount(categorySources[0].amount, categorySources[0].frequency) : 0;

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

      {/* Edit Box – My Income */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Box – My Income</DialogTitle>
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
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={handleSaveSource}>
              {sourceToEdit ? 'Update Item' : 'Add'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {sourceToEdit && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteSource(sourceToEdit.id)}
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
