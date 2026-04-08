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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Car,
  Trash2,
  Home,
  GraduationCap,
  MoreHorizontal,
  Plus,
  Edit,
  CalendarIcon,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, differenceInWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HelpDialog } from '@/components/HelpDialog';
import { BudgetTotalsBox } from '@/components/BudgetTotalsBox';
import {
  LOAN_CATEGORIES,
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

interface Loan extends DocumentData {
  id: string;
  name: string;
  category: string;
  paymentAmount: number;
  totalBalance: number;
  paidAmount?: number;
  originalLoanAmount?: number;
  interestRate?: number;
  paymentFrequency: Frequency;
  payoffDate?: string;
  description?: string;
}

interface UserProfile extends DocumentData {
  startDayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
}

const dayIndexMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

const iconMap: Record<string, LucideIcon> = {
  'Credit Cards': CreditCard,
  'Auto Loan': Car,
  'Home Mortgages': Home,
  'Student Loan': GraduationCap,
  'Custom': MoreHorizontal,
};

export default function LoansPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreditCardInfoOpen, setIsCreditCardInfoOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<Loan | null>(null);
  const [allTimeSpentByCategory, setAllTimeSpentByCategory] = useState<Record<string, number>>({});
  const [budgetStartDateByCategory, setBudgetStartDateByCategory] = useState<Record<string, Date>>({});
  const hasLoadedTransactions = useRef(false);

  const [formState, setFormState] = useState<{
    category: string;
    name: string;
    paymentAmount: string;
    balance: string;
    paidAmount: string;
    originalLoanAmount: string;
    interestRate: string;
    frequency: Frequency;
    payoffDate?: Date;
    description: string;
  }>({
    category: 'Credit Cards',
    name: '',
    paymentAmount: '',
    balance: '',
    paidAmount: '',
    originalLoanAmount: '',
    interestRate: '',
    frequency: 'Monthly',
    payoffDate: undefined,
    description: '',
  });

  const loansPath = useMemo(() => {
    return user ? `users/${user.uid}/loans` : '';
  }, [user]);

  const { data: loans, loading } = useCollection<Loan>(loansPath);

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);

  // Fetch transactions to calculate Available amounts with weekly carryover
  const loadTransactions = useCallback(async () => {
    if (!firestore || !user || hasLoadedTransactions.current) return;
    try {
      const txRef = collection(firestore, `users/${user.uid}/transactions`);
      const snapshot = await getDocs(txRef);
      const allTimeSpent: Record<string, number> = {};
      const earliestByCategory: Record<string, Date> = {};

      snapshot.forEach((d) => {
        const data = d.data();
        if (!data.date) return;
        const txDate = data.date.toDate();
        const cat = data.category || '';

        let amt = 0;
        if (data.type === 'Expense') {
          amt = Math.abs(data.amount);
        } else if (data.type === 'Income') {
          amt = -Math.abs(data.amount);
        } else {
          return;
        }

        allTimeSpent[cat] = (allTimeSpent[cat] || 0) + amt;
        if (!earliestByCategory[cat] || txDate < earliestByCategory[cat]) {
          earliestByCategory[cat] = txDate;
        }
      });

      setAllTimeSpentByCategory(allTimeSpent);
      setBudgetStartDateByCategory(earliestByCategory);
      hasLoadedTransactions.current = true;
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [firestore, user]);

  useEffect(() => {
    if (user && firestore) loadTransactions();
  }, [user, firestore, loadTransactions]);

  useEffect(() => {
    if (loanToEdit) {
      setFormState({
        category: loanToEdit.category,
        name: loanToEdit.name,
        paymentAmount: loanToEdit.paymentAmount ? formatAmountInput(loanToEdit.paymentAmount.toFixed(2)) : (loanToEdit.totalBalance ? formatAmountInput(loanToEdit.totalBalance.toFixed(2)) : ''),
        balance: loanToEdit.totalBalance ? formatAmountInput(loanToEdit.totalBalance.toFixed(2)) : '',
        paidAmount: loanToEdit.paidAmount ? formatAmountInput(loanToEdit.paidAmount.toFixed(2)) : '',
        originalLoanAmount: loanToEdit.originalLoanAmount ? formatAmountInput(loanToEdit.originalLoanAmount.toFixed(2)) : '',
        interestRate: loanToEdit.interestRate?.toString() || '',
        frequency: loanToEdit.paymentFrequency as Frequency,
        payoffDate: loanToEdit.payoffDate ? parseISO(loanToEdit.payoffDate) : undefined,
        description: loanToEdit.description || '',
      });
    }
  }, [loanToEdit]);

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, paymentAmount: formatAmountInput(e.target.value) });
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, balance: formatAmountInput(e.target.value) });
  };

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, paidAmount: formatAmountInput(e.target.value) });
  };

  const handleOriginalLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, originalLoanAmount: formatAmountInput(e.target.value) });
  };

  const handleOpenCategoryPicker = () => {
    setIsCategoryPickerOpen(true);
  };

  const handleCategorySelected = (category: string) => {
    setIsCategoryPickerOpen(false);

    // Credit Cards: show info dialog only, do not allow adding
    if (category === 'Credit Cards') {
      setIsCreditCardInfoOpen(true);
      return;
    }

    setLoanToEdit(null);
    setFormState({
      category,
      name: category,
      paymentAmount: '',
      balance: '',
      paidAmount: '',
      originalLoanAmount: '',
      interestRate: '',
      frequency: 'Monthly',
      payoffDate: undefined,
      description: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenEditDialog = (loan: Loan) => {
    setLoanToEdit(loan);
    setIsEditDialogOpen(true);
  };

  // Check how many times a category is used
  const getCategoryCount = (categoryName: string) => {
    return (loans || []).filter((l) => l.category === categoryName).length;
  };

  const handleSaveLoan = async () => {
    if (!firestore || !user) return;

    const paymentAmount = parseFormattedAmount(formState.paymentAmount);
    if (paymentAmount <= 0 && formState.category !== 'Credit Cards') {
      alert('Please enter a valid payment amount.');
      return;
    }

    if (!formState.payoffDate) {
      alert('Please select a Payment Date.');
      return;
    }

    if (formState.category === 'Custom' && !formState.description.trim()) {
      alert('Please enter a description for Custom loans.');
      return;
    }

    // Require description if subcategory is used more than once
    const existingCount = getCategoryCount(formState.category);
    const willBeDuplicate = loanToEdit
      ? existingCount > 1
      : existingCount >= 1;

    if (willBeDuplicate && !formState.description.trim()) {
      alert(`Please enter a description since "${formState.category}" is used more than once.`);
      return;
    }

    const totalBalance = parseFormattedAmount(formState.balance);
    const paidAmount = parseFormattedAmount(formState.paidAmount);
    const originalLoanAmount = parseFormattedAmount(formState.originalLoanAmount);

    const loanData = {
      userProfileId: user.uid,
      name: formState.category,
      category: formState.category,
      paymentAmount,
      totalBalance: totalBalance || 0,
      paidAmount: paidAmount || 0,
      originalLoanAmount: originalLoanAmount || 0,
      paymentFrequency: formState.frequency,
      description: formState.description,
      ...(formState.interestRate && { interestRate: parseFloat(formState.interestRate) }),
      ...(formState.payoffDate && { payoffDate: format(formState.payoffDate, 'yyyy-MM-dd') }),
    };

    try {
      if (loanToEdit) {
        const docRef = doc(firestore, `users/${user.uid}/loans`, loanToEdit.id);
        await updateDoc(docRef, loanData);
      } else {
        const loansCollection = collection(firestore, `users/${user.uid}/loans`);
        await addDoc(loansCollection, loanData);

        // Seed initial available balance if payment date is set
        if (formState.payoffDate && paymentAmount > 0) {
          const weeklyAmount = getWeeklyAmount(paymentAmount, formState.frequency);
          const weeksUntilDue = Math.max(1, differenceInWeeks(formState.payoffDate, new Date()) + 1);
          // Subtract an extra week because calculateAvailable always includes
          // the current week's budget (weeksElapsed starts at 1)
          const budgetWillAccumulate = weeklyAmount * (weeksUntilDue + 1);
          const initialSeed = paymentAmount - budgetWillAccumulate;

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
              date: serverTimestamp(),
              autoGenerated: true,
            });
          }
        }
      }
      setIsEditDialogOpen(false);
      setLoanToEdit(null);
      hasLoadedTransactions.current = false;
      loadTransactions();
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!firestore || !user) return;
    try {
      const loan = loans?.find((l) => l.id === loanId);
      if (loan) {
        const payment = loan.paymentAmount || loan.totalBalance || 0;
        const weeklyAmount = getWeeklyAmount(payment, loan.paymentFrequency);
        const startDay = userProfile?.startDayOfWeek || 'Sunday';
        const wsOn = dayIndexMap[startDay];
        const dn = getDisplayName(loan);
        const totalSpent = allTimeSpentByCategory[dn] || 0;
        const catStart = budgetStartDateByCategory[dn] || new Date();
        const available = calculateAvailable(weeklyAmount, totalSpent, catStart, wsOn);

        if (available > 0) {
          const txCollection = collection(firestore, `users/${user.uid}/transactions`);
          const moveGroup = Date.now().toString();
          const loanDisplayName = loan.description ? `${loan.category} - ${loan.description}` : loan.category;
          await addDoc(txCollection, {
            userProfileId: user.uid,
            type: 'Expense',
            amount: available,
            description: `Deleted loan: ${loan.name || loan.category}`,
            category: loanDisplayName,
            date: serverTimestamp(),
            moveGroup,
            autoGenerated: true,
          });
          await addDoc(txCollection, {
            userProfileId: user.uid,
            type: 'Income',
            amount: available,
            description: `From deleted loan: ${loan.name || loan.category}`,
            category: 'Savings: Unassigned Income',
            date: serverTimestamp(),
            moveGroup,
            autoGenerated: true,
          });
        }
      }

      await deleteDoc(doc(firestore, `users/${user.uid}/loans`, loanId));
      if (loanToEdit?.id === loanId) {
        setIsEditDialogOpen(false);
        setLoanToEdit(null);
      }
      hasLoadedTransactions.current = false;
      loadTransactions();
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  const loanTotals = useMemo(() => {
    if (!loans || loans.length === 0) {
      return { totalBalance: 0, totalOriginal: 0, percentPaid: 0 };
    }
    const totalBalance = loans.reduce((sum, loan) => sum + (loan.totalBalance || 0), 0);
    const totalOriginal = loans.reduce((sum, loan) => sum + (loan.originalLoanAmount || 0), 0);
    const percentPaid = totalOriginal > 0 ? ((totalOriginal - totalBalance) / totalOriginal) * 100 : 0;
    return { totalBalance, totalOriginal, percentPaid };
  }, [loans]);

  const { weeklyTotal, overBudgetTotal } = useMemo(() => {
    if (!loans || loans.length === 0) return { weeklyTotal: 0, overBudgetTotal: 0 };
    const weekly = loans.reduce((total, loan) => {
      const payment = loan.paymentAmount || loan.totalBalance || 0;
      return total + getWeeklyAmount(payment, loan.paymentFrequency);
    }, 0);

    const startDay = userProfile?.startDayOfWeek || 'Sunday';
    const wsOn = dayIndexMap[startDay];
    const overBudget = loans.reduce((total, loan) => {
      const payment = loan.paymentAmount || loan.totalBalance || 0;
      const wkAmt = getWeeklyAmount(payment, loan.paymentFrequency);
      const displayName = loan.description ? `${loan.category} - ${loan.description}` : loan.category;
      const totalSpent = allTimeSpentByCategory[displayName] || 0;
      const catStart = budgetStartDateByCategory[displayName] || new Date();
      const avail = calculateAvailable(wkAmt, totalSpent, catStart, wsOn);
      return total + (avail < 0 ? Math.abs(avail) : 0);
    }, 0);

    return { weeklyTotal: weekly, overBudgetTotal: overBudget };
  }, [loans, allTimeSpentByCategory, budgetStartDateByCategory, userProfile]);

  // Sort loans alphabetically by category then description
  const sortedLoans = useMemo(() => {
    if (!loans) return [];
    return [...loans].sort((a, b) => {
      const catCmp = a.category.localeCompare(b.category);
      if (catCmp !== 0) return catCmp;
      return (a.description || '').localeCompare(b.description || '');
    });
  }, [loans]);

  // Display name: "Category - Description" if description exists
  const getDisplayName = (loan: Loan) => {
    const name = loan.category;
    if (loan.description) {
      return `${name} - ${loan.description}`;
    }
    return name;
  };

  const getCategoryLoans = (categoryName: string) => {
    return loans?.filter((l) => l.category === categoryName) || [];
  };

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col h-screen overflow-y-auto">
      <PageHeader
        title="MY LOANS"
        helpTitle="My Loans"
        helpContent={PAGE_HELP.loans}
        subheader="For Setup select 'Add New Loan' below and start adding each Loan"
        rightContent={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/savings-goals">
                Savings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <HamburgerMenu />
          </div>
        }
        leftContent={
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/discretionary-expenses">
              <ArrowLeft className="h-4 w-4" />
              Discretionary
            </Link>
          </Button>
        }
      />

      <main className="flex-1 flex flex-col p-4 w-full pb-8">
        <div className="space-y-4">
          <Button onClick={handleOpenCategoryPicker} className="w-full h-12">
            <Plus className="size-5 mr-2" />
            Add New Loan
          </Button>

          {/* My Loan Totals Box */}
          <div className="bg-card rounded-xl p-4 border shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
              My Loan Totals
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <p className="text-lg font-bold">{formatCurrency(loanTotals.totalBalance)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Original</p>
                <p className="text-lg font-bold">{formatCurrency(loanTotals.totalOriginal)}</p>
              </div>
            </div>
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${loanTotals.percentPaid}%` }} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                {loanTotals.percentPaid.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* My Loan Budget Totals */}
          <BudgetTotalsBox
            weeklyTotal={weeklyTotal}
            overbudgetTotal={overBudgetTotal}
            showOverbudget={true}
            title="My Loan Payment Totals"
          />

          {/* My Loans Table */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 border-b text-center">
              My Loans
            </h3>
            <div className="divide-y">
              {loading ? (
                <p className="text-center text-muted-foreground py-6">Loading...</p>
              ) : sortedLoans.length > 0 ? (
                sortedLoans.map((loan) => {
                  const Icon = iconMap[loan.category] || MoreHorizontal;
                  const payment = loan.paymentAmount || loan.totalBalance || 0;
                  const weeklyAmount = getWeeklyAmount(payment, loan.paymentFrequency);
                  const startDay = userProfile?.startDayOfWeek || 'Sunday';
                  const wsOn = dayIndexMap[startDay];
                  const dn = getDisplayName(loan);
                  const totalSpent = allTimeSpentByCategory[dn] || 0;
                  const catStart = budgetStartDateByCategory[dn] || new Date();
                  const amountAvailable = calculateAvailable(weeklyAmount, totalSpent, catStart, wsOn);

                  return (
                    <div
                      key={loan.id}
                      className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="size-4" />
                        </div>
                        <p className="font-semibold text-foreground truncate">
                          {getDisplayName(loan)}
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
                          onClick={() => handleOpenEditDialog(loan)}
                        >
                          <Edit className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-6">No loans added yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Category Picker Dialog */}
      <Dialog open={isCategoryPickerOpen} onOpenChange={setIsCategoryPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Loan Category</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2">
            {LOAN_CATEGORIES.map(({ name }) => {
              const Icon = iconMap[name] || MoreHorizontal;
              const categoryLoans = getCategoryLoans(name);
              const hasLoans = categoryLoans.length > 0;

              return (
                <button
                  key={name}
                  onClick={() => handleCategorySelected(name)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 text-center p-3 rounded-xl border transition-all duration-200 relative min-h-[80px]',
                    hasLoans
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
                  {hasLoans && (
                    <span className="text-[10px] font-bold">{categoryLoans.length} loan(s)</span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Box – My Loan */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onFocusOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Box – My Loan</DialogTitle>
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
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="paymentAmount"
                    placeholder="0.00"
                    value={formState.paymentAmount}
                    onChange={handlePaymentAmountChange}
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
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal px-3', !formState.payoffDate && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {formState.payoffDate ? (
                        <span className="text-xs">{format(formState.payoffDate, 'MM/dd/yy')}</span>
                      ) : (
                        <span className="text-xs">Pick</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarPicker
                      mode="single"
                      selected={formState.payoffDate}
                      onSelect={(date) => setFormState({ ...formState, payoffDate: date as Date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Balance, Original Loan Amount, Interest Rate */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="balance"
                    placeholder="0.00"
                    value={formState.balance}
                    onChange={handleBalanceChange}
                    className="pl-7"
                    inputMode="decimal"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalLoanAmount">Original Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="originalLoanAmount"
                    placeholder="0.00"
                    value={formState.originalLoanAmount}
                    onChange={handleOriginalLoanAmountChange}
                    className="pl-7"
                    inputMode="decimal"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate</Label>
                <div className="relative">
                  <Input
                    id="interestRate"
                    placeholder="0.00"
                    value={formState.interestRate}
                    onChange={(e) => setFormState({ ...formState, interestRate: e.target.value })}
                    inputMode="decimal"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={handleSaveLoan}>
              {loanToEdit ? 'Update Item' : 'Add'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {loanToEdit && (
                <Button variant="destructive" className="flex-1" onClick={() => handleDeleteLoan(loanToEdit.id)}>
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

      {/* Credit Card Info Dialog */}
      <Dialog open={isCreditCardInfoOpen} onOpenChange={setIsCreditCardInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit Cards</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed py-2">
            {CATEGORY_HELP['Credit Cards']}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreditCardInfoOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
