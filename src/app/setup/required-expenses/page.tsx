'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  TrendingUp,
  Home,
  Utensils,
  Calendar,
  Droplet,
  Trash2,
  Landmark,
  Shield,
  Lightbulb,
  Phone,
  Recycle,
  Wrench,
  FileText,
  Briefcase,
  type LucideIcon,
  Car,
  Heart,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  type DocumentData,
} from 'firebase/firestore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

interface RequiredExpense extends DocumentData {
  id: string;
  category: string;
  amount: number;
  frequency: 'Weekly' | 'Monthly' | 'Yearly';
  dueDate?: string;
}

const expenseCategories: { name: string; icon: LucideIcon }[] = [
  { name: 'Groceries', icon: Utensils },
  { name: 'Rent/Mortgage', icon: Home },
  { name: 'Insurance', icon: Shield },
  { name: 'Taxes', icon: Landmark },
  { name: 'Natural Gas', icon: Droplet },
  { name: 'Electrical', icon: Lightbulb },
  { name: 'Water', icon: Droplet },
  { name: 'Garbage', icon: Recycle },
  { name: 'Phone', icon: Phone },
  { name: 'Gas/Parking/Tolls', icon: Car },
  { name: 'Auto Maintenance', icon: Wrench },
  { name: 'Auto Registration', icon: FileText },
  { name: 'Medical', icon: Heart },
  { name: 'Dental', icon: Briefcase },
];

const categoryIconMap = new Map(expenseCategories.map((c) => [c.name, c.icon]));

export default function RequiredExpensesScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState<{
    category: string;
    amount: string;
    frequency: 'Weekly' | 'Monthly' | 'Yearly';
    dueDate?: Date;
  }>({
    category: 'Groceries',
    amount: '',
    frequency: 'Monthly',
    dueDate: undefined,
  });

  const requiredExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/requiredExpenses` : null;
  }, [user]);

  const { data: expenses, loading } = useCollection<RequiredExpense>(
    requiredExpensesPath
  );

  const handleOpenAddDialog = (category: string) => {
    setNewExpense({
      category: category,
      amount: '',
      frequency: 'Monthly',
      dueDate: undefined,
    });
    setIsAdding(true);
  };

  const handleAddExpense = async () => {
    if (!firestore || !user) return;
    const requiredExpensesCollection = collection(
      firestore,
      `users/${user.uid}/requiredExpenses`
    );
    const expenseAmount = parseFloat(newExpense.amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const expenseData: Omit<RequiredExpense, 'id'> = {
      userProfileId: user.uid,
      category: newExpense.category,
      amount: expenseAmount,
      frequency: newExpense.frequency,
      ...(newExpense.dueDate && {
        dueDate: format(newExpense.dueDate, 'yyyy-MM-dd'),
      }),
    };

    try {
      await addDoc(requiredExpensesCollection, expenseData);
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding required expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(
        doc(firestore, `users/${user.uid}/requiredExpenses`, expenseId)
      );
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const weeklyCost = useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((total, expense) => {
      switch (expense.frequency) {
        case 'Monthly':
          return total + expense.amount / 4.33;
        case 'Yearly':
          return total + expense.amount / 52;
        case 'Weekly':
          return total + expense.amount;
        default:
          return total;
      }
    }, 0);
  }, [expenses]);

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen overflow-hidden max-w-md mx-auto shadow-2xl">
      <header className="shrink-0 z-10">
        <div className="flex items-center p-4 pb-2 justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/setup/income">
              <ArrowLeft />
            </Link>
          </Button>
          <h2 className="text-foreground text-lg font-bold leading-tight flex-1 text-center pr-12">
            Required Expenses
          </h2>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-48 relative">
        <div className="px-4 py-2 sticky top-0 z-20 bg-background/95 backdrop-blur-md">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-card shadow-lg border relative overflow-hidden group">
            <div className="relative z-10 flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                  Weekly Cost Breakdown
                </p>
                <p className="text-foreground text-3xl font-bold leading-tight tracking-tight">
                  ${weeklyCost.toFixed(2)}
                </p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="text-primary" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 pt-6">
          <h2 className="text-foreground tracking-tight text-2xl font-bold leading-tight text-left mb-2">
            Set Your Essential Bills
          </h2>
          <p className="text-muted-foreground text-base font-normal leading-normal mb-6">
            Add non-negotiable costs like rent, groceries, and utilities by
            tapping a category.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4 mb-6">
          {expenseCategories.map(({ name, icon: Icon }) => {
            const isAdded = expenses?.some((e) => e.category === name);
            return (
              <button
                key={name}
                onClick={() => handleOpenAddDialog(name)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 text-center p-4 rounded-xl border-2 transition-all duration-200',
                  isAdded
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card hover:bg-muted border-dashed'
                )}
              >
                <Icon className="size-6" />
                <span className="text-sm font-semibold">{name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 px-4">
          <h3 className="text-muted-foreground font-bold uppercase tracking-wider text-sm">
            Added Expenses
          </h3>
          {loading ? (
            <p>Loading expenses...</p>
          ) : expenses && expenses.length > 0 ? (
            expenses.map((expense) => {
              const Icon = categoryIconMap.get(expense.category) || Droplet;
              return (
                <div
                  key={expense.id}
                  className="bg-card rounded-xl p-4 border shadow-sm relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Icon className="size-5" />
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
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background rounded-lg px-3 py-2 border">
                      <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                        Amount
                      </label>
                      <div className="flex items-center text-foreground">
                        <span className="mr-1 text-muted-foreground">$</span>
                        <span className="font-bold text-lg">
                          {expense.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="relative bg-background rounded-lg px-3 py-2 border">
                      <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                        Info
                      </label>
                      <div className="text-foreground font-bold text-base">
                        {expense.frequency}
                        {expense.dueDate
                          ? ` • Due ${format(new Date(expense.dueDate), 'do')}`
                          : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No required expenses added yet.
            </p>
          )}
        </div>
      </main>

      {/* Add Expense Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {newExpense.category} Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newExpense.frequency}
                  onValueChange={(value: 'Weekly' | 'Monthly' | 'Yearly') =>
                    setNewExpense({ ...newExpense, frequency: value })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal h-12 text-base',
                        !newExpense.dueDate && 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newExpense.dueDate ? (
                        format(newExpense.dueDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarPicker
                      mode="single"
                      selected={newExpense.dueDate}
                      onSelect={(date) =>
                        setNewExpense({ ...newExpense, dueDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
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

      <div className="p-4 bg-background/95 backdrop-blur-md border-t fixed bottom-0 w-full z-30 max-w-md mx-auto left-0 right-0">
        <Button
          asChild
          className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
        >
          <Link href="/setup/loans">Continue</Link>
        </Button>
      </div>
    </div>
  );
}
