'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  updateDoc,
  writeBatch,
  type DocumentData,
  Timestamp,
} from 'firebase/firestore';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Filter,
  Plus,
  Search,
  Split,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { HelpDialog } from '@/components/HelpDialog';
import {
  ESSENTIAL_CATEGORIES,
  DISCRETIONARY_CATEGORIES,
  LOAN_CATEGORIES,
  SAVINGS_CATEGORIES,
  PAGE_SUBHEADERS,
} from '@/lib/constants';
import { formatCurrency, formatAmountInput, parseFormattedAmount, getWeeklyAmount } from '@/lib/format';
import { calculateAvailable } from '@/lib/budget';
import { format, startOfDay, startOfWeek, subDays, subWeeks, subMonths, subYears, differenceInWeeks, parseISO } from 'date-fns';
import { type Frequency } from '@/lib/constants';
import Link from 'next/link';

interface Transaction extends DocumentData {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  description?: string;
  category: string;
  date: Timestamp;
}

interface RequiredExpense extends DocumentData {
  id: string;
  category: string;
  name?: string;
  description?: string;
  amount?: number;
  frequency?: Frequency;
  dueDate?: string;
}
interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  name?: string;
  description?: string;
  plannedAmount?: number;
  frequency?: Frequency;
  dueDate?: string;
}
interface Loan extends DocumentData {
  id: string;
  name: string;
  category: string;
  description?: string;
  totalBalance?: number;
  paymentAmount?: number;
  paymentFrequency?: Frequency;
  payoffDate?: string;
}
interface SavingsGoal extends DocumentData {
  id: string;
  name: string;
  category: string;
  description?: string;
  currentAmount?: number;
}

interface SplitRow {
  amount: string;
  description: string;
  category: string;
}

const SELECT_EXPENSE_CATEGORY = 'Select Expense';

// Date filter options
const DATE_FILTERS = [
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 4 Weeks', value: '4weeks' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'This Year', value: 'year' },
  { label: 'Last Year', value: 'lastyear' },
  { label: 'All Time', value: 'all' },
];

