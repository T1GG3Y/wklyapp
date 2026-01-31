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
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Car,
  Trash2,
  Home,
  GraduationCap,
  MoreHorizontal,
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
import { PageHeader } from '@/components/PageHeader';
import { TopNav } from '@/components/TopNav';
import { HelpDialog } from '@/components/HelpDialog';
import {
  LOAN_CATEGORIES,
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
} from '@/lib/format';

interface Loan extends DocumentData {
  id: string;
  name: string;
  category: string;
  totalBalance: number;
  interestRate?: number;
  paymentFrequency: Frequency;
  description?: string;
}

// Icon mapping for loan categories
const iconMap: Record<string, LucideIcon> = {
  'Credit Cards': CreditCard,
  'Auto Loan': Car,
  'Home Mortgages': Home,
  'Student Loan': GraduationCap,
  'Miscellaneous': MoreHorizontal,
};

export default function LoansScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<Loan | null>(null);

  const [formState, setFormState] = useState<{
    category: string;
    name: string;
    balance: string;
    interestRate: string;
    frequency: Frequency;
    description: string;
  }>({
    category: 'Credit Cards',
    name: '',
    balance: '',
    interestRate: '',
    frequency: 'Monthly',
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
        interestRate: loanToEdit.interestRate?.toString() || '',
        frequency: loanToEdit.paymentFrequency as Frequency,
        description: loanToEdit.description || '',
      });
    } else {
      setFormState({
        category: 'Credit Cards',
        name: '',
        balance: '',
        interestRate: '',
        frequency: 'Monthly',
        description: '',
      });
    }
  }, [loanToEdit]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setFormState({ ...formState, balance: formatted });
  };

  const handleOpenAddDialog = (category: string) => {
    setLoanToEdit(null);
    setFormState({
      category: category,
      name: '',
      balance: '',
      interestRate: '',
      frequency: 'Monthly',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (loan: Loan) => {
    setLoanToEdit(loan);
    setIsDialogOpen(true);
  };

  const handleSaveLoan = async () => {
    if (!firestore || !user) return;

    const totalBalance = parseFormattedAmount(formState.balance);
    if (totalBalance <= 0 || !formState.name) {
      alert('Please enter a valid loan name and balance.');
      return;
    }

    // Require description for Miscellaneous
    if (formState.category === 'Miscellaneous' && !formState.description.trim()) {
      alert('Please enter a description for Miscellaneous loans.');
      return;
    }

    const loanData = {
      userProfileId: user.uid,
      name: formState.name,
      category: formState.category,
      totalBalance,
      paymentFrequency: formState.frequency,
      description: formState.description,
      ...(formState.interestRate && { interestRate: parseFloat(formState.interestRate) }),
    };

    try {
      if (loanToEdit) {
        const docRef = doc(firestore, `users/${user.uid}/loans`, loanToEdit.id);
        await updateDoc(docRef, loanData);
      } else {
        const loansCollection = collection(firestore, `users/${user.uid}/loans`);
        await addDoc(loansCollection, loanData);
      }
      setIsDialogOpen(false);
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
        setIsDialogOpen(false);
        setLoanToEdit(null);
      }
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  // Calculate loans health (simplified)
  const loansHealth = useMemo(() => {
    if (!loans || loans.length === 0) {
      return { upToDate: 0, delinquent: 0, delinquentAmount: 0 };
    }
    // Simplified - in real implementation would check payment status
    return {
      upToDate: loans.length,
      delinquent: 0,
      delinquentAmount: 0,
    };
  }, [loans]);

  // Get loans for a category
  const getCategoryLoans = (categoryName: string) => {
    return loans?.filter((l) => l.category === categoryName) || [];
  };

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col overflow-x-hidden">
      <PageHeader
        title="MY LOANS"
        helpTitle="My Loans"
        helpContent={PAGE_HELP.loans}
        subheader={PAGE_SUBHEADERS.loans}
        rightContent={<TopNav />}
        leftContent={
          <Button variant="ghost" size="icon" asChild>
            <Link href="/setup/discretionary">
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <main className="flex-1 flex flex-col p-4 w-full pb-32">
        {/* Loans Health Box */}
        <div className="bg-card rounded-xl p-4 border shadow-sm mb-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Loans Health
          </h3>
          <div className="flex items-center gap-4">
            {/* Health Bar */}
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              {loans && loans.length > 0 ? (
                <>
                  <div
                    className="h-full bg-green-500 float-left"
                    style={{
                      width: `${(loansHealth.upToDate / (loansHealth.upToDate + loansHealth.delinquent)) * 100}%`,
                    }}
                  />
                  {loansHealth.delinquent > 0 && (
                    <div
                      className="h-full bg-red-500 float-left"
                      style={{
                        width: `${(loansHealth.delinquent / (loansHealth.upToDate + loansHealth.delinquent)) * 100}%`,
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="h-full bg-muted" />
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Delinquent</p>
              <p className="font-bold text-destructive">
                {formatCurrency(loansHealth.delinquentAmount)}
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{loansHealth.upToDate} Up to Date</span>
            <span>{loansHealth.delinquent} Delinquent</span>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {LOAN_CATEGORIES.map(({ name }) => {
            const Icon = iconMap[name] || MoreHorizontal;
            const categoryLoans = getCategoryLoans(name);
            const hasLoans = categoryLoans.length > 0;

            return (
              <button
                key={name}
                onClick={() => handleOpenAddDialog(name)}
                className={`flex flex-col items-center justify-center gap-2 text-center p-4 rounded-xl border-2 transition-all duration-200 ${
                  hasLoans
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
                {hasLoans && (
                  <span className="text-xs font-bold">{categoryLoans.length} loan(s)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* MY LOANS List */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider">
            MY LOANS
          </h3>
          {loading ? (
            <p>Loading loans...</p>
          ) : loans && loans.length > 0 ? (
            loans.map((loan) => {
              const Icon = iconMap[loan.category] || MoreHorizontal;
              return (
                <div
                  key={loan.id}
                  className="bg-card p-4 rounded-xl border shadow-sm cursor-pointer"
                  onClick={() => handleOpenEditDialog(loan)}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground text-lg">{loan.name}</p>
                      {loan.description && (
                        <p className="text-sm text-muted-foreground">{loan.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <div>
                          <span className="text-xs text-muted-foreground">Current Balance</span>
                          <p className="font-bold text-foreground">
                            {formatCurrency(loan.totalBalance)}
                          </p>
                        </div>
                        {loan.interestRate && (
                          <div>
                            <span className="text-xs text-muted-foreground">Interest Rate</span>
                            <p className="font-bold text-foreground">{loan.interestRate}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLoan(loan.id);
                      }}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-4">No loans added yet.</p>
          )}
        </div>
      </main>

      {/* Add/Edit Loan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {loanToEdit ? 'Edit' : 'Add'} {formState.category}
            </DialogTitle>
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

            {formState.category === 'Miscellaneous' && (
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="description"
                  placeholder="Describe this loan"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState({ ...formState, description: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="balance">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="balance"
                  placeholder="0.00"
                  value={formState.balance}
                  onChange={handleBalanceChange}
                  className="pl-8 h-12 text-lg"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate</Label>
                <div className="relative">
                  <Input
                    id="interestRate"
                    placeholder="0.00"
                    value={formState.interestRate}
                    onChange={(e) =>
                      setFormState({ ...formState, interestRate: e.target.value })
                    }
                    inputMode="decimal"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
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
            <Button className="w-full sm:w-auto" onClick={handleSaveLoan}>
              {loanToEdit ? 'Update Item' : 'Add'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {loanToEdit && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteLoan(loanToEdit.id)}
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

      {/* Continue Button */}
      <div className="p-4 bg-background/95 backdrop-blur-md border-t fixed bottom-0 w-full z-30 left-0 right-0">
        <Button
          asChild
          className="w-full h-14 rounded-xl text-lg font-bold shadow-lg"
        >
          <Link href="/setup/savings">
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
