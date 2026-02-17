'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useUser } from '@/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  where,
  type DocumentData,
  Timestamp,
} from 'firebase/firestore';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Filter,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
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
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import {
  ESSENTIAL_CATEGORIES,
  DISCRETIONARY_CATEGORIES,
  LOAN_CATEGORIES,
  SAVINGS_CATEGORIES,
  PAGE_SUBHEADERS,
} from '@/lib/constants';
import { formatCurrency, formatAmountInput, parseFormattedAmount } from '@/lib/format';
import { format, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
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

const SELECT_EXPENSE_CATEGORY = 'Select Expense';

// Date filter options
const DATE_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'This Year', value: 'year' },
];

export default function NewTransactionScreen() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Transaction form state
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(SELECT_EXPENSE_CATEGORY);

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

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description?.toLowerCase().includes(query) || false) ||
          t.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Apply date filter
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

      <main className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
        {/* Enter New Transaction Section */}
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-2">Enter New Transaction</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select income or expense followed by the transaction information.
          </p>

          <div className="space-y-4">
            {/* Income/Expense Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
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
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">Amount</Label>
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
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {type === 'Expense' && (
                    <>
                      {/* Essential Expenses */}
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

                      {/* Discretionary Expenses */}
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

                      {/* Loans */}
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

                      {/* Savings Goals */}
                      <SelectGroup>
                        <SelectLabel className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
                          My Planned Savings Goals
                        </SelectLabel>
                        {SAVINGS_CATEGORIES.filter((c) => c.name !== 'Income Balance').map(
                          ({ name }) => (
                            <SelectItem
                              key={`savings-${name}`}
                              value={`Savings: ${name}`}
                              className="pl-6"
                            >
                              {name}
                            </SelectItem>
                          )
                        )}
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
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">
                Description (Optional)
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
        </div>

        {/* Transaction History Section */}
        <div className="bg-card rounded-xl p-4 border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Transaction History</h3>

          {/* Search and Filters */}
          <div className="space-y-3 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters Row */}
            <div className="flex gap-2">
              {/* Category Filter */}
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

              {/* Date Filter */}
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
                        transaction.type === 'Income' ? 'bg-primary/10' : 'bg-secondary/10'
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
                        transaction.type === 'Income' ? 'text-primary' : 'text-secondary'
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

          {/* Results count */}
          {filteredTransactions.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Showing {filteredTransactions.length} transaction
              {filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
