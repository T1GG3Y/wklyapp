'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Utensils,
  Trash2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore';
import { useMemo, useState } from 'react';
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

interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  amount: number;
  frequency: 'Weekly' | 'Monthly';
}

export default function DiscretionaryExpensesScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState<{
    category: string;
    amount: string;
    frequency: 'Weekly' | 'Monthly';
  }>({
    category: 'Dining Out',
    amount: '',
    frequency: 'Monthly',
  });

  const discretionaryExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/discretionaryExpenses` : '';
  }, [user]);

  const { data: expenses, loading } = useCollection<DiscretionaryExpense>(
    discretionaryExpensesPath
  );


  const handleAddExpense = async () => {
    if (!firestore || !user) return;
    const discretionaryExpensesCollection = collection(firestore, `users/${user.uid}/discretionaryExpenses`);
    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      await addDoc(discretionaryExpensesCollection, {
        userProfileId: user.uid,
        category: newExpense.category,
        amount: amount,
        frequency: newExpense.frequency,
      });
      setIsAdding(false);
      setNewExpense({ category: 'Dining Out', amount: '', frequency: 'Monthly' });
    } catch (error) {
      console.error('Error adding discretionary expense: ', error);
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
    return expenses.reduce((total, expense) => {
      if (expense.frequency === 'Monthly') {
        return total + expense.amount / 4;
      }
      if (expense.frequency === 'Weekly') {
        return total + expense.amount;
      }
      return total;
    }, 0);
  }, [expenses]);

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen overflow-hidden max-w-md mx-auto shadow-2xl">
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
            Add flexible expenses like dining, shopping, or fun.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-4">
          {loading ? (
             <p>Loading expenses...</p>
          ) : expenses && expenses.length > 0 ? (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-card rounded-xl p-4 border shadow-sm relative group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center border border-transparent">
                      <Utensils />
                    </div>
                    <span className="text-foreground font-bold text-lg">
                      {expense.category}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteExpense(expense.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-background rounded-lg px-3 py-2 border">
                    <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                      Amount
                    </label>
                    <div className="flex items-center text-foreground">
                      <span className="mr-1 text-muted-foreground">$</span>
                      <span className="font-bold text-lg">{expense.amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="relative bg-background rounded-lg px-3 py-2 border">
                    <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                      Frequency
                    </label>
                    <div className="text-foreground font-bold text-base">
                      {expense.frequency}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No discretionary expenses added yet.</p>
          )}

          <Button
            variant="outline"
            className="w-full h-12 border-dashed"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </main>

      {/* Add Expense Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Discretionary Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, category: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={newExpense.frequency}
                onValueChange={(value: 'Weekly' | 'Monthly') =>
                  setNewExpense({ ...newExpense, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 w-full bg-card/85 backdrop-blur-xl border-t p-5 z-20 pb-8 shadow-up max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
              Estimated Weekly Spend
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
