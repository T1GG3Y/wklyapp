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
import { ArrowLeft, CreditCard, Car, Check, Plus, Trash2, Home, School } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  type DocumentData,
} from 'firebase/firestore';
import { useMemo, useState } from 'react';

interface Loan extends DocumentData {
  id: string;
  name: string;
  category: string;
  totalBalance: number;
  interestRate?: number;
  paymentFrequency: 'Weekly' | 'Monthly';
}

const loanCategories = [
  { name: 'Credit Card', icon: CreditCard },
  { name: 'Auto', icon: Car },
  { name: 'Mortgage', icon: Home },
  { name: 'Student', icon: School },
];

export default function LoansScreen() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [selectedCategory, setSelectedCategory] = useState('Credit Card');
  const [balance, setBalance] = useState('');
  const [loanName, setLoanName] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [frequency, setFrequency] = useState<'Weekly' | 'Monthly'>('Monthly');

  const loansCollection = useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/loans`);
  }, [user, firestore]);

  const { data: loans, loading } = useCollection<Loan>(
    loansCollection?.path || ''
  );

  const handleSaveLoan = async () => {
    if (!loansCollection || !user) return;
    const totalBalance = parseFloat(balance);
    if (isNaN(totalBalance) || totalBalance <= 0 || !loanName) {
      alert('Please enter a valid loan name and balance.');
      return;
    }

    const newLoan: Omit<Loan, 'id'> = {
      userProfileId: user.uid,
      name: loanName,
      category: selectedCategory,
      totalBalance,
      paymentFrequency: frequency,
      ...(interestRate && { interestRate: parseFloat(interestRate) }),
    };

    try {
      await addDoc(loansCollection, newLoan);
      // Reset form
      setLoanName('');
      setBalance('');
      setInterestRate('');
      setFrequency('Monthly');
      setSelectedCategory('Credit Card');
    } catch (error) {
      console.error('Error adding loan:', error);
    }
  };
  
  const handleDeleteLoan = async (loanId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/loans`, loanId));
    } catch (error) {
      console.error("Error deleting loan:", error);
    }
  };


  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col overflow-x-hidden max-w-md mx-auto">
      <div className="sticky top-0 z-50 flex items-center bg-background p-4 pb-2 justify-between border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/setup/required-expenses">
            <ArrowLeft />
          </Link>
        </Button>
        <h2 className="text-foreground text-lg font-bold leading-tight flex-1 text-center pr-12">
          Add Your Loans
        </h2>
      </div>
      <main className="flex-1 flex flex-col p-4 w-full pb-32">
        <div className="mb-6 text-center">
          <h1 className="text-foreground tracking-tight text-[28px] font-bold leading-tight pb-2 pt-2">
            Let&apos;s track your debt
          </h1>
          <p className="text-muted-foreground text-base font-normal">
            Add your loans one by one. Choose a category to get started.
          </p>
        </div>
        
        {/* Loan Items List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Your Loans</h3>
           {loading ? <p>Loading loans...</p> : loans && loans.length > 0 ? (
            loans.map(loan => (
              <div key={loan.id} className="bg-card p-3 rounded-lg border flex items-center gap-3">
                <div className="size-10 bg-muted rounded-md flex items-center justify-center">
                   {loan.category === 'Credit Card' && <CreditCard className="size-5 text-muted-foreground" />}
                   {loan.category === 'Auto' && <Car className="size-5 text-muted-foreground" />}
                   {loan.category === 'Mortgage' && <Home className="size-5 text-muted-foreground" />}
                   {loan.category === 'Student' && <School className="size-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{loan.name}</p>
                  <p className="text-sm text-muted-foreground">${loan.totalBalance.toFixed(2)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteLoan(loan.id)}>
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))
           ) : (
            <p className="text-center text-muted-foreground py-4">No loans added yet.</p>
           )}
        </div>


        <div className="bg-card border rounded-xl p-4">
          <div className="mb-4">
            <Label className="text-muted-foreground text-sm font-medium mb-2 block">Category</Label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {loanCategories.map(({ name, icon: Icon }) => (
                <Button
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  variant={selectedCategory === name ? 'default' : 'outline'}
                  className="pl-3 pr-4"
                  size="lg"
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {name}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label
                className="block text-muted-foreground text-sm font-medium mb-2"
                htmlFor="loan-name"
              >
                Loan Name
              </Label>
              <Input
                id="loan-name"
                className="w-full bg-background text-foreground text-base py-3 px-4 rounded-lg border h-auto focus:border-primary"
                placeholder="e.g. Chase Sapphire"
                type="text"
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
              />
            </div>
            <div>
              <Label
                className="block text-muted-foreground text-sm font-medium mb-2"
                htmlFor="balance"
              >
                Total Outstanding Balance
              </Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl font-light">
                  $
                </span>
                <Input
                  id="balance"
                  className="w-full bg-background text-foreground text-2xl font-bold py-4 pl-10 pr-4 rounded-lg border focus:border-primary h-auto"
                  placeholder="0.00"
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-muted-foreground text-sm font-medium mb-2">
                  Interest Rate (APR)
                </Label>
                <div className="relative">
                  <Input
                    className="w-full bg-background text-foreground text-base py-3 px-4 rounded-lg border h-auto focus:border-primary"
                    placeholder="e.g. 21.5"
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
              </div>
              <div>
                <Label className="block text-muted-foreground text-sm font-medium mb-2">
                  Payment Frequency
                </Label>
                <Select
                  value={frequency}
                  onValueChange={(value: 'Weekly' | 'Monthly') =>
                    setFrequency(value)
                  }
                >
                  <SelectTrigger className="w-full bg-background text-foreground text-base py-3 px-4 rounded-lg border h-auto focus:border-primary">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full font-bold text-lg py-3 h-auto rounded-lg"
              size="lg"
              onClick={handleSaveLoan}
            >
              <Plus className="mr-2 h-5 w-5" /> Add This Loan
            </Button>
          </div>
        </div>
      </main>
      <div className="sticky bottom-4 w-full mt-auto px-4">
        <Button
          asChild
          className="w-full font-bold text-lg py-4 h-auto rounded-xl shadow-lg shadow-primary/20"
          size="lg"
        >
          <Link href="/setup/discretionary">
            Finished Adding Loans <Check className="ml-2 h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
}