function CategorySelect({
  value,
  onValueChange,
  requiredExpenses,
  discretionaryExpenses,
  loans,
  savingsGoals,
  hideLoans,
}: {
  value: string;
  onValueChange: (val: string) => void;
  requiredExpenses?: RequiredExpense[] | null;
  discretionaryExpenses?: DiscretionaryExpense[] | null;
  loans?: Loan[] | null;
  savingsGoals?: SavingsGoal[] | null;
  hideLoans?: boolean;
}) {
  // Build display items from user's actual budget entries
  const getDisplayName = (category: string, description?: string) => {
    if (description) return `${category} - ${description}`;
    return category;
  };

  // Deduplicate items by display name
  const essentialItems = useMemo(() => {
    if (!requiredExpenses || requiredExpenses.length === 0) {
      return ESSENTIAL_CATEGORIES.map(({ name }) => ({ value: name, label: name }));
    }
    const seen = new Set<string>();
    const items = requiredExpenses
      .map((e) => {
        const label = getDisplayName(e.category, e.description);
        if (seen.has(label)) return null;
        seen.add(label);
        return { value: label, label };
      })
      .filter(Boolean) as { value: string; label: string }[];
    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [requiredExpenses]);

  const discretionaryItems = useMemo(() => {
    if (!discretionaryExpenses || discretionaryExpenses.length === 0) {
      return DISCRETIONARY_CATEGORIES.map(({ name }) => ({ value: name, label: name }));
    }
    const seen = new Set<string>();
    const items = discretionaryExpenses
      .map((e) => {
        const label = getDisplayName(e.category, e.description);
        if (seen.has(label)) return null;
        seen.add(label);
        return { value: label, label };
      })
      .filter(Boolean) as { value: string; label: string }[];
    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [discretionaryExpenses]);

  const loanItems = useMemo(() => {
    if (!loans || loans.length === 0) {
      return LOAN_CATEGORIES.map(({ name }) => ({ value: `Loan: ${name}`, label: name }));
    }
    const seen = new Set<string>();
    const items = loans
      .map((l) => {
        const label = getDisplayName(l.category, l.description);
        const val = `Loan: ${label}`;
        if (seen.has(val)) return null;
        seen.add(val);
        return { value: val, label };
      })
      .filter(Boolean) as { value: string; label: string }[];
    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [loans]);

  const savingsItems = useMemo(() => {
    if (!savingsGoals || savingsGoals.length === 0) {
      return SAVINGS_CATEGORIES.map(({ name }) => ({ value: `Savings: ${name}`, label: name }));
    }
    const seen = new Set<string>();
    // Include Unassigned Income
    const items: { value: string; label: string }[] = [{
      value: 'Savings: Unassigned Income',
      label: 'Unassigned Income',
    }];
    seen.add('Savings: Unassigned Income');
    savingsGoals.forEach((g) => {
      const label = getDisplayName(g.category, g.description);
      const val = `Savings: ${label}`;
      if (!seen.has(val)) {
        seen.add(val);
        items.push({ value: val, label });
      }
    });
    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [savingsGoals]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 text-base">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-sm font-bold text-foreground pl-2">
            My Essential Expenses
          </SelectLabel>
          {essentialItems.map((item) => (
            <SelectItem key={item.value} value={item.value} className="pl-8 text-sm">
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="text-sm font-bold text-foreground pl-2">
            My Discretionary Expenses
          </SelectLabel>
          {discretionaryItems.map((item) => (
            <SelectItem key={item.value} value={item.value} className="pl-8 text-sm">
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        {!hideLoans && (
          <SelectGroup>
            <SelectLabel className="text-sm font-bold text-foreground pl-2">
              My Loans
            </SelectLabel>
            {loanItems.map((item) => (
              <SelectItem key={item.value} value={item.value} className="pl-8 text-sm">
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        <SelectGroup>
          <SelectLabel className="text-sm font-bold text-foreground pl-2">
            My Savings Goals
          </SelectLabel>
          {savingsItems.map((item) => (
            <SelectItem key={item.value} value={item.value} className="pl-8 text-sm">
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

interface UserProfile extends DocumentData {
  startDayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
}

const dayIndexMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

export default function NewTransactionScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Section collapse state
  const [addTransactionOpen, setAddTransactionOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Reset state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Transaction form state
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(SELECT_EXPENSE_CATEGORY);
  // Every transaction must have a date. Default to today (local yyyy-MM-dd).
  const [expenseDate, setExpenseDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Credit card state
  const [paidWithCreditCard, setPaidWithCreditCard] = useState(false);
  const [selectedCreditCardId, setSelectedCreditCardId] = useState('');

  // Move form state
  const [moveAmount, setMoveAmount] = useState('');
  const [moveFromCategory, setMoveFromCategory] = useState('');
  const [moveToCategory, setMoveToCategory] = useState('');

  // Track which section is active (Expense or Move).
  // expenseDate is always populated (defaults to today), so don't count it as user input.
  const hasExpenseInput = !!(amount || description || (category && category !== SELECT_EXPENSE_CATEGORY));
  const hasMoveInput = !!(moveAmount || moveFromCategory || moveToCategory);

  // Build a real Firestore Timestamp at local noon for a yyyy-MM-dd string,
  // or fall back to "now" if no string given. We never want serverTimestamp()
  // for transactions — every tx must have a concrete date the user can see.
  const toTxTimestamp = (yyyyMmDd?: string): Timestamp => {
    if (yyyyMmDd) {
      const [y, m, d] = yyyyMmDd.split('-').map(Number);
      if (y && m && d) return Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0));
    }
    return Timestamp.fromDate(new Date());
  };

  // Split transaction state
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([
    { amount: '', description: '', category: '' },
    { amount: '', description: '', category: '' },
  ]);

  // Transaction history filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch user's categories
  const requiredExpensesPath = useMemo(
    () => (user ? `users/${user.uid}/requiredExpenses` : null),
    [user]
  );
  const discretionaryExpensesPath = useMemo(
    () => (user ? `users/${user.uid}/discretionaryExpenses` : null),
    [user]
  );
  const loansPath = useMemo(() => (user ? `users/${user.uid}/loans` : null), [user]);
  const savingsGoalsPath = useMemo(
    () => (user ? `users/${user.uid}/savingsGoals` : null),
    [user]
  );
  const transactionsPath = useMemo(
    () => (user ? `users/${user.uid}/transactions` : null),
    [user]
  );

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } =
    useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: loans } = useCollection<Loan>(loansPath);
  const { data: savingsGoals } = useCollection<SavingsGoal>(savingsGoalsPath);
  const { data: transactions } = useCollection<Transaction>(transactionsPath, {
    orderBy: ['date', 'desc'],
    limit: 100,
  });

  // One-time backfill: any transaction missing `date` gets today's date.
  // Runs once per session after user loads. Uses a raw getDocs because the
  // hook above filters by date ordering and will never surface dateless rows.
  const didBackfillRef = useRef(false);
  useEffect(() => {
    if (didBackfillRef.current) return;
    if (!firestore || !user) return;
    didBackfillRef.current = true;
    (async () => {
      try {
        const txCol = collection(firestore, `users/${user.uid}/transactions`);
        const snap = await getDocs(txCol);
        const missing = snap.docs.filter((d) => !d.data().date);
        if (missing.length === 0) return;
        const today = Timestamp.fromDate(new Date());
        // Batch in chunks of 400 to stay under Firestore's 500-write limit
        for (let i = 0; i < missing.length; i += 400) {
          const batch = writeBatch(firestore);
          for (const d of missing.slice(i, i + 400)) {
            batch.update(d.ref, { date: today });
          }
          await batch.commit();
        }
      } catch (err) {
        console.error('Error backfilling transaction dates:', err);
      }
    })();
  }, [firestore, user]);

  // Credit card loans for the "paid with credit card" dropdown
  const creditCardLoans = useMemo(() => {
    return (loans || []).filter(l => l.category === 'Credit Cards');
  }, [loans]);

  // Handle amount change with auto-formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmountInput(e.target.value);
    setAmount(formatted);
  };

  // Receipt amount for split
  const receiptAmount = parseFormattedAmount(amount);

  // Calculate remaining balance for split
  const splitAllocated = useMemo(() => {
    return splitRows.reduce((sum, row) => sum + parseFormattedAmount(row.amount), 0);
  }, [splitRows]);

  const splitRemaining = receiptAmount - splitAllocated;

  // Update split row
  const updateSplitRow = useCallback(
    (index: number, field: keyof SplitRow, value: string) => {
      setSplitRows((prev) => {
        const updated = [...prev];
        if (field === 'amount') {
          updated[index] = { ...updated[index], [field]: formatAmountInput(value) };
        } else {
          updated[index] = { ...updated[index], [field]: value };
        }

        // Auto-populate the last row with the remaining balance
        if (field === 'amount' && index < updated.length - 1) {
          const lastIndex = updated.length - 1;
          const sumExceptLast = updated.reduce(
            (sum, row, i) => sum + (i < lastIndex ? parseFormattedAmount(row.amount) : 0),
            0
          );
          const remaining = receiptAmount - sumExceptLast;
          updated[lastIndex] = {
            ...updated[lastIndex],
            amount: formatAmountInput(Math.max(0, remaining).toFixed(2)),
          };
        }

        return updated;
      });
    },
    [receiptAmount]
  );

  // Add a new split row with remaining balance
  const addSplitRow = () => {
    setSplitRows((prev) => {
      const allocated = prev.reduce((sum, row) => sum + parseFormattedAmount(row.amount), 0);
      const remaining = receiptAmount - allocated;
      return [
        ...prev,
        {
          amount: remaining > 0 ? formatAmountInput(remaining.toFixed(2)) : formatAmountInput('0.00'),
          description: '',
          category: '',
        },
      ];
    });
  };

  // Remove a split row (minimum 2)
  const removeSplitRow = (index: number) => {
    if (splitRows.length <= 2) return;
    setSplitRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Open split dialog
  const handleOpenSplit = () => {
    if (!amount || parseFormattedAmount(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Amount Required',
        description: 'Please enter a receipt amount before splitting.',
      });
      return;
    }
    // Split 1 gets the full amount, Split 2 starts at $0
    const total = parseFormattedAmount(amount);
    setSplitRows([
      { amount: formatAmountInput(total.toFixed(2)), description: '', category: '' },
      { amount: formatAmountInput('0.00'), description: '', category: '' },
    ]);
    setSplitDialogOpen(true);
  };

  // Submit split transaction
  const handleSplitSubmit = async () => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to add a transaction.',
      });
      return;
    }

    // Validate all rows have amount and category
    const validRows = splitRows.filter(
      (row) => parseFormattedAmount(row.amount) > 0 && row.category
    );

    if (validRows.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Split',
        description: 'Each split must have an amount and category. Minimum 2 splits required.',
      });
      return;
    }

    const totalSplit = validRows.reduce((sum, row) => sum + parseFormattedAmount(row.amount), 0);
    if (Math.abs(totalSplit - receiptAmount) > 0.01) {
      toast({
        variant: 'destructive',
        title: 'Amount Mismatch',
        description: `Split amounts ($${totalSplit.toFixed(2)}) must equal the receipt amount ($${receiptAmount.toFixed(2)}).`,
      });
      return;
    }

    try {
      const transactionsCollection = collection(
        firestore,
        `users/${user.uid}/transactions`
      );

      // Create a transaction for each split row, sharing the expense date
      const splitTxDate = toTxTimestamp(expenseDate);
      for (const row of validRows) {
        await addDoc(transactionsCollection, {
          userProfileId: user.uid,
          type,
          amount: parseFormattedAmount(row.amount),
          description: row.description || '',
          category: row.category.replace(/^(Savings|Loan): /, ''),
          date: splitTxDate,
          splitGroup: Date.now().toString(),
        });
      }

      toast({
        title: 'Split Transaction Added',
        description: `${validRows.length} transactions totaling ${formatCurrency(receiptAmount)} recorded.`,
      });

      setSplitDialogOpen(false);
      setAmount('');
      setDescription('');
      setCategory(SELECT_EXPENSE_CATEGORY);
      setSplitRows([
        { amount: '', description: '', category: '' },
        { amount: '', description: '', category: '' },
      ]);
    } catch (error) {
      console.error('Error adding split transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save the split transaction. Please try again.',
      });
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description?.toLowerCase().includes(query) || false) ||
          t.category.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      let endDate: Date | null = null;
      switch (dateFilter) {
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '4weeks':
          startDate = subWeeks(now, 4);
          break;
        case '3months':
          startDate = subMonths(now, 3);
          break;
        case '6months':
          startDate = subMonths(now, 6);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'lastyear':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((t) => {
        // Always include transactions without a date so users can see & fix them.
        if (!t.date) return true;
        const transactionDate = t.date.toDate();
        if (endDate) {
          return transactionDate >= startOfDay(startDate) && transactionDate <= endDate;
        }
        return transactionDate >= startOfDay(startDate);
      });
    }

    return filtered;
  }, [transactions, searchQuery, categoryFilter, dateFilter]);

  // Get unique categories from transactions for filter dropdown
  const uniqueCategories = useMemo(() => {
    if (!transactions) return [];
    const categories = new Set(transactions.map((t) => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  const handleMoveTransaction = async () => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    const moveAmt = parseFormattedAmount(moveAmount);
    if (moveAmt <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount.' });
      return;
    }
    if (!moveFromCategory || !moveToCategory) {
      toast({ variant: 'destructive', title: 'Categories Required', description: 'Please select both From and To categories.' });
      return;
    }
    if (moveFromCategory === moveToCategory) {
      toast({ variant: 'destructive', title: 'Same Category', description: 'From and To categories must be different.' });
      return;
    }

    try {
      const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
      const moveGroup = Date.now().toString();

      // Strip prefixes (Savings: , Loan: ) so categories match budget pages
      const stripPrefix = (cat: string) => cat.replace(/^(Savings|Loan): /, '');
      const fromCat = stripPrefix(moveFromCategory);
      const toCat = stripPrefix(moveToCategory);

      const isFromSavings = moveFromCategory.startsWith('Savings:');
      const isToSavings = moveToCategory.startsWith('Savings:');
      const isToLoan = moveToCategory.startsWith('Loan:');

      // Helper to find matching savings goal by display name
      const findSavingsGoal = (displayName: string) => {
        return (savingsGoals || []).find(g => {
          const dn = g.description ? `${g.category} - ${g.description}` : g.category;
          return dn === displayName;
        });
      };

      // Helper to find matching loan by display name
      const findLoan = (displayName: string) => {
        return (loans || []).find(l => {
          const dn = l.description ? `${l.category} - ${l.description}` : l.category;
          return dn === displayName;
        });
      };

      // For Essential/Discretionary: use transactions to track available
      // For Savings: update currentAmount on the document
      // For Loans: update totalBalance on the document

      if (isFromSavings) {
        // Savings source: decrement currentAmount on the goal doc
        const goal = findSavingsGoal(fromCat);
        if (goal) {
          const goalRef = doc(firestore, `users/${user.uid}/savingsGoals`, goal.id);
          await updateDoc(goalRef, { currentAmount: increment(-moveAmt) });
        } else {
          // Unassigned Income or unmatched savings — use transaction to track
          await addDoc(transactionsCollection, {
            userProfileId: user.uid, type: 'Expense', amount: moveAmt,
            description: `Move to ${toCat}`, category: fromCat,
            date: toTxTimestamp(), moveGroup,
          });
        }
      } else {
        // Essential/Discretionary source: create Expense transaction (reduces available)
        await addDoc(transactionsCollection, {
          userProfileId: user.uid, type: 'Expense', amount: moveAmt,
          description: `Move to ${toCat}`, category: fromCat,
          date: toTxTimestamp(), moveGroup,
        });
      }

      if (isToSavings) {
        // Savings destination: increment currentAmount on the goal doc
        const goal = findSavingsGoal(toCat);
        if (goal) {
          const goalRef = doc(firestore, `users/${user.uid}/savingsGoals`, goal.id);
          await updateDoc(goalRef, { currentAmount: increment(moveAmt) });
        } else {
          // Unassigned Income or unmatched savings — use transaction to track
          await addDoc(transactionsCollection, {
            userProfileId: user.uid, type: 'Income', amount: moveAmt,
            description: `Move from ${fromCat}`, category: toCat,
            date: toTxTimestamp(), moveGroup,
          });
        }
      } else if (isToLoan) {
        // Loan destination: decrease totalBalance (paying down the loan)
        const loan = findLoan(toCat);
        if (loan) {
          const loanRef = doc(firestore, `users/${user.uid}/loans`, loan.id);
          await updateDoc(loanRef, { totalBalance: increment(-moveAmt) });
        }
      } else {
        // Essential/Discretionary destination: create Income transaction (increases available)
        await addDoc(transactionsCollection, {
          userProfileId: user.uid, type: 'Income', amount: moveAmt,
          description: `Move from ${fromCat}`, category: toCat,
          date: toTxTimestamp(), moveGroup,
        });
      }

      toast({ title: 'Move Completed', description: `${formatCurrency(moveAmt)} moved from ${fromCat} to ${toCat}.` });
      setMoveAmount('');
      setMoveFromCategory('');
      setMoveToCategory('');
    } catch (error) {
      console.error('Error moving funds:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not complete the move.' });
    }
  };

  const handleCreateTransaction = async (andNew: boolean = false) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to add a transaction.',
      });
      return;
    }

    const transactionAmount = parseFormattedAmount(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number for the amount.',
      });
      return;
    }

    if (!category || category === SELECT_EXPENSE_CATEGORY) {
      toast({
        variant: 'destructive',
        title: 'Category Required',
        description: 'Please select a category for this transaction.',
      });
      return;
    }

    if (!expenseDate) {
      toast({
        variant: 'destructive',
        title: 'Date Required',
        description: 'Please select a date for this transaction.',
      });
      return;
    }

    try {
      const transactionsCollection = collection(
        firestore,
        `users/${user.uid}/transactions`
      );
      const txDate = toTxTimestamp(expenseDate);

      // Strip "Loan: " and "Savings: " prefixes so categories match budget pages
      const storedCategory = category.replace(/^(Savings|Loan): /, '');

      await addDoc(transactionsCollection, {
        userProfileId: user.uid,
        type: 'Expense',
        amount: transactionAmount,
        description,
        category: storedCategory,
        date: txDate,
        ...(paidWithCreditCard && selectedCreditCardId ? { creditCardLoanId: selectedCreditCardId } : {}),
      });

      // If paid with credit card, increase the card's balance (more debt)
      if (paidWithCreditCard && selectedCreditCardId) {
        const loanRef = doc(firestore, `users/${user.uid}/loans`, selectedCreditCardId);
        await updateDoc(loanRef, { totalBalance: increment(transactionAmount) });
      }

      // If this is a credit card payment (category is a Credit Cards loan), decrease balance
      if (category.startsWith('Loan: Credit Cards')) {
        const strippedCat = category.replace(/^Loan: /, '');
        const matchingLoan = creditCardLoans.find(l => {
          const displayName = l.description ? `${l.category} - ${l.description}` : l.category;
          return displayName === strippedCat;
        });
        if (matchingLoan) {
          const loanRef = doc(firestore, `users/${user.uid}/loans`, matchingLoan.id);
          await updateDoc(loanRef, { totalBalance: increment(-transactionAmount) });
        }
      }

      toast({
        title: 'Transaction Added',
        description: `Expense of ${formatCurrency(transactionAmount)} recorded.`,
      });

      setAmount('');
      setDescription('');
      setCategory(SELECT_EXPENSE_CATEGORY);
      setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
      setPaidWithCreditCard(false);
      setSelectedCreditCardId('');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save the transaction. Please try again.',
      });
    }
  };

  const handleResetBudget = async () => {
    if (!firestore || !user) return;
    setIsResetting(true);

    try {
      const txCollection = collection(firestore, `users/${user.uid}/transactions`);

      // 1. Load all transactions to calculate current available balances
      const txSnapshot = await getDocs(txCollection);
      const allTimeSpent: Record<string, number> = {};
      const earliestByCategory: Record<string, Date> = {};

      txSnapshot.forEach((d) => {
        const data = d.data();
        if (!data.date) return;
        const txDate = data.date.toDate();
        const cat = data.category || '';
        let amt = 0;
        if (data.type === 'Expense') amt = Math.abs(data.amount);
        else if (data.type === 'Income') amt = -Math.abs(data.amount);
        else return;
        allTimeSpent[cat] = (allTimeSpent[cat] || 0) + amt;
        if (!earliestByCategory[cat] || txDate < earliestByCategory[cat]) {
          earliestByCategory[cat] = txDate;
        }
      });

      const startDay = userProfile?.startDayOfWeek || 'Sunday';
      const wsOn = dayIndexMap[startDay];
      const resetGroup = Date.now().toString();

      // 2. Zero out Essential Expenses available
      if (requiredExpenses) {
        for (const expense of requiredExpenses) {
          const displayName = expense.description
            ? `${expense.category} - ${expense.description}`
            : expense.category;
          const weeklyAmount = getWeeklyAmount(expense.amount || 0, expense.frequency || 'Monthly');
          const totalSpent = allTimeSpent[displayName] || 0;
          const catStart = earliestByCategory[displayName] || new Date();
          const available = calculateAvailable(weeklyAmount, totalSpent, catStart, wsOn);

          if (Math.abs(available) > 0.01) {
            // Create transaction to zero out available
            await addDoc(txCollection, {
              userProfileId: user.uid,
              type: available > 0 ? 'Expense' : 'Income',
              amount: Math.abs(available),
              description: 'Budget reset',
              category: displayName,
              date: toTxTimestamp(),
              moveGroup: resetGroup,
              autoGenerated: true,
            });
          }
        }
      }

      // 3. Zero out Discretionary Expenses available
      if (discretionaryExpenses) {
        for (const expense of discretionaryExpenses) {
          const displayName = expense.description
            ? `${expense.category} - ${expense.description}`
            : expense.category;
          const weeklyAmount = getWeeklyAmount(expense.plannedAmount || 0, expense.frequency || 'Weekly');
          const totalSpent = allTimeSpent[displayName] || 0;
          const catStart = earliestByCategory[displayName] || new Date();
          const available = calculateAvailable(weeklyAmount, totalSpent, catStart, wsOn);

          if (Math.abs(available) > 0.01) {
            await addDoc(txCollection, {
              userProfileId: user.uid,
              type: available > 0 ? 'Expense' : 'Income',
              amount: Math.abs(available),
              description: 'Budget reset',
              category: displayName,
              date: toTxTimestamp(),
              moveGroup: resetGroup,
              autoGenerated: true,
            });
          }
        }
      }

      // 4. Reset all Savings Goals currentAmount to 0
      if (savingsGoals) {
        for (const goal of savingsGoals) {
          if (goal.currentAmount && goal.currentAmount > 0) {
            const goalRef = doc(firestore, `users/${user.uid}/savingsGoals`, goal.id);
            await updateDoc(goalRef, { currentAmount: 0 });
          }
        }
      }

      // 5. Re-seed each category with initial available funds based on payment dates
      if (requiredExpenses) {
        for (const expense of requiredExpenses) {
          if (expense.dueDate && expense.amount) {
            const weeklyAmount = getWeeklyAmount(expense.amount, expense.frequency || 'Monthly');
            const dueDate = parseISO(expense.dueDate);
            const weeksUntilDue = Math.max(1, differenceInWeeks(dueDate, new Date()) + 1);
            const budgetWillAccumulate = weeklyAmount * (weeksUntilDue + 1);
            const initialSeed = expense.amount - budgetWillAccumulate;

            if (initialSeed > 0) {
              const displayName = expense.description
                ? `${expense.category} - ${expense.description}`
                : expense.category;
              await addDoc(txCollection, {
                userProfileId: user.uid,
                type: 'Income',
                amount: initialSeed,
                description: `Initial balance seed for ${displayName}`,
                category: displayName,
                date: toTxTimestamp(),
                moveGroup: resetGroup,
                autoGenerated: true,
              });
            }
          }
        }
      }

      if (discretionaryExpenses) {
        for (const expense of discretionaryExpenses) {
          if (expense.dueDate && expense.plannedAmount) {
            const weeklyAmount = getWeeklyAmount(expense.plannedAmount, expense.frequency || 'Weekly');
            const dueDate = parseISO(expense.dueDate);
            const weeksUntilDue = Math.max(1, differenceInWeeks(dueDate, new Date()) + 1);
            const budgetWillAccumulate = weeklyAmount * (weeksUntilDue + 1);
            const initialSeed = expense.plannedAmount - budgetWillAccumulate;

            if (initialSeed > 0) {
              const displayName = expense.description
                ? `${expense.category} - ${expense.description}`
                : expense.category;
              await addDoc(txCollection, {
                userProfileId: user.uid,
                type: 'Income',
                amount: initialSeed,
                description: `Initial balance seed for ${displayName}`,
                category: displayName,
                date: toTxTimestamp(),
                moveGroup: resetGroup,
                autoGenerated: true,
              });
            }
          }
        }
      }

      toast({
        title: 'Budget Reset Complete',
        description: 'All available funds have been reset and re-seeded based on payment dates.',
      });
      setResetDialogOpen(false);
    } catch (error) {
      console.error('Error resetting budget:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not complete the budget reset. Please try again.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col h-screen overflow-y-auto">
      <PageHeader
        title="MY TRANSACTIONS"
        subheader={PAGE_SUBHEADERS.transactions}
        rightContent={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/reports">
                Reports
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <HamburgerMenu />
          </div>
        }
        leftContent={
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/savings-goals">
              <ArrowLeft className="h-4 w-4" />
              Savings
            </Link>
          </Button>
        }
      />

      <main className="flex-1 p-4 pb-8 space-y-4">
        {/* Add New Transaction - Collapsible Section */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <button
            onClick={() => setAddTransactionOpen(!addTransactionOpen)}
            className="w-full flex items-center justify-between p-4"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground text-left">Add New Transaction</h3>
              <p className="text-sm text-muted-foreground text-left">
                Select expense or move followed by the transaction information
              </p>
            </div>
            {addTransactionOpen ? (
              <ChevronUp className="size-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground shrink-0" />
            )}
          </button>

          {addTransactionOpen && (
            <div className="px-4 pb-4 space-y-4">
              {/* Expense Section */}
              <div className={cn("space-y-3 p-3 rounded-xl border", hasMoveInput ? "opacity-40 pointer-events-none" : "")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <h4 className="text-base font-bold text-foreground underline">Expense</h4>
                    <HelpDialog
                      title="Expense"
                      content="Record a purchase or payment. Enter the receipt name, amount, select the budget category it applies to, and optionally set the date. Use Split to divide one receipt across multiple categories."
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenSplit}
                    className="h-8 px-3 text-xs font-semibold gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  >
                    <Split className="size-3.5" />
                    Split
                  </Button>
                </div>

                {/* Receipt Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">Receipt Name</Label>
                  <Input
                    className="h-10"
                    placeholder="e.g., Costco"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={hasMoveInput}
                  />
                </div>

                {/* Amount, Category, Date Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        className="pl-7 h-10"
                        placeholder="0.00"
                        value={amount}
                        onChange={handleAmountChange}
                        inputMode="decimal"
                        disabled={hasMoveInput}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
                    <CategorySelect
                      value={category}
                      onValueChange={setCategory}
                      requiredExpenses={requiredExpenses}
                      discretionaryExpenses={discretionaryExpenses}
                      loans={loans}
                      savingsGoals={savingsGoals}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      className="h-10"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      disabled={hasMoveInput}
                      required
                    />
                  </div>
                </div>

                {/* Paid with Credit Card */}
                {creditCardLoans.length > 0 && !category.startsWith('Loan:') && (
                  <div className="flex items-center gap-3 pt-1">
                    <Checkbox
                      id="credit-card"
                      checked={paidWithCreditCard}
                      onCheckedChange={(checked) => {
                        setPaidWithCreditCard(!!checked);
                        if (!checked) setSelectedCreditCardId('');
                      }}
                      disabled={hasMoveInput}
                    />
                    <Label htmlFor="credit-card" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                      <CreditCard className="size-3.5" />
                      Paid with credit card?
                    </Label>
                    {paidWithCreditCard && (
                      <Select value={selectedCreditCardId} onValueChange={setSelectedCreditCardId}>
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Select card" />
                        </SelectTrigger>
                        <SelectContent>
                          {creditCardLoans.map((loan) => (
                            <SelectItem key={loan.id} value={loan.id} className="text-xs">
                              {loan.name || loan.description || 'Credit Card'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>

              {/* Move Section */}
              <div className={cn("space-y-3 p-3 rounded-xl border", hasExpenseInput ? "opacity-40 pointer-events-none" : "")}>
                <div className="flex items-center gap-1">
                  <h4 className="text-base font-bold text-foreground underline">Move</h4>
                  <HelpDialog
                    title="Move"
                    content="Transfer funds between budget categories. Enter the amount, select which category to move from, and which category to move to. This is commonly used to move funds from Unassigned Income in My Savings to another category."
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        className="pl-7 h-10"
                        placeholder="0.00"
                        value={moveAmount}
                        onChange={(e) => setMoveAmount(formatAmountInput(e.target.value))}
                        inputMode="decimal"
                        disabled={hasExpenseInput}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">From</Label>
                    <CategorySelect
                      value={moveFromCategory}
                      onValueChange={setMoveFromCategory}
                      requiredExpenses={requiredExpenses}
                      discretionaryExpenses={discretionaryExpenses}
                      loans={loans}
                      savingsGoals={savingsGoals}
                      hideLoans
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-muted-foreground">To</Label>
                    <CategorySelect
                      value={moveToCategory}
                      onValueChange={setMoveToCategory}
                      requiredExpenses={requiredExpenses}
                      discretionaryExpenses={discretionaryExpenses}
                      loans={loans}
                      savingsGoals={savingsGoals}
                    />
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <Button
                onClick={() => {
                  if (hasMoveInput) {
                    handleMoveTransaction();
                  } else {
                    handleCreateTransaction(true);
                  }
                }}
                className="w-full py-3 h-12 font-semibold rounded-xl text-base shadow-md"
              >
                Add
              </Button>

              {/* Reset Button */}
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(true)}
                className="w-full h-10 font-semibold rounded-xl text-sm border-destructive/50 text-destructive hover:bg-destructive/10 gap-2"
              >
                <RotateCcw className="size-4" />
                Reset Budget
              </Button>
            </div>
          )}
        </div>

        {/* Transaction History - Collapsible Section */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full flex items-center justify-between p-4"
          >
            <h3 className="text-lg font-bold text-foreground">Transaction History</h3>
            {historyOpen ? (
              <ChevronUp className="size-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground shrink-0" />
            )}
          </button>

          {historyOpen && (
            <div className="px-4 pb-4">
              {/* Search and Filters */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="flex-1">
                      <Filter className="size-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="flex-1">
                      <Calendar className="size-4 mr-2" />
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FILTERS.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transaction List */}
              <div className="space-y-1">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <Link
                      key={transaction.id}
                      href={`/transaction/edit/${transaction.id}`}
                      className="block group"
                    >
                      <div className="flex items-center gap-4 p-3 rounded-lg group-hover:bg-muted transition-colors">
                        <div
                          className={cn(
                            'size-10 rounded-lg flex items-center justify-center',
                            transaction.type === 'Income'
                              ? 'bg-primary/10'
                              : 'bg-secondary/10'
                          )}
                        >
                          {transaction.type === 'Income' ? (
                            <ArrowUpRight className="text-primary" />
                          ) : (
                            <ArrowDownLeft className="text-secondary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {transaction.description || transaction.category}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{transaction.category}</span>
                            <span>-</span>
                            <span>
                              {transaction.date
                                ? format(transaction.date.toDate(), 'MMM d, yyyy')
                                : ''}
                            </span>
                          </div>
                        </div>
                        <p
                          className={cn(
                            'font-bold text-lg tabular-nums',
                            transaction.type === 'Income'
                              ? 'text-primary'
                              : 'text-secondary'
                          )}
                        >
                          {transaction.type === 'Income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery || categoryFilter !== 'all' || dateFilter !== 'all'
                      ? 'No transactions match your filters.'
                      : 'No transactions yet.'}
                  </p>
                )}
              </div>

              {filteredTransactions.length > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Showing {filteredTransactions.length} transaction
                  {filteredTransactions.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

      </main>

      {/* Split Transaction Dialog */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Split Transaction
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center">
              Enter amounts and categories. A new amount row will be generated with the remaining
              balance until all of the receipt amount is accounted for and categorized.
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Receipt Amount Balance */}
            <div className="bg-muted/50 rounded-xl p-4 border">
              <Label className="text-sm font-semibold text-muted-foreground">
                Receipt Amount Balance
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(receiptAmount)}
                </span>
                {splitAllocated > 0 && (
                  <span
                    className={cn(
                      'text-sm font-semibold px-2 py-0.5 rounded-full',
                      Math.abs(splitRemaining) < 0.01
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : splitRemaining < 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    )}
                  >
                    {Math.abs(splitRemaining) < 0.01
                      ? 'Balanced'
                      : splitRemaining > 0
                        ? `${formatCurrency(splitRemaining)} remaining`
                        : `${formatCurrency(Math.abs(splitRemaining))} over`}
                  </span>
                )}
              </div>
            </div>

            {/* Split Rows */}
            <div className="space-y-3">
              {splitRows.map((row, index) => (
                <div
                  key={index}
                  className="bg-muted/30 rounded-xl p-3 border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Split {index + 1}
                    </span>
                    {splitRows.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSplitRow(index)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_1fr] gap-2">
                    {/* Amount */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                          $
                        </span>
                        <Input
                          className="pl-7 h-10 text-sm tabular-nums"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={(e) =>
                            updateSplitRow(index, 'amount', e.target.value)
                          }
                          inputMode="decimal"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <CategorySelect
                        value={row.category}
                        onValueChange={(val) => updateSplitRow(index, 'category', val)}
                        loans={loans}
                        savingsGoals={savingsGoals}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Description (optional)
                    </Label>
                    <Input
                      className="h-10 text-sm"
                      placeholder="e.g., Coffee with friend"
                      value={row.description}
                      onChange={(e) =>
                        updateSplitRow(index, 'description', e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <Button
              variant="outline"
              onClick={addSplitRow}
              className="w-full gap-2 text-sm"
            >
              <Plus className="size-4" />
              Add Another Split
            </Button>

            {/* Submit Button */}
            <Button
              onClick={handleSplitSubmit}
              disabled={Math.abs(splitRemaining) > 0.01}
              className="w-full py-3 h-12 font-semibold rounded-xl text-base shadow-md"
            >
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Budget Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to do this?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              It will Reset all Available Funds in Essential and Discretionary Expenses and Current Balance Saved in My Savings Goals. This should only be used when you are wanting to restart your budgeting from the beginning. It does not delete any of your planned expenses. That you would have to do one at a time if they have changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetBudget}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? 'Resetting...' : 'Reset Budget'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
