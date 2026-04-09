'use client';

import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection } from '@/firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  addDoc,
  doc,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Landmark,
  PiggyBank,
  RefreshCw,
  Trash2,
  Wallet,
  Link2,
  Check,
  X,
  AlertTriangle,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { formatCurrency } from '@/lib/format';
import { mapPlaidCategory } from '@/lib/plaid-category-map';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface PlaidAccount {
  id: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  balance: number | null;
  availableBalance: number | null;
  mask: string | null;
  institution?: string;
}

interface PlaidTransaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  subcategory: string;
  merchantName: string;
  accountId: string;
  pending: boolean;
}

interface ConnectedItem {
  id: string;
  institutionName: string;
  connectedAt: string;
}

interface WklyTransaction extends DocumentData {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  date: Timestamp;
  plaidTransactionId?: string;
}

interface ImportRow {
  plaidTx: PlaidTransaction;
  suggestedCategory: string;
  selectedCategory: string;
  isDuplicate: boolean;
  isImported: boolean; // already imported (has plaidTransactionId match)
  status: 'pending' | 'imported' | 'skipped';
}

interface BudgetItem extends DocumentData {
  id: string;
  category: string;
  description?: string;
}

const accountTypeIcons: Record<string, typeof Wallet> = {
  depository: Landmark,
  credit: CreditCard,
  loan: Building2,
  investment: PiggyBank,
};

