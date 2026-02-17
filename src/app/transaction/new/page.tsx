'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useUser } from '@/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  type DocumentData,
  Timestamp,
} from 'firebase/firestore';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Search,
  Split,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { BottomNav } from '@/components/BottomNav';
import {
  ESSENTIAL_CATEGORIES,
  DISCRETIONARY_CATEGORIES,
  LOAN_CATEGORIES,
  SAVINGS_CATEGORIES,
  PAGE_SUBHEADERS,
} from '@/lib/constants';
import { formatCurrency, formatAmountInput, parseFormattedAmount } from '@/lib/format';
import { format, startOfDay, subDays, subMonths } from 'date-fns';
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
}
interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  name?: string;
}
interface Loan extends DocumentData {
  id: string;
  name: string;
  category: string;
}
interface SavingsGoal extends DocumentData {
  id: string;
  name: string;
  category: string;
}

interface SplitRow {
  amount: string;
  description: string;
  category: string;
}

const SELECT_EXPENSE_CATEGORY = 'Select Expense';

// Date filter options
const DATE_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'This Year', value: 'year' },
];

function CategorySelect({
  value,
  onValueChange,
  type,
  loans,
  savingsGoals,
}: {
  value: string;
  onValueChange: (val: string) => void;
  type: 'Income' | 'Expense';
  loans?: Loan[] | null;
  savingsGoals?: SavingsGoal[] | null;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 text-base">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {type === 'Expense' && (
          <>
            <SelectGroup>
              <SelectLabel className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
                My Essential Expenses
              </SelectLabel>
              {ESSENTIAL_CATEGORIES.map(({ name }) => (
                <SelectItem key={name} value={name} className="pl-6">
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
                My Discretionary Expenses
              </SelectLabel>
              {DISCRETIONARY_CATEGORIES.map(({ name }) => (
                <SelectItem key={name} value={name} className="pl-6">
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
                My Loans
              </SelectLabel>
              {LOAN_CATEGORIES.map(({ name }) => (
                <SelectItem key={`loan-${name}`} value={`Loan: ${name}`} className="pl-6">
                  {name}
                </SelectItem>
              ))}
              {loans?.map((item) => (
                <SelectItem key={item.id} value={item.name} className="pl-8">
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
                My Planned Savings Goals
              </SelectLabel>
              {SAVINGS_CATEGORIES.filter((c) => c.name !== 'Income Balance').map(({ name }) => (
                <SelectItem key={`savings-${name}`} value={`Savings: ${name}`} className="pl-6">
                  {name}
                </SelectItem>
              ))}
              {savingsGoals
                ?.filter((g) => g.category !== 'Income Balance')
                .map((item) => (
                  <SelectItem key={item.id} value={item.name} className="pl-8">
                    {item.name}
                  </SelectItem>
                ))}
            </SelectGroup>
          </>
        )}
        {type === 'Income' && (
          <SelectGroup>
            <SelectLabel className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
              Income Sources
            </SelectLabel>
            <SelectItem value="Salary">Salary</SelectItem>
            <SelectItem value="Freelance">Freelance</SelectItem>
            <SelectItem value="Investment">Investment</SelectItem>
            <SelectItem value="Gift">Gift</SelectItem>
            <SelectItem value="Refund">Refund</SelectItem>
            <SelectItem value="Other Income">Other Income</SelectItem>
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

export default function NewTransactionScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Section collapse state
  const [addTransactionOpen, setAddTransactionOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Transaction form state
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(SELECT_EXPENSE_CATEGORY);

  // Split transaction state
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([
    { amount: '', description: '', category: '' },
    { amount: '', description: '', category: '' },
  ]);

  // Transaction history filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('30days');

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

  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } =
    useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: loans } = useCollection<Loan>(loansPath);
  const { data: savingsGoals } = useCollection<SavingsGoal>(savingsGoalsPath);
  const { data: transactions } = useCollection<Transaction>(transactionsPath, {
    orderBy: ['date', 'desc'],
    limit: 100,
  });

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

        // Auto-populate the next empty row's amount with remaining balance
        if (field === 'amount') {
          const totalAllocated = updated.reduce(
            (sum, row, i) => sum + (i <= index ? parseFormattedAmount(row.amount) : 0),
            0
          );
          const remaining = receiptAmount - totalAllocated;

          // Find the next row after current that has no amount
          for (let i = index + 1; i < updated.length; i++) {
            if (!updated[i].amount || parseFormattedAmount(updated[i].amount) === 0) {
              if (remaining > 0) {
                updated[i] = {
                  ...updated[i],
                  amount: formatAmountInput(remaining.toFixed(2)),
                };
              }
              break;
            }
          }
        }

        return updated;
      });
    },
    [receiptAmount]
  );

  // Add a new split row
  const addSplitRow = () => {
    setSplitRows((prev) => [...prev, { amount: '', description: '', category: '' }]);
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
    // Reset split rows with remaining balance in the first row
    const total = parseFormattedAmount(amount);
    setSplitRows([
      { amount: '', description: '', category: '' },
      { amount: formatAmountInput(total.toFixed(2)), description: '', category: '' },
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

      // Create a transaction for each split row
      for (const row of validRows) {
        await addDoc(transactionsCollection, {
          userProfileId: user.uid,
          type,
          amount: parseFormattedAmount(row.amount),
          description: row.description || '',
          category: row.category,
          date: serverTimestamp(),
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

      switch (dateFilter) {
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '30days':
          startDate = subDays(now, 30);
          break;
        case '3months':
          startDate = subMonths(now, 3);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((t) => {
        if (!t.date) return false;
        const transactionDate = t.date.toDate();
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

    try {
      const transactionsCollection = collection(
        firestore,
        `users/${user.uid}/transactions`
      );
      await addDoc(transactionsCollection, {
        userProfileId: user.uid,
        type,
        amount: transactionAmount,
        description,
        category,
        date: serverTimestamp(),
      });

      toast({
        title: 'Transaction Added',
        description: `${type} of ${formatCurrency(transactionAmount)} recorded.`,
      });

      if (andNew) {
        setAmount('');
        setDescription('');
        setCategory(SELECT_EXPENSE_CATEGORY);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save the transaction. Please try again.',
      });
    }
  };

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col">
      <PageHeader
        title="MY TRANSACTIONS"
        subheader={PAGE_SUBHEADERS.transactions}
        rightContent={<HamburgerMenu />}
      />

      <main className="flex-1 overflow-y-auto p-4 pb-40 space-y-4">
        {/* Add New Transaction - Collapsible Section */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <button
            onClick={() => setAddTransactionOpen(!addTransactionOpen)}
            className="w-full flex items-center justify-between p-4"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground text-left">Add New Transaction</h3>
              <p className="text-sm text-muted-foreground text-left">
                Select expense or income followed by the transaction information
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
              {/* Income/Expense Toggle */}
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  onClick={() => {
                    setType('Expense');
                    setCategory(SELECT_EXPENSE_CATEGORY);
                  }}
                  variant={type === 'Expense' ? 'default' : 'ghost'}
                  className={cn(
                    'flex-1 rounded-md h-auto py-2 text-sm font-medium',
                    type === 'Expense' && 'bg-secondary text-secondary-foreground shadow-sm'
                  )}
                >
                  Expense
                </Button>
                <Button
                  onClick={() => {
                    setType('Income');
                    setCategory('');
                  }}
                  variant={type === 'Income' ? 'default' : 'ghost'}
                  className={cn(
                    'flex-1 rounded-md h-auto py-2 text-sm font-medium',
                    type === 'Income' && 'bg-primary text-primary-foreground shadow-sm'
                  )}
                >
                  Income
                </Button>
              </div>

              {/* Receipt Amount with Split Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Receipt Amount
                  </Label>
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
                <div className="relative">
                  <span
                    className={cn(
                      'absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold',
                      type === 'Income' ? 'text-primary' : 'text-secondary'
                    )}
                  >
                    $
                  </span>
                  <Input
                    className={cn(
                      'pl-10 pr-4 py-4 rounded-lg bg-background border-2 text-2xl font-bold h-auto text-left tabular-nums',
                      type === 'Income'
                        ? 'border-primary/20 text-primary focus:ring-primary'
                        : 'border-secondary/20 text-secondary focus:ring-secondary'
                    )}
                    placeholder="0.00"
                    value={amount}
                    onChange={handleAmountChange}
                    inputMode="decimal"
                  />
                </div>
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Category</Label>
                <CategorySelect
                  value={category}
                  onValueChange={setCategory}
                  type={type}
                  loans={loans}
                  savingsGoals={savingsGoals}
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">
                  Description (optional)
                </Label>
                <Input
                  className="px-4 py-3 rounded-lg bg-background border text-base h-auto"
                  placeholder="e.g., Coffee with a friend"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleCreateTransaction(true)}
                  variant="outline"
                  className="flex-1 py-3 h-12 font-semibold rounded-xl text-base"
                >
                  Create + New
                </Button>
                <Button
                  onClick={() => handleCreateTransaction(false)}
                  className="flex-1 py-3 h-12 font-semibold rounded-xl text-base shadow-md"
                >
                  Create
                </Button>
              </div>
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

        {/* Footer Navigation */}
        <div className="flex gap-3 pt-2">
          <Link href="/dashboard" className="flex-1">
            <Button
              variant="outline"
              className="w-full py-3 h-12 font-semibold rounded-xl text-base gap-2"
            >
              <ArrowLeft className="size-4" />
              <span>
                <span className="font-bold">Back</span> to Home
              </span>
            </Button>
          </Link>
          <Link href="/profile" className="flex-1">
            <Button className="w-full py-3 h-12 font-semibold rounded-xl text-base gap-2">
              <span>
                <span className="font-bold">Continue</span> to My Profile
              </span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>
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
                        type={type}
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

      <BottomNav />
    </div>
  );
}
