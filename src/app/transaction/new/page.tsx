'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function NewTransactionScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateTransaction = async (andNew: boolean = false) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to add a transaction.',
      });
      return;
    }

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number for the amount.',
      });
      return;
    }
    
    // For now, we'll use a generic category. Category selection can be added later.
    const category = type === 'Expense' ? 'General Expense' : 'General Income';

    try {
      const transactionsCollection = collection(
        firestore,
        `users/${user.uid}/transactions`
      );
      await addDoc(transactionsCollection, {
        userProfileId: user.uid,
        type,
        amount: transactionAmount,
        description,
        category,
        date: serverTimestamp(),
      });

      toast({
        title: 'Transaction Added',
        description: `${type} of $${transactionAmount.toFixed(2)} recorded.`,
      });

      if (andNew) {
        setAmount('');
        setDescription('');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save the transaction. Please try again.',
      });
    }
  };

  return (
    <div className="bg-background text-foreground transition-colors duration-200 min-h-screen flex justify-center">
      <div className="w-full max-w-md bg-card shadow-xl min-h-screen flex flex-col relative overflow-hidden">
        <header className="px-4 py-3 flex items-center justify-between border-b sticky top-0 bg-card/90 backdrop-blur-sm z-10">
          <Button variant="ghost" size="icon" className="-ml-2" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="text-muted-foreground" />
            </Link>
          </Button>
          <h1 className="text-lg font-bold font-headline text-foreground">
            New Transaction
          </h1>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
          <div className="space-y-3">
            <Label className="block text-sm font-semibold text-muted-foreground">
              Amount
            </Label>
            <div className="flex bg-muted rounded-lg p-1 mb-2">
              <Button
                onClick={() => setType('Income')}
                variant={type === 'Income' ? 'default' : 'ghost'}
                className={cn('flex-1 rounded-md h-auto py-2 text-sm font-medium', type === 'Income' && 'bg-primary text-primary-foreground shadow-sm')}
              >
                Income
              </Button>
              <Button
                onClick={() => setType('Expense')}
                variant={type === 'Expense' ? 'default' : 'ghost'}
                className={cn('flex-1 rounded-md h-auto py-2 text-sm font-medium', type === 'Expense' && 'bg-secondary text-secondary-foreground shadow-sm')}
              >
                Expense
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className={cn("text-3xl font-bold", type === 'Income' ? 'text-primary' : 'text-secondary')}>$</span>
              </div>
              <Input
                className={cn("block w-full pl-10 pr-4 py-6 rounded-lg bg-background border-2 text-4xl font-bold focus:ring-2 h-auto text-right", 
                  type === 'Income' ? 'border-primary/20 text-primary focus:ring-primary' : 'border-secondary/20 text-secondary focus:ring-secondary')}
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="block text-sm font-semibold text-muted-foreground">
              Description (Optional)
            </Label>
            <Input
              id="description"
              className="block w-full px-4 py-3 rounded-lg bg-background border text-base text-foreground focus:ring-2 focus:ring-primary h-auto"
              placeholder="e.g., Coffee with a friend"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

        </main>

        <footer className="absolute bottom-0 left-0 w-full bg-card/80 backdrop-blur-lg border-t p-5 pb-8 flex space-x-4 items-center">
          <Button
            onClick={() => handleCreateTransaction(true)}
            variant="outline"
            className="flex-1 py-3 px-4 h-12 font-semibold rounded-xl text-base"
          >
            Create + New
          </Button>
          <Button
            onClick={() => handleCreateTransaction(false)}
            className="flex-none py-3 px-8 h-12 font-semibold rounded-xl text-base shadow-md"
          >
            Create
          </Button>
        </footer>
      </div>
    </div>
  );
}