export default function ConnectedAccountsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectedItems, setConnectedItems] = useState<ConnectedItem[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [bankTransactions, setBankTransactions] = useState<PlaidTransaction[]>([]);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [batchImporting, setBatchImporting] = useState(false);
  const [disconnectItem, setDisconnectItem] = useState<ConnectedItem | null>(null);
  const [showImportSection, setShowImportSection] = useState(false);

  // Load user's existing WKLY transactions for duplicate detection
  const transactionsPath = useMemo(() => (user ? `users/${user.uid}/transactions` : null), [user]);
  const { data: wklyTransactions } = useCollection<WklyTransaction>(transactionsPath);

  // Load user's budget categories for the category dropdown
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);
  const { data: requiredExpenses } = useCollection<BudgetItem>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<BudgetItem>(discretionaryExpensesPath);

  // Build list of user's actual WKLY categories for the dropdown
  const wklyCategories = useMemo(() => {
    const categories: { value: string; label: string; group: string }[] = [];
    const seen = new Set<string>();

    (requiredExpenses || []).forEach((e) => {
      const label = e.description ? `${e.category} - ${e.description}` : e.category;
      if (!seen.has(label)) {
        seen.add(label);
        categories.push({ value: label, label, group: 'Essential Expenses' });
      }
    });

    (discretionaryExpenses || []).forEach((e) => {
      const label = e.description ? `${e.category} - ${e.description}` : e.category;
      if (!seen.has(label)) {
        seen.add(label);
        categories.push({ value: label, label, group: 'Discretionary Expenses' });
      }
    });

    return categories;
  }, [requiredExpenses, discretionaryExpenses]);

  // Check if a bank transaction might be a duplicate of an existing WKLY transaction
  const checkDuplicate = useCallback(
    (plaidTx: PlaidTransaction): boolean => {
      if (!wklyTransactions) return false;
      const plaidDate = new Date(plaidTx.date);
      const plaidAmount = Math.abs(plaidTx.amount);

      return wklyTransactions.some((wt) => {
        // Already imported this exact transaction
        if (wt.plaidTransactionId === plaidTx.id) return true;

        // Match by amount (±$0.01) and date (±1 day)
        const wtAmount = Math.abs(wt.amount);
        if (Math.abs(wtAmount - plaidAmount) > 0.01) return false;

        if (!wt.date) return false;
        const wtDate = wt.date.toDate();
        const dayDiff = Math.abs(plaidDate.getTime() - wtDate.getTime()) / (1000 * 60 * 60 * 24);
        return dayDiff <= 1;
      });
    },
    [wklyTransactions]
  );

  // Check if already imported (exact plaidTransactionId match)
  const checkAlreadyImported = useCallback(
    (plaidTxId: string): boolean => {
      if (!wklyTransactions) return false;
      return wklyTransactions.some((wt) => wt.plaidTransactionId === plaidTxId);
    },
    [wklyTransactions]
  );

  // Create link token
  const createLinkToken = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (data.link_token) setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error creating link token:', error);
    }
  }, [user]);

  // Load connected items from Firestore
  const loadConnectedItems = useCallback(async () => {
    if (!firestore || !user) return;
    try {
      const snapshot = await getDocs(
        collection(firestore, `users/${user.uid}/plaidItems`)
      );
      const items: ConnectedItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          institutionName: data.institutionName || 'Unknown',
          connectedAt: data.connectedAt || '',
        });
      });
      setConnectedItems(items);
    } catch (error) {
      console.error('Error loading connected items:', error);
    }
  }, [firestore, user]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/plaid/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (data.accounts) setAccounts(data.accounts);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sync bank transactions (on-demand)
  const handleSyncTransactions = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/plaid/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (data.transactions) {
        setBankTransactions(data.transactions);

        // Build import rows with category suggestions and duplicate detection
        // Match Plaid's suggested category against the user's actual budget categories
        const categoryValues = wklyCategories.map((c) => c.value);
        const findMatchingCategory = (suggested: string): string => {
          if (!suggested) return '';
          // Exact match against user's budget category display names
          if (categoryValues.includes(suggested)) return suggested;
          // Partial match: check if any budget category contains the suggested name
          const lower = suggested.toLowerCase();
          const match = categoryValues.find(
            (v) => v.toLowerCase() === lower || v.toLowerCase().includes(lower) || lower.includes(v.toLowerCase())
          );
          return match || '';
        };

        const rows: ImportRow[] = data.transactions
          .filter((tx: PlaidTransaction) => tx.amount > 0 && !tx.pending) // Only expenses (positive in Plaid = money out), skip pending
          .map((tx: PlaidTransaction) => {
            const mapping = mapPlaidCategory(tx.category, tx.subcategory);
            const suggested = mapping?.category || '';
            const matched = findMatchingCategory(suggested);
            const alreadyImported = checkAlreadyImported(tx.id);

            return {
              plaidTx: tx,
              suggestedCategory: suggested,
              selectedCategory: matched,
              isDuplicate: !alreadyImported && checkDuplicate(tx),
              isImported: alreadyImported,
              status: alreadyImported ? 'imported' as const : 'pending' as const,
            };
          });

        setImportRows(rows);
        setShowImportSection(true);
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast({ variant: 'destructive', title: 'Sync Failed', description: 'Could not fetch bank transactions.' });
    } finally {
      setSyncing(false);
    }
  }, [user, checkDuplicate, checkAlreadyImported, toast, wklyCategories]);

  useEffect(() => {
    if (user) {
      createLinkToken();
      loadConnectedItems();
    }
  }, [user, createLinkToken, loadConnectedItems]);

  useEffect(() => {
    if (connectedItems.length > 0) fetchBalances();
  }, [connectedItems, fetchBalances]);

  // Plaid Link success handler
  const onSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      if (!user) return;
      try {
        const res = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicToken,
            userId: user.uid,
            institutionName: metadata?.institution?.name || 'Unknown',
          }),
        });
        const data = await res.json();
        if (data.success) {
          await loadConnectedItems();
          await fetchBalances();
        }
      } catch (error) {
        console.error('Error exchanging token:', error);
      }
    },
    [user, loadConnectedItems, fetchBalances]
  );

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess });

  // Import a single bank transaction into WKLY
  const handleImportTransaction = async (index: number) => {
    if (!firestore || !user) return;
    const row = importRows[index];
    if (!row.selectedCategory) {
      toast({ variant: 'destructive', title: 'Category Required', description: 'Please select a category before importing.' });
      return;
    }

    setImporting(row.plaidTx.id);
    try {
      const txCollection = collection(firestore, `users/${user.uid}/transactions`);
      await addDoc(txCollection, {
        userProfileId: user.uid,
        type: 'Expense',
        amount: Math.abs(row.plaidTx.amount),
        description: row.plaidTx.merchantName || row.plaidTx.name,
        category: row.selectedCategory,
        date: Timestamp.fromDate(new Date(row.plaidTx.date + 'T12:00:00')),
        plaidTransactionId: row.plaidTx.id,
      });

      setImportRows((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, status: 'imported' as const, isImported: true } : r
        )
      );

      toast({ title: 'Imported', description: `${row.plaidTx.merchantName || row.plaidTx.name} — ${formatCurrency(Math.abs(row.plaidTx.amount))}` });
    } catch (error) {
      console.error('Error importing transaction:', error);
      toast({ variant: 'destructive', title: 'Import Failed', description: 'Could not import this transaction.' });
    } finally {
      setImporting(null);
    }
  };

  // Batch import all pending transactions with their mapped categories
  const handleImportAll = async () => {
    if (!firestore || !user) return;
    const pendingRows = importRows
      .map((r, i) => ({ row: r, index: i }))
      .filter(({ row }) => row.status === 'pending' && row.selectedCategory);

    if (pendingRows.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing to import', description: 'No pending transactions with categories.' });
      return;
    }

    setBatchImporting(true);
    let imported = 0;
    const txCollection = collection(firestore, `users/${user.uid}/transactions`);

    for (const { row, index } of pendingRows) {
      try {
        await addDoc(txCollection, {
          userProfileId: user.uid,
          type: 'Expense',
          amount: Math.abs(row.plaidTx.amount),
          description: row.plaidTx.merchantName || row.plaidTx.name,
          category: row.selectedCategory,
          date: Timestamp.fromDate(new Date(row.plaidTx.date + 'T12:00:00')),
          plaidTransactionId: row.plaidTx.id,
        });
        setImportRows((prev) =>
          prev.map((r, i) =>
            i === index ? { ...r, status: 'imported' as const, isImported: true } : r
          )
        );
        imported++;
      } catch (error) {
        console.error('Error importing transaction:', row.plaidTx.id, error);
      }
    }

    setBatchImporting(false);
    toast({ title: 'Batch Import Complete', description: `${imported} transaction${imported !== 1 ? 's' : ''} imported.` });
  };

  // Skip a bank transaction
  const handleSkipTransaction = (index: number) => {
    setImportRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, status: 'skipped' as const } : r))
    );
  };

  // Update selected category for an import row
  const handleCategoryChange = (index: number, category: string) => {
    setImportRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selectedCategory: category } : r))
    );
  };

  // Disconnect an account
  const handleDisconnect = async () => {
    if (!firestore || !user || !disconnectItem) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/plaidItems`, disconnectItem.id));
      setDisconnectItem(null);
      await loadConnectedItems();
      setAccounts([]);
      setBankTransactions([]);
      setImportRows([]);
      setShowImportSection(false);
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  // Count pending import rows
  const pendingCount = importRows.filter((r) => r.status === 'pending').length;
  const readyCount = importRows.filter((r) => r.status === 'pending' && r.selectedCategory).length;
  const importedCount = importRows.filter((r) => r.status === 'imported').length;

  // Group categories for the select dropdown
  const essentialCategories = wklyCategories.filter((c) => c.group === 'Essential Expenses');
  const discretionaryCategories = wklyCategories.filter((c) => c.group === 'Discretionary Expenses');

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col h-screen overflow-y-auto">
      <PageHeader
        title="CONNECTED ACCOUNTS"
        subheader="Connect your bank to sync transactions and balances"
        rightContent={
          <div className="flex items-center gap-1">
            <HamburgerMenu />
          </div>
        }
        leftContent={
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4" />
              Profile
            </Link>
          </Button>
        }
      />

      <main className="flex-1 p-4 pb-8 space-y-4">
        {/* Connect Bank Button */}
        <Button onClick={() => open()} disabled={!ready} className="w-full h-12 gap-2">
          <Link2 className="size-5" />
          Connect a Bank Account
        </Button>

        {/* Connected Institutions */}
        {connectedItems.length > 0 && (
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 border-b text-center">
              Connected Institutions
            </h3>
            <div className="divide-y">
              {connectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.institutionName}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {item.connectedAt ? new Date(item.connectedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDisconnectItem(item)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Balances */}
        {accounts.length > 0 && (
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Account Balances
              </h3>
              <Button variant="ghost" size="sm" onClick={fetchBalances} disabled={loading} className="gap-1 h-7 text-xs">
                <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
            <div className="divide-y">
              {accounts.map((account) => {
                const Icon = accountTypeIcons[account.type] || Wallet;
                return (
                  <div key={account.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {account.name}
                          {account.mask && <span className="text-muted-foreground font-normal"> ••{account.mask}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{account.subtype || account.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{account.balance !== null ? formatCurrency(account.balance) : '—'}</p>
                      {account.availableBalance !== null && account.availableBalance !== account.balance && (
                        <p className="text-xs text-muted-foreground">Available: {formatCurrency(account.availableBalance)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sync & Import Transactions */}
        {connectedItems.length > 0 && (
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Import Transactions
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncTransactions}
                disabled={syncing}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                <Download className={cn('size-3.5', syncing && 'animate-spin')} />
                {syncing ? 'Syncing...' : 'Sync Transactions'}
              </Button>
            </div>

            {!showImportSection ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Tap "Sync Transactions" to pull the latest from your bank and review before importing.
              </div>
            ) : importRows.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No new transactions to import.
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between text-xs">
                  <span>
                    {pendingCount} to review
                    {importedCount > 0 && <span className="text-primary"> · {importedCount} imported</span>}
                  </span>
                  {readyCount > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 px-3 text-xs gap-1.5 font-semibold"
                      disabled={batchImporting}
                      onClick={handleImportAll}
                    >
                      <Check className="size-3" />
                      {batchImporting ? 'Importing...' : `Import All (${readyCount})`}
                    </Button>
                  )}
                </div>

                {/* Import rows */}
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {importRows.map((row, index) => {
                    if (row.status === 'skipped') return null;

                    const isAlreadyDone = row.status === 'imported';

                    return (
                      <div
                        key={row.plaidTx.id}
                        className={cn(
                          'px-4 py-3 space-y-2',
                          isAlreadyDone && 'opacity-50 bg-muted/20'
                        )}
                      >
                        {/* Row 1: Merchant, amount, duplicate badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div>
                              <p className="font-semibold text-sm truncate">
                                {row.plaidTx.merchantName || row.plaidTx.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{row.plaidTx.date}</p>
                            </div>
                            {row.isDuplicate && !isAlreadyDone && (
                              <span className="flex items-center gap-1 text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                                <AlertTriangle className="size-3" />
                                Possible duplicate
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-sm tabular-nums shrink-0 ml-3">
                            {formatCurrency(Math.abs(row.plaidTx.amount))}
                          </p>
                        </div>

                        {/* Row 2: Category select + action buttons */}
                        {!isAlreadyDone && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={row.selectedCategory}
                              onValueChange={(val) => handleCategoryChange(index, val)}
                            >
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {essentialCategories.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="text-xs font-bold">Essential</SelectLabel>
                                    {essentialCategories.map((c) => (
                                      <SelectItem key={c.value} value={c.value} className="text-xs">
                                        {c.label}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                                {discretionaryCategories.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="text-xs font-bold">Discretionary</SelectLabel>
                                    {discretionaryCategories.map((c) => (
                                      <SelectItem key={c.value} value={c.value} className="text-xs">
                                        {c.label}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                              </SelectContent>
                            </Select>

                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 px-3 text-xs gap-1"
                              disabled={!row.selectedCategory || importing === row.plaidTx.id}
                              onClick={() => handleImportTransaction(index)}
                            >
                              <Check className="size-3" />
                              {importing === row.plaidTx.id ? '...' : 'Import'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-muted-foreground"
                              onClick={() => handleSkipTransaction(index)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        )}

                        {isAlreadyDone && (
                          <p className="text-xs text-primary font-semibold flex items-center gap-1">
                            <Check className="size-3" />
                            Imported to {row.selectedCategory}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {connectedItems.length === 0 && (
          <div className="bg-card rounded-xl border shadow-sm p-8 text-center">
            <Landmark className="size-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">No Accounts Connected</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Connect your bank account to automatically import transactions and
              view real-time balances. Your data is encrypted and secure.
            </p>
          </div>
        )}
      </main>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={!!disconnectItem} onOpenChange={() => setDisconnectItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to disconnect <strong>{disconnectItem?.institutionName}</strong>?
            You will no longer see transactions or balances from this institution.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDisconnectItem(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
