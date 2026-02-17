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
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  type DocumentData,
} from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HelpDialog } from '@/components/HelpDialog';
import { BottomNav } from '@/components/BottomNav';
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
} from '@/lib/format';

interface Loan extends DocumentData {
  id: string;
  name: string;
  category: string;
  totalBalance: number;
  paidAmount?: number;
  interestRate?: number;
  paymentFrequency: Frequency;
  payoffDate?: string;
  description?: string;
}

const iconMap: Record<string, LucideIcon> = {
  'Credit Cards': CreditCard,
  'Auto Loan': Car,
  'Home Mortgages': Home,
  'Student Loan': GraduationCap,
  'Miscellaneous': MoreHorizontal,
};

export default function LoansPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<Loan | null>(null);

  const [formState, setFormState] = useState<{
    category: string;
    name: string;
    balance: string;
    paidAmount: string;
    interestRate: string;
    frequency: Frequency;
    payoffDate?: Date;
    description: string;
  }>({
    category: 'Credit Cards',
    name: '',
    balance: '',
    paidAmount: '',
    interestRate: '',
    frequency: 'Monthly',
    payoffDate: undefined,
    description: '',
  });

  const loansPath = useMemo(() => {
    return user ? `users/${user.uid}/loans` : '';
  }, [user]);

  const { data: loans, loading } = useCollection<Loan>(loansPath);

  useEffect(() => {
    if (loanToEdit) {
      setFormState({
        category: loanToEdit.category,
        name: loanToEdit.name,
        balance: formatAmountInput(loanToEdit.totalBalance.toString()),
        paidAmount: loanToEdit.paidAmount ? formatAmountInput(loanToEdit.paidAmount.toString()) : '',
        interestRate: loanToEdit.interestRate?.toString() || '',
        frequency: loanToEdit.paymentFrequency as Frequency,
        payoffDate: loanToEdit.payoffDate ? parseISO(loanToEdit.payoffDate) : undefined,
        description: loanToEdit.description || '',
      });
    }
  }, [loanToEdit]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, balance: formatAmountInput(e.target.value) });
  };

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, paidAmount: formatAmountInput(e.target.value) });
  };

  const handleOpenCategoryPicker = () => {
    setIsCategoryPickerOpen(true);
  };

  const handleCategorySelected = (category: string) => {
    setIsCategoryPickerOpen(false);
    setLoanToEdit(null);
    setFormState({
      category,
      name: '',
      balance: '',
      paidAmount: '',
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

  const handleSaveLoan = async () => {
    if (!firestore || !user) return;

    const totalBalance = parseFormattedAmount(formState.balance);
    if (totalBalance <= 0 || !formState.name) {
      alert('Please enter a valid loan name and balance.');
      return;
    }

    if (formState.category === 'Miscellaneous' && !formState.description.trim()) {
      alert('Please enter a description for Miscellaneous loans.');
      return;
    }

    const paidAmount = parseFormattedAmount(formState.paidAmount);

    const loanData = {
      userProfileId: user.uid,
      name: formState.name,
      category: formState.category,
      totalBalance,
      paidAmount: paidAmount || 0,
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
      }
      setIsEditDialogOpen(false);
      setLoanToEdit(null);
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/loans`, loanId));
      if (loanToEdit?.id === loanId) {
        setIsEditDialogOpen(false);
        setLoanToEdit(null);
      }
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  const loanTotals = useMemo(() => {
    if (!loans || loans.length === 0) {
      return { totalPaid: 0, totalBalance: 0, delinquent: 0, percentPaid: 0 };
    }
    const totalPaid = loans.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0);
    const totalBalance = loans.reduce((sum, loan) => sum + loan.totalBalance, 0);
    const totalOriginal = totalPaid + totalBalance;
    const percentPaid = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;
    return { totalPaid, totalBalance, delinquent: 0, percentPaid };
  }, [loans]);

  const getCategoryLoans = (categoryName: string) => {
    return loans?.filter((l) => l.category === categoryName) || [];
  };

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col overflow-x-hidden">
      <PageHeader
        title="MY LOANS"
        helpTitle="My Loans"
        helpContent={PAGE_HELP.loans}
        subheader="Tap each category to add each loan."
        rightContent={<HamburgerMenu />}
        leftContent={
          <Button variant="ghost" size="icon" asChild>
            <Link href="/discretionary-expenses">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <main className="flex-1 flex flex-col p-4 w-full pb-48">
        <div className="space-y-4">
          <Button onClick={handleOpenCategoryPicker} className="w-full h-12">
            <Plus className="size-5 mr-2" />
            Add New Loan
          </Button>

          {/* My Total Loans Box */}
          <div className="bg-card rounded-xl p-4 border shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
              My Total Loans
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-bold">{formatCurrency(loanTotals.totalPaid)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-lg font-bold">{formatCurrency(loanTotals.totalBalance)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Delinquent</p>
                <p className={cn("text-lg font-bold", loanTotals.delinquent > 0 ? "text-destructive" : "text-foreground")}>
                  {formatCurrency(loanTotals.delinquent)}
                </p>
              </div>
            </div>
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${loanTotals.percentPaid}%` }} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                {loanTotals.percentPaid.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* My Loans Table */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 border-b text-center">
              My Loans
            </h3>
            <div className="divide-y">
              {loading ? (
                <p className="text-center text-muted-foreground py-6">Loading...</p>
              ) : loans && loans.length > 0 ? (
                loans.map((loan) => {
                  const Icon = iconMap[loan.category] || MoreHorizontal;
                  const paidAmount = loan.paidAmount || 0;
                  const totalOriginal = paidAmount + loan.totalBalance;
                  const percentPaid = totalOriginal > 0 ? (paidAmount / totalOriginal) * 100 : 0;

                  return (
                    <div key={loan.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="size-4" />
                          </div>
                          <span className="font-semibold text-foreground">{loan.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenEditDialog(loan)}>
                          <Edit className="size-4" />
                        </Button>
                      </div>
                      <div className="relative h-5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percentPaid}%` }} />
                        <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold">{percentPaid.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Paid: </span>
                          <span className="font-semibold">{formatCurrency(paidAmount)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Balance: </span>
                          <span className="font-semibold">{formatCurrency(loan.totalBalance)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payoff: </span>
                          <span className="font-semibold">
                            {loan.payoffDate ? format(parseISO(loan.payoffDate), 'MMM yyyy') : '—'}
                          </span>
                        </div>
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
                      content={CATEGORY_HELP[name] || CATEGORY_HELP['Miscellaneous']}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Box – My Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Chase Sapphire"
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
                <Label htmlFor="balance">Amount</Label>
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

            {/* Interest Rate (replaces Auto Calculate) */}
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

      {/* Footer Buttons */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none w-full z-10">
        <div className="pointer-events-auto flex gap-3">
          <Button asChild variant="outline" className="flex-1 h-12 text-base font-bold" size="lg">
            <Link href="/discretionary-expenses">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Discretionary
            </Link>
          </Button>
          <Button asChild className="flex-1 h-12 text-base font-bold shadow-lg" size="lg">
            <Link href="/savings-goals">
              Continue to Savings
            </Link>
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
