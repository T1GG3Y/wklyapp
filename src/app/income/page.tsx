'use client';

import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Briefcase,
  Plus,
  Trash2,
  Edit,
  CalendarIcon,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { FREQUENCY_OPTIONS, PAGE_HELP, type Frequency } from '@/lib/constants';
import { formatCurrency, formatAmountInput, parseFormattedAmount, getWeeklyAmount } from '@/lib/format';
import { BottomNav } from '@/components/BottomNav';

interface IncomeSource extends DocumentData {
  id: string;
  name: string;
  description?: string;
  amount: number;
  frequency: Frequency;
  dueDate?: string;
}

export default function IncomePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sourceToEdit, setSourceToEdit] = useState<IncomeSource | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    description: '',
    amount: '',
    frequency: 'Monthly' as Frequency,
    dueDate: '',
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
        description: sourceToEdit.description || '',
        amount: formatAmountInput(sourceToEdit.amount.toString()),
        frequency: sourceToEdit.frequency,
        dueDate: sourceToEdit.dueDate || '',
      });
    } else {
      setFormState({ name: '', description: '', amount: '', frequency: 'Monthly', dueDate: '' });
    }
  }, [sourceToEdit]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setFormState({ ...formState, amount: formatted });
  };

  const handleSaveSource = async () => {
    if (!firestore || !user) return;

    const amount = parseFormattedAmount(formState.amount);
    if (!formState.name || amount <= 0) {
      alert('Please enter a valid name and amount.');
      return;
    }

    const sourceData: Record<string, unknown> = {
      userProfileId: user.uid,
      name: formState.name,
      description: formState.description || '',
      amount: amount,
      frequency: formState.frequency,
    };

    if (formState.dueDate) {
      sourceData.dueDate = formState.dueDate;
    }

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
    setFormState({ name: '', description: '', amount: '', frequency: 'Monthly', dueDate: '' });
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
      if (sourceToEdit?.id === sourceId) {
        setIsDialogOpen(false);
        setSourceToEdit(null);
      }
    } catch (error) {
      console.error('Error deleting income source:', error);
    }
  };

  const weeklyTotal = useMemo(() => {
    if (!incomeSources) return 0;
    return incomeSources.reduce((total, source) => {
      return total + getWeeklyAmount(source.amount, source.frequency);
    }, 0);
  }, [incomeSources]);

  const dueDateValue = formState.dueDate ? parseISO(formState.dueDate) : undefined;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background">
      <PageHeader
        title="MY INCOME"
        helpTitle="My Income"
        helpContent={PAGE_HELP.income}
        subheader="For Setup select 'Add New Income' below and start adding each Income Source. To learn how to deal with inconsistent income go to FAQ under My Profile."
        rightContent={<HamburgerMenu />}
      />

      <main className="flex-1 flex flex-col gap-6 p-4 pb-48">
        {/* Add New Income Button */}
        <Button
          className="w-full h-12 text-base font-bold tracking-wide"
          size="lg"
          onClick={handleOpenAddDialog}
        >
          <Plus className="mr-2 h-5 w-5" />
          Add New Income
        </Button>

        {/* My Weekly Income Total */}
        <section>
          <div className="flex flex-col gap-3 rounded-2xl p-5 bg-card shadow-sm border">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-primary h-5 w-5" />
              <p className="text-muted-foreground text-sm font-medium">
                My Weekly Income Total
              </p>
            </div>
            <p className="text-foreground text-3xl font-extrabold tabular-nums">
              {formatCurrency(weeklyTotal)}
            </p>
          </div>
        </section>

        {/* MY INCOME SOURCES */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">
              MY INCOME SOURCES
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
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary font-semibold tabular-nums">
                      {formatCurrency(source.amount)}
                    </span>
                    <span className="text-muted-foreground">
                      {source.frequency}
                    </span>
                  </div>
                </div>
                <button
                  className="text-muted-foreground hover:text-primary -mr-2 p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditDialog(source);
                  }}
                >
                  <Edit className="size-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No income sources added yet.
            </p>
          )}
        </section>
      </main>

      {/* Add/Edit Dialog - Edit Box My Income */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Box - My Income</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
              <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Input
                id="description"
                placeholder="e.g. Full-time job"
                value={formState.description}
                onChange={(e) =>
                  setFormState({ ...formState, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={formState.amount}
                  onChange={handleAmountChange}
                  className="pl-8"
                  inputMode="decimal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formState.frequency}
                onValueChange={(value: Frequency) =>
                  setFormState({ ...formState, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formState.dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.dueDate
                      ? format(parseISO(formState.dueDate), 'PPP')
                      : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={dueDateValue}
                    onSelect={(date) =>
                      setFormState({
                        ...formState,
                        dueDate: date ? format(date, 'yyyy-MM-dd') : '',
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={handleSaveSource}>
              {sourceToEdit ? 'Update Item' : 'Add'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              {sourceToEdit && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteSource(sourceToEdit.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Continue Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none w-full">
        <Button
          asChild
          className="pointer-events-auto w-full h-12 text-lg font-bold shadow-lg"
          size="lg"
        >
          <Link href="/essential-expenses">
            Continue to Essential Expenses
          </Link>
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
