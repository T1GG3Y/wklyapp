'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plane, Car, ArrowRight, Home, Plus, Trash2 } from 'lucide-react';
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

interface SavingsGoal extends DocumentData {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
}

const goalCategories = [
  { name: 'Vacation', icon: Plane },
  { name: 'Car', icon: Car },
  { name: 'House', icon: Home },
];

export default function PlannedSavingsScreen() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [selectedCategory, setSelectedCategory] = useState('Vacation');
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const savingsGoalsPath = useMemo(() => {
    return user ? `users/${user.uid}/savingsGoals` : '';
  }, [user]);

  const { data: goals, loading } = useCollection<SavingsGoal>(
    savingsGoalsPath
  );

  const handleAddGoal = async () => {
    if (!firestore || !user) return;
    const savingsGoalsCollection = collection(firestore, `users/${user.uid}/savingsGoals`);
    const amount = parseFloat(targetAmount);
    if (!goalName || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid goal name and target amount.');
      return;
    }

    try {
      await addDoc(savingsGoalsCollection, {
        userProfileId: user.uid,
        name: goalName,
        category: selectedCategory,
        targetAmount: amount,
        currentAmount: 0, // Initialize current amount to 0
      });
      // Reset form
      setGoalName('');
      setTargetAmount('');
    } catch (error) {
      console.error('Error adding savings goal: ', error);
    }
  };
  
  const handleDeleteGoal = async (goalId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/savingsGoals`, goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-background z-20 shrink-0 border-b">
        <Button variant="ghost" asChild>
          <Link href="/setup/discretionary">Back</Link>
        </Button>
        <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
          Savings Goals
        </h1>
        <Button variant="link" asChild className="text-primary font-bold">
          <Link href="/weekly-summary">Finish</Link>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar">
        
        {/* Goals List */}
        <section className="p-4">
          <h2 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-3">Your Goals</h2>
          <div className="space-y-3">
          {loading ? (
            <p>Loading goals...</p>
          ) : goals && goals.length > 0 ? (
            goals.map((goal) => (
               <div key={goal.id} className="bg-card p-3 rounded-lg border flex items-center gap-3">
                 <div className="size-10 bg-muted rounded-md flex items-center justify-center">
                   {goal.category === 'Vacation' && <Plane className="size-5 text-muted-foreground" />}
                   {goal.category === 'Car' && <Car className="size-5 text-muted-foreground" />}
                   {goal.category === 'House' && <Home className="size-5 text-muted-foreground" />}
                 </div>
                 <div className="flex-1">
                   <p className="font-bold text-foreground">{goal.name}</p>
                   <p className="text-sm text-muted-foreground">${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}</p>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                   <Trash2 className="size-4 text-muted-foreground" />
                 </Button>
               </div>
            ))
            ) : (
                <p className="text-center text-muted-foreground py-4">No savings goals added yet.</p>
            )}
          </div>
        </section>

        <section className="px-4 pt-4 pb-6 border-t mt-4">
          <h2 className="text-2xl font-bold font-headline tracking-tight mb-4 text-foreground">
            Add a New Goal
          </h2>
          <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2 -mx-4">
            {goalCategories.map(({ name, icon: Icon }) => (
              <Button
                key={name}
                onClick={() => setSelectedCategory(name)}
                variant={selectedCategory === name ? 'default' : 'outline'}
                className="group shrink-0 rounded-full pl-3 pr-5"
                size="lg"
              >
                <Icon className="mr-2 h-5 w-5" />
                <span className="text-sm font-medium">{name}</span>
              </Button>
            ))}
          </div>
        </section>
        <section className="px-4 space-y-6">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-sm font-medium ml-1">
              Goal Name
            </Label>
            <Input
              className="w-full bg-card border rounded-xl h-14 px-4 text-base font-medium placeholder:text-muted-foreground/50 focus:border-primary text-foreground"
              type="text"
              placeholder="e.g. Summer Roadtrip"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-sm font-medium ml-1">
              Target Amount
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-2xl font-bold">
                $
              </div>
              <Input
                className="w-full bg-card border rounded-xl h-20 pl-10 pr-4 text-4xl font-bold placeholder:text-muted-foreground/30 focus:border-primary text-foreground"
                inputMode="decimal"
                placeholder="0.00"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleAddGoal}
            className="w-full h-12 rounded-xl text-lg font-bold"
            size="lg"
          >
            <Plus className="mr-2 h-6 w-6" />
            Add Goal
          </Button>
        </section>
      </main>
      <footer className="fixed bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pb-8 pt-6 px-4 z-20 pointer-events-none max-w-md mx-auto left-0 right-0">
        <Button
          asChild
          className="w-full pointer-events-auto h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50"
          size="lg"
        >
          <Link href="/weekly-summary">
            Calculate Summary <ArrowRight className="ml-2 h-6 w-6" />
          </Link>
        </Button>
      </footer>
    </div>
  );
}
