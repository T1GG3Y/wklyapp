
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  type DocumentData
} from 'firebase/firestore';
import { ArrowLeft, DollarSign, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';

interface Transaction extends DocumentData {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  description: string;
  category: string;
}

interface RequiredExpense extends DocumentData {
  category: string;
}
interface DiscretionaryExpense extends DocumentData {
  category: string;
}
interface Loan extends DocumentData {
  name: string;
}
interface SavingsGoal extends DocumentData {
  name: string;
}


export default function EditTransactionScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const transactionId = params.id as string;

  const transactionPath = user
    ? `users/${user.uid}/transactions/${transactionId}`
    : '';
  const { data: transaction, loading } = useDoc<Transaction>(transactionPath);

  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // Fetch categories
  const requiredExpensesPath = useMemo(() => user ? `users/${user.uid}/requiredExpenses` : null, [user]);
  const discretionaryExpensesPath = useMemo(() => user ? `users/${user.uid}/discretionaryExpenses` : null, [user]);
  const loansPath = useMemo(() => user ? `users/${user.uid}/loans` : null, [user]);
  const savingsGoalsPath = useMemo(() => user ? `users/${user.uid}/savingsGoals` : null, [user]);

  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: loans } = useCollection<Loan>(loansPath);
  const { data: savingsGoals } = useCollection<SavingsGoal>(savingsGoalsPath);


  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setCategory(transaction.category);
    }
  }, [transaction]);

  const handleUpdateTransaction = async () => {
    if (!firestore || !user || !transaction) return;

    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number for the amount.',
      });
      return;
    }

    try {
      const transactionRef = doc(
        firestore,
        `users/${user.uid}/transactions`,
        transaction.id
      );
      await updateDoc(transactionRef, {
        type,
        amount: transactionAmount,
        description,
        category,
      });

      toast({
        title: 'Transaction Updated',
        description: 'Your transaction has been successfully updated.',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update the transaction. Please try again.',
      });
    }
  };
  
  const handleDeleteTransaction = async () => {
    if (!firestore || !user || !transaction) return;
    try {
        const transactionRef = doc(
            firestore,
            `users/${user.uid}/transactions`,
            transaction.id
        );
        await deleteDoc(transactionRef);
        toast({
            title: "Transaction Deleted",
            description: "Your transaction has been removed.",
        });
        router.push('/dashboard');
    } catch (error) {
        console.error('Error deleting transaction:', error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the transaction. Please try again.",
        });
    }
  };


  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading transaction...</p>
        </div>
    )
  }
  
  if (!transaction) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p className='mb-4'>Transaction not found.</p>
            <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
        </div>
    )
  }

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
            Edit Transaction
          </h1>
          <div className="w-10">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className='text-muted-foreground hover:text-destructive'>
                        <Trash2 />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this transaction from your records.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTransaction} className={cn(buttonVariants({variant: 'destructive'}))}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
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
                className={cn(
                  'flex-1 rounded-md h-auto py-2 text-sm font-medium',
                  type === 'Income' && 'bg-primary text-primary-foreground shadow-sm'
                )}
              >
                Income
              </Button>
              <Button
                onClick={() => setType('Expense')}
                variant={type === 'Expense' ? 'default' : 'ghost'}
                className={cn(
                  'flex-1 rounded-md h-auto py-2 text-sm font-medium',
                  type === 'Expense' &&
                    'bg-secondary text-secondary-foreground shadow-sm'
                )}
              >
                Expense
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span
                  className={cn(
                    'text-3xl font-bold',
                    type === 'Income' ? 'text-primary' : 'text-secondary'
                  )}
                >
                  $
                </span>
              </div>
              <Input
                className={cn(
                  'block w-full pl-10 pr-4 py-6 rounded-lg bg-background border-2 text-4xl font-bold focus:ring-2 h-auto text-right',
                  type === 'Income'
                    ? 'border-primary/20 text-primary focus:ring-primary'
                    : 'border-secondary/20 text-secondary focus:ring-secondary'
                )}
                placeholder="0.00"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="category" className="block text-sm font-semibold text-muted-foreground">
              Category
            </Label>
             <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={type === 'Expense' ? "General Expense" : "General Income"}>One-Time Transaction</SelectItem>
                     {discretionaryExpenses && discretionaryExpenses.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Discretionary</SelectLabel>
                            {discretionaryExpenses.map(item => <SelectItem key={item.id} value={item.category}>{item.category}</SelectItem>)}
                        </SelectGroup>
                    )}
                     {requiredExpenses && requiredExpenses.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Required</SelectLabel>
                            {requiredExpenses.map(item => <SelectItem key={item.id} value={item.category}>{item.category}</SelectItem>)}
                        </SelectGroup>
                    )}
                    {savingsGoals && savingsGoals.length > 0 && (
                         <SelectGroup>
                            <SelectLabel>Savings</SelectLabel>
                            {savingsGoals.map(item => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}
                        </SelectGroup>
                    )}
                    {loans && loans.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Loans</SelectLabel>
                            {loans.map(item => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}
                        </SelectGroup>
                    )}
                </SelectContent>
             </Select>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="description"
              className="block text-sm font-semibold text-muted-foreground"
            >
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

        <footer className="absolute bottom-0 left-0 w-full bg-card/80 backdrop-blur-lg border-t p-5 pb-8 flex items-center">
          <Button
            onClick={handleUpdateTransaction}
            className="w-full py-3 px-8 h-12 font-semibold rounded-xl text-base shadow-md"
          >
            Update Transaction
          </Button>
        </footer>
      </div>
    </div>
  );
}
