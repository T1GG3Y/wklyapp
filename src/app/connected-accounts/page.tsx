'use client';

import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { formatCurrency } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

const accountTypeIcons: Record<string, typeof Wallet> = {
  depository: Landmark,
  credit: CreditCard,
  loan: Building2,
  investment: PiggyBank,
};

export default function ConnectedAccountsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectedItems, setConnectedItems] = useState<ConnectedItem[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [disconnectItem, setDisconnectItem] = useState<ConnectedItem | null>(null);

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
      if (data.link_token) {
        setLinkToken(data.link_token);
      }
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
      if (data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      const res = await fetch('/api/plaid/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      createLinkToken();
      loadConnectedItems();
    }
  }, [user, createLinkToken, loadConnectedItems]);

  useEffect(() => {
    if (connectedItems.length > 0) {
      fetchBalances();
      fetchTransactions();
    }
  }, [connectedItems, fetchBalances, fetchTransactions]);

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
          // Reload connected items and fetch data
          await loadConnectedItems();
          await fetchBalances();
          await fetchTransactions();
        }
      } catch (error) {
        console.error('Error exchanging token:', error);
      }
    },
    [user, loadConnectedItems, fetchBalances, fetchTransactions]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  // Disconnect an account
  const handleDisconnect = async () => {
    if (!firestore || !user || !disconnectItem) return;
    try {
      await deleteDoc(
        doc(firestore, `users/${user.uid}/plaidItems`, disconnectItem.id)
      );
      setDisconnectItem(null);
      await loadConnectedItems();
      setAccounts([]);
      setTransactions([]);
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col h-screen overflow-y-auto">
      <PageHeader
        title="CONNECTED ACCOUNTS"
        subheader="Connect your bank to automatically sync transactions and balances"
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
        <Button
          onClick={() => open()}
          disabled={!ready}
          className="w-full h-12 gap-2"
        >
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
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.institutionName}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected{' '}
                        {item.connectedAt
                          ? new Date(item.connectedAt).toLocaleDateString()
                          : ''}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBalances}
                disabled={loading}
                className="gap-1 h-7 text-xs"
              >
                <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
            <div className="divide-y">
              {accounts.map((account) => {
                const Icon = accountTypeIcons[account.type] || Wallet;
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {account.name}
                          {account.mask && (
                            <span className="text-muted-foreground font-normal">
                              {' '}
                              ••{account.mask}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {account.subtype || account.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {account.balance !== null
                          ? formatCurrency(account.balance)
                          : '—'}
                      </p>
                      {account.availableBalance !== null &&
                        account.availableBalance !== account.balance && (
                          <p className="text-xs text-muted-foreground">
                            Available: {formatCurrency(account.availableBalance)}
                          </p>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions from Bank */}
        {transactions.length > 0 && (
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Bank Transactions (Last 30 Days)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchTransactions}
                disabled={loadingTransactions}
                className="gap-1 h-7 text-xs"
              >
                <RefreshCw
                  className={cn('size-3', loadingTransactions && 'animate-spin')}
                />
                Refresh
              </Button>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {tx.merchantName || tx.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tx.category}</span>
                      <span>-</span>
                      <span>{tx.date}</span>
                      {tx.pending && (
                        <span className="text-amber-500 font-semibold">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <p
                    className={cn(
                      'font-bold text-sm tabular-nums shrink-0 ml-3',
                      tx.amount > 0 ? 'text-secondary' : 'text-primary'
                    )}
                  >
                    {tx.amount > 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
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
      <Dialog
        open={!!disconnectItem}
        onOpenChange={() => setDisconnectItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to disconnect{' '}
            <strong>{disconnectItem?.institutionName}</strong>? You will no longer
            see transactions or balances from this institution.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDisconnectItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
