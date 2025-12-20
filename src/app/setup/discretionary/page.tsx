'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Utensils,
  Trash2,
  Plus,
  DollarSign,
  Sparkles,
  Shirt,
  Wrench,
  Tv,
  Wifi,
  Coffee,
  Users,
  Plane,
  Dumbbell,
  Gift,
  Dog,
  MoreHorizontal,
  CreditCard,
  ShoppingBasket,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  setDoc,
  type DocumentData,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  plannedAmount: number;
}

const expenseCategories: { name: string, icon: LucideIcon }[] = [
    { name: 'Groceries', icon: ShoppingBasket },
    { name: 'Dining Out', icon: Utensils },
    { name: 'Personal Care', icon: Sparkles },
    { name: 'Clothes', icon: Shirt },
    { name: 'House Maintenance', icon: Wrench },
    { name: 'Cable TV', icon: Tv },
    { name: 'Internet', icon: Wifi },
    { name: 'Date', icon: Coffee },
    { name: 'Family Activities', icon: Users },
    { name: 'Vacation', icon: Plane },
    { name: 'Gym', icon: Dumbbell },
    { name: 'Gifts', icon: Gift },
    { name: 'Pets', icon: Dog },
    { name: 'Subscriptions', icon: CreditCard },
    { name: 'Miscellaneous', icon: MoreHorizontal },
];

const categoryIconMap = new Map(expenseCategories.map(c => [c.name, c.icon]));


export default function DiscretionaryExpensesScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [currentExpense, setCurrentExpense] = useState<{
    category: string;
    plannedAmount: string;
  }>({
    category: 'Dining Out',
    plannedAmount: '',
  });

  const discretionaryExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/discretionaryExpenses` : null;
  }, [user]);

  const { data: expenses, loading } = useCollection<DiscretionaryExpense>(
    discretionaryExpensesPath
  );

  const handleOpenDialog = (category: string) => {
    const existingExpense = expenses?.find(e => e.category === category);
    setCurrentExpense({
      category: category,
      plannedAmount: existingExpense ? existingExpense.plannedAmount.toString() : '',
    });
    setIsDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!firestore || !user) return;
    
    const amount = parseFloat(currentExpense.plannedAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const discretionaryExpensesCollection = collection(firestore, `users/${user.uid}/discretionaryExpenses`);
    const q = query(discretionaryExpensesCollection, where("category", "==", currentExpense.category));
    
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            // Update existing document
            const docId = querySnapshot.docs[0].id;
            const docRef = doc(firestore, `users/${user.uid}/discretionaryExpenses`, docId);
            if (amount > 0) {
                await setDoc(docRef, { plannedAmount: amount }, { merge: true });
            } else {
                await deleteDoc(docRef);
            }
        } else if (amount > 0) {
            // Add new document
            await addDoc(discretionaryExpensesCollection, {
                userProfileId: user.uid,
                category: currentExpense.category,
                plannedAmount: amount,
            });
        }

      setIsDialogOpen(false);
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
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const weeklyTotal = useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((total, expense) => total + expense.plannedAmount, 0);
  }, [expenses]);

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen overflow-hidden">
      <header className="shrink-0 z-10">
        <div className="flex items-center p-4 pb-2 justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/setup/loans">
              <ArrowLeft />
            </Link>
          </Button>
          <h2 className="text-foreground text-lg font-bold leading-tight flex-1 text-center pr-12">
            Discretionary Expenses
          </h2>
        </div>
        <div className="flex w-full flex-row items-center justify-center gap-3 py-3">
          <div className="h-2 w-2 rounded-full bg-border"></div>
          <div className="h-2 w-8 rounded-full bg-primary shadow-[0_0_10px_rgba(19,236,91,0.4)] transition-all duration-300"></div>
          <div className="h-2 w-2 rounded-full bg-border"></div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-48 relative">
        <div className="px-4 pt-2">
          <h2 className="text-foreground tracking-tight text-[28px] font-bold leading-tight text-left mb-2">
            Set Your Lifestyle Budget
          </h2>
          <p className="text-muted-foreground text-base font-normal leading-normal mb-6">
            Plan your weekly flexible spending. Tap a category to set a budget. Any unspent funds will be available next week.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4 mb-6">
            {expenseCategories.map(({name, icon: Icon}) => {
                const expense = expenses?.find(e => e.category === name);
                return (
                    <button
                        key={name}
                        onClick={() => handleOpenDialog(name)}
                        className={cn("flex flex-col items-center justify-center gap-2 text-center p-4 rounded-xl border-2 transition-all duration-200", 
                            expense 
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-card hover:bg-muted border-dashed'
                        )}
                    >
                        <Icon className="size-6" />
                        <span className="text-sm font-semibold">{name}</span>
                        {expense && (
                             <span className="text-xs font-bold">${expense.plannedAmount.toFixed(2)}/wk</span>
                        )}
                    </button>
                )
            })}
        </div>
      </main>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planned {currentExpense.category} Spending</DialogTitle>
            <DialogDescription>
                How much do you plan to spend per week on {currentExpense.category.toLowerCase()}? You can change this later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Planned Weekly Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={currentExpense.plannedAmount}
                    onChange={(e) =>
                        setCurrentExpense({ ...currentExpense, plannedAmount: e.target.value })
                    }
                    className="pl-10 h-12 text-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExpense}>Set Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 w-full bg-card/85 backdrop-blur-xl border-t p-5 z-20 pb-8 shadow-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
              Total Planned Weekly Spend
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-primary tracking-tight">
                ${weeklyTotal.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                / week
              </span>
            </div>
          </div>
        </div>
        <Button
          asChild
          className="w-full text-lg py-4 h-auto shadow-[0_4px_20px_rgba(19,236,91,0.3)]"
          size="lg"
        >
          <Link href="/setup/savings">
            Save & Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
