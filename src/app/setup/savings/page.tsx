'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plane,
  Car,
  ArrowRight,
  Home,
  Plus,
  Trash2,
  GraduationCap,
  PiggyBank,
  type LucideIcon,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SavingsGoal extends DocumentData {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
}

const goalCategories: { name: string; icon: LucideIcon }[] = [
  { name: 'Vacation', icon: Plane },
  { name: 'Car', icon: Car },
  { name: 'House down payment', icon: Home },
  { name: 'Education', icon: GraduationCap },
  { name: 'Emergency/back-up', icon: PiggyBank },
];

const categoryIconMap = new Map(goalCategories.map(c => [c.name, c.icon]));

export default function PlannedSavingsScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    category: 'Vacation',
    targetAmount: '',
  });

  const savingsGoalsPath = useMemo(() => {
    return user ? `users/${user.uid}/savingsGoals` : null;
  }, [user]);

  const { data: goals, loading } = useCollection<SavingsGoal>(savingsGoalsPath);

  const totalTarget = useMemo(() => {
    return goals?.reduce((sum, goal) => sum + goal.targetAmount, 0) || 0;
  }, [goals]);

  const handleOpenAddDialog = (category: string) => {
    setNewGoal({
      name: '',
      category: category,
      targetAmount: '',
    });
    setIsAdding(true);
  };

  const handleAddGoal = async () => {
    if (!firestore || !user) return;
    const savingsGoalsCollection = collection(
      firestore,
      `users/${user.uid}/savingsGoals`
    );
    const amount = parseFloat(newGoal.targetAmount);
    if (!newGoal.name || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid goal name and target amount.');
      return;
    }

    try {
      await addDoc(savingsGoalsCollection, {
        userProfileId: user.uid,
        name: newGoal.name,
        category: newGoal.category,
        targetAmount: amount,
        currentAmount: 0,
      });
      setIsAdding(false);
      setNewGoal({ name: '', category: 'Vacation', targetAmount: '' });
    } catch (error) {
      console.error('Error adding savings goal: ', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/savingsGoals`, goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  return (
    <div className="bg-background font-headline flex flex-col min-h-screen overflow-hidden">
      <header className="shrink-0 z-10">
        <div className="flex items-center p-4 pb-2 justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/setup/discretionary">
              <ArrowLeft />
            </Link>
          </Button>
          <h2 className="text-foreground text-lg font-bold leading-tight flex-1 text-center pr-12">
            Savings Goals
          </h2>
        </div>
        <div className="flex w-full flex-row items-center justify-center gap-3 py-3">
          <div className="h-2 w-2 rounded-full bg-border"></div>
          <div className="h-2 w-2 rounded-full bg-border"></div>
          <div className="h-2 w-8 rounded-full bg-primary shadow-[0_0_10px_rgba(19,236,91,0.4)] transition-all duration-300"></div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-48 relative">
        <div className="px-4 pt-2">
          <h2 className="text-foreground tracking-tight text-[28px] font-bold leading-tight text-left mb-2">
            What are you saving for?
          </h2>
          <p className="text-muted-foreground text-base font-normal leading-normal mb-6">
            Set your financial goals. Tap a category to add a new goal.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4 mb-6">
          {goalCategories.map(({ name, icon: Icon }) => {
            const isAdded = goals?.some((g) => g.category === name);
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
            Your Goals
          </h3>
          {loading ? (
            <p>Loading goals...</p>
          ) : goals && goals.length > 0 ? (
            goals.map((goal) => {
              const Icon = categoryIconMap.get(goal.category) || PiggyBank;
              const progress =
                goal.targetAmount > 0
                  ? (goal.currentAmount / goal.targetAmount) * 100
                  : 0;
              return (
                <div
                  key={goal.id}
                  className="bg-card rounded-xl p-4 border shadow-sm relative group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <span className="text-foreground font-bold text-lg">
                          {goal.name}
                        </span>
                         <p className="text-sm text-muted-foreground">{goal.category}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive -mt-1 -mr-2"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium text-primary">
                        ${goal.currentAmount.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Target: ${goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No savings goals added yet.
            </p>
          )}
        </div>
      </main>

      {/* Add Goal Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New {newGoal.category} Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                placeholder="e.g. Summer Trip to Italy"
                value={newGoal.name}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, name: e.target.value })
                }
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount</Label>
               <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                    id="targetAmount"
                    type="number"
                    placeholder="0.00"
                    value={newGoal.targetAmount}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetAmount: e.target.value })
                    }
                    className="pl-10 h-12 text-lg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGoal}>Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 w-full bg-card/85 backdrop-blur-xl border-t p-5 z-20 pb-8 shadow-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
              Total Savings Target
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-primary tracking-tight">
                ${totalTarget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
          </div>
        </div>
        <Button
          asChild
          className="w-full text-lg py-4 h-auto shadow-[0_4px_20px_rgba(19,236,91,0.3)]"
          size="lg"
        >
          <Link href="/weekly-summary">
            Finish Setup <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
