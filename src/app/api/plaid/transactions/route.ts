import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { getAdminFirestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, startDate, endDate } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const db = await getAdminFirestore();
    const itemsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .get();

    if (itemsSnapshot.empty) {
      return NextResponse.json({ transactions: [], accounts: [] });
    }

    const allTransactions: any[] = [];
    const allAccounts: any[] = [];

    // Default to last 30 days
    const end = endDate || new Date().toISOString().split('T')[0];
    const start =
      startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    for (const doc of itemsSnapshot.docs) {
      const { accessToken } = doc.data();

      try {
        const response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: start,
          end_date: end,
          options: { count: 100, offset: 0 },
        });

        allTransactions.push(
          ...response.data.transactions.map((t) => ({
            id: t.transaction_id,
            name: t.name,
            amount: t.amount,
            date: t.date,
            category: t.personal_finance_category?.primary || t.category?.[0] || 'Other',
            subcategory: t.personal_finance_category?.detailed || t.category?.[1] || '',
            merchantName: t.merchant_name || '',
            accountId: t.account_id,
            pending: t.pending,
          }))
        );

        allAccounts.push(
          ...response.data.accounts.map((a) => ({
            id: a.account_id,
            name: a.name,
            officialName: a.official_name,
            type: a.type,
            subtype: a.subtype,
            balance: a.balances.current,
            availableBalance: a.balances.available,
            mask: a.mask,
          }))
        );
      } catch (err: any) {
        console.error(`Error fetching transactions for item ${doc.id}:`, err?.response?.data || err);
      }
    }

    // Sort transactions by date descending
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions: allTransactions, accounts: allAccounts });
  } catch (error: any) {
    console.error('Error fetching transactions:', error?.response?.data || error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
