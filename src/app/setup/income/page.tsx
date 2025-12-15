'use client';

import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Calendar,
  Briefcase,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
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

interface IncomeSource extends DocumentData {
  id: string;
  name: string;
  amount: number;
  frequency: 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Yearly';
}

export default function IncomeScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sourceToEdit, setSourceToEdit] = useState<IncomeSource | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    amount: '',
    frequency: 'Monthly' as IncomeSource['frequency'],
  });

  const incomeSourcesPath = useMemo(() => {
    return user ? `users/${user.uid}/incomeSources` : null;
  }, [user]);

  const { data: incomeSources, loading } = useCollection<IncomeSource>(
    incomeSourcesPath
  );
  
  useEffect(() => {
    if (sourceToEdit) {
        setFormState({
            name: sourceToEdit.name,
            amount: sourceToEdit.amount.toString(),
            frequency: sourceToEdit.frequency,
        });
    } else {
        setFormState({ name: '', amount: '', frequency: 'Monthly' });
    }
  }, [sourceToEdit]);


  const handleSaveSource = async () => {
    if (!firestore || !user) return;
    
    const amount = parseFloat(formState.amount);
    if (!formState.name || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid name and amount.');
      return;
    }
    
    const sourceData = {
        userProfileId: user.uid,
        name: formState.name,
        amount: amount,
        frequency: formState.frequency,
    };

    try {
        if (sourceToEdit) {
            const sourceDocRef = doc(firestore, `users/${user.uid}/incomeSources`, sourceToEdit.id);
            await updateDoc(sourceDocRef, sourceData);
        } else {
            const incomeSourcesCollection = collection(firestore, `users/${user.uid}/incomeSources`);
            await addDoc(incomeSourcesCollection, sourceData);
        }
      setIsDialogOpen(false);
      setSourceToEdit(null);
    } catch (error) {
      console.error('Error saving income source: ', error);
    }
  };
  
  const handleOpenAddDialog = () => {
    setSourceToEdit(null);
    setFormState({ name: '', amount: '', frequency: 'Monthly' });
    setIsDialogOpen(true);
  };
  
  const handleOpenEditDialog = (source: IncomeSource) => {
    setSourceToEdit(source);
    setIsDialogOpen(true);
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/incomeSources`, sourceId));
    } catch (error) {
      console.error('Error deleting income source:', error);
    }
  };

  const { weeklyTotal, monthlyTotal } = useMemo(() => {
    if (!incomeSources) return { weeklyTotal: 0, monthlyTotal: 0 };

    let monthly = 0;
    let weekly = 0;

    incomeSources.forEach((source) => {
      switch (source.frequency) {
        case 'Weekly':
          weekly += source.amount;
          monthly += source.amount * 4.33;
          break;
        case 'Bi-weekly':
          weekly += source.amount / 2;
          monthly += source.amount * 2.165;
          break;
        case 'Monthly':
          weekly += source.amount / 4.33;
          monthly += source.amount;
          break;
        case 'Yearly':
          weekly += source.amount / 52;
          monthly += source.amount / 12;
          break;
      }
    });

    return { weeklyTotal: weekly, monthlyTotal: monthly };
  }, [incomeSources]);

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl overflow-hidden bg-background">
      <header className="sticky top-0 z-50 flex items-center bg-background/95 backdrop-blur-md p-4 pb-2 justify-between border-b">
        <h2 className="text-foreground text-xl font-bold font-headline leading-tight flex-1">
          Income Setup
        </h2>
      </header>
      <main className="flex-1 flex flex-col gap-6 p-4 pb-48">
        <section>
          <div className="flex flex-col gap-2 mb-4">
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
              Summary
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3 rounded-2xl p-5 bg-card shadow-sm border relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-primary h-5 w-5" />
                <p className="text-muted-foreground text-sm font-medium">
                  Total Weekly
                </p>
              </div>
              <p className="text-foreground text-2xl font-extrabold tabular-nums">
                ${weeklyTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl p-5 bg-card shadow-sm border relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary h-5 w-5" />
                <p className="text-muted-foreground text-sm font-medium">
                  Total Monthly
                </p>
              </div>
              <p className="text-foreground text-2xl font-extrabold tabular-nums">
                ${monthlyTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
              Active Sources
            </p>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : incomeSources && incomeSources.length > 0 ? (
            incomeSources.map((source) => (
              <div
                key={source.id}
                className="group flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm border cursor-pointer"
                onClick={() => handleOpenEditDialog(source)}
              >
                <div className="flex items-center justify-center rounded-xl bg-muted text-foreground shrink-0 size-12 border">
                  <Briefcase />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-foreground text-base font-bold truncate">
                    {source.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">
                      {source.frequency}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-foreground text-base font-bold tabular-nums">
                    ${source.amount.toFixed(2)}
                  </p>
                </div>
                 <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mr-2" onClick={(e) => { e.stopPropagation(); handleDeleteSource(source.id);}}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center">
              No income sources added yet.
            </p>
          )}
        </section>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sourceToEdit ? 'Edit' : 'Add New'} Income Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Source Name</Label>
              <Input
                id="name"
                placeholder="e.g. Salary"
                value={formState.name}
                onChange={(e) =>
                  setFormState({ ...formState, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formState.amount}
                onChange={(e) =>
                  setFormState({ ...formState, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formState.frequency}
                onValueChange={(
                  value: 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Yearly'
                ) => setFormState({ ...formState, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSource}>{sourceToEdit ? 'Update' : 'Add'} Source</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none max-w-md mx-auto flex flex-col gap-4">
        <Button
            className="pointer-events-auto w-full h-12 text-base font-bold tracking-wide shadow-lg shadow-primary/20"
            size="lg"
            onClick={handleOpenAddDialog}
        >
            <Plus className="mr-2 h-5 w-5" />
            Add New Income
        </Button>
        <Button
            asChild
            className="pointer-events-auto w-full h-12 text-lg font-bold shadow-[0_4px_20px_rgba(19,236,91,0.3)]"
            size="lg"
        >
            <Link href="/setup/required-expenses">Continue <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
      </div>

    </div>
  );
}
