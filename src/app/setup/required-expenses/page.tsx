'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  TrendingUp,
  Home,
  Utensils,
  Calendar,
  Droplet,
  PlusCircle,
  Car,
  Heart,
  Trash2,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface RequiredExpense extends DocumentData {
  id: string;
  category: string;
  amount: number;
  frequency: 'Weekly' | 'Monthly' | 'Yearly';
  dueDate?: string;
}

const expenseCategories = [
    { name: 'Housing', icon: Home },
    { name: 'Food', icon: Utensils },
    { name: 'Utilities', icon: Droplet },
    { name: 'Transport', icon: Car },
    { name: 'Health', icon: Heart },
];

export default function RequiredExpensesScreen() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [selectedCategory, setSelectedCategory] = useState('Housing');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [dueDate, setDueDate] = useState<Date>();

  const requiredExpensesPath = useMemo(() => {
    return user ? `users/${user.uid}/requiredExpenses` : null;
  }, [user]);

  const { data: expenses, loading } = useCollection<RequiredExpense>(
    requiredExpensesPath
  );


  const handleAddExpense = async () => {
    if (!firestore || !user) return;
    const requiredExpensesCollection = collection(firestore, `users/${user.uid}/requiredExpenses`);
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const newExpense: Omit<RequiredExpense, 'id'> = {
      userProfileId: user.uid,
      category: selectedCategory,
      amount: expenseAmount,
      frequency,
      ...(dueDate && { dueDate: format(dueDate, 'yyyy-MM-dd') }),
    };

    try {
      await addDoc(requiredExpensesCollection, newExpense);
      // Reset form
      setAmount('');
      setDueDate(undefined);
    } catch (error) {
      console.error('Error adding required expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!firestore || !user) return;
    try {
        await deleteDoc(doc(firestore, `users/${user.uid}/requiredExpenses`, expenseId));
    } catch (error) {
        console.error("Error deleting expense:", error);
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
    <div className="bg-background font-headline min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md h-full min-h-screen bg-background flex flex-col shadow-2xl overflow-hidden relative">
        <header className="flex items-center justify-between p-4 pb-2 z-10 bg-background">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/setup/income">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-foreground text-lg font-bold leading-tight flex-1 text-center pr-12">
            Required Expenses
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto pb-40">
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
          <div className="flex flex-col gap-6 p-4">
            <div className='bg-card border rounded-xl p-4 space-y-4'>
            <div>
              <h2 className="text-foreground text-base font-bold leading-tight px-1 mb-3">
                Category
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {expenseCategories.map(({name, icon: Icon}) => (
                    <Button 
                    key={name}
                    onClick={() => setSelectedCategory(name)}
                    variant={selectedCategory === name ? 'default' : 'outline'}
                    className="shrink-0 pl-3 pr-4" size="lg">
                    <Icon className="mr-2 h-5 w-5" />
                    {name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-foreground text-base font-bold px-1"
                htmlFor="amount"
              >
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                  $
                </span>
                <Input
                  className="w-full rounded-xl bg-input border text-foreground text-2xl font-bold py-4 pl-8 pr-4 h-auto focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
                  id="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-foreground text-base font-bold px-1">
                  Frequency
                </label>
                <Select value={frequency} onValueChange={(value: 'Weekly' | 'Monthly' | 'Yearly') => setFrequency(value)}>
                  <SelectTrigger className="w-full rounded-xl bg-input border text-foreground py-4 h-auto">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-foreground text-base font-bold px-1">
                  Due Date (Optional)
                </label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="flex items-center justify-between w-full rounded-xl bg-input border text-muted-foreground py-4 h-auto hover:bg-accent group">
                            <span className="text-base truncate">{dueDate ? format(dueDate, 'PPP') : 'Select Date'}</span>
                            <Calendar className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <CalendarPicker
                            mode="single"
                            selected={dueDate}
                            onSelect={setDueDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button onClick={handleAddExpense} className="w-full h-12 rounded-xl text-lg font-bold">
              <PlusCircle className="mr-2" /> Add Expense
            </Button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-foreground text-base font-bold">
                  Added Items
                </h2>
              </div>
              {loading ? <p>Loading...</p> : expenses && expenses.length > 0 ? (
                expenses.map(expense => (
                    <div key={expense.id} className="flex items-center gap-4 bg-card p-3 rounded-xl border">
                        <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        {
                            {
                                'Housing': <Home className="text-blue-400 h-5 w-5"/>,
                                'Food': <Utensils className="text-blue-400 h-5 w-5"/>,
                                'Utilities': <Droplet className="text-blue-400 h-5 w-5"/>,
                                'Transport': <Car className="text-blue-400 h-5 w-5"/>,
                                'Health': <Heart className="text-blue-400 h-5 w-5"/>,
                            }[expense.category]
                        }
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-bold truncate">
                            {expense.category}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                           {expense.frequency} {expense.dueDate ? `• Due ${format(new Date(expense.dueDate), 'do')}` : ''}
                        </p>
                        </div>
                        <p className="text-foreground font-bold text-base">${expense.amount.toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="-mr-2" onClick={() => handleDeleteExpense(expense.id)}>
                            <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                    </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No expenses added yet.</p>
              )}
            </div>
          </div>
        </main>
        <div className="p-4 bg-background/95 backdrop-blur-md border-t absolute bottom-0 w-full z-30">
          <Button asChild className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20">
            <Link href="/setup/loans">
               Continue
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
