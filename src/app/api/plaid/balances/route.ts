import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { getAdminFirestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

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
      return NextResponse.json({ accounts: [] });
    }

    const allAccounts: any[] = [];

    for (const doc of itemsSnapshot.docs) {
      const { accessToken, institutionName } = doc.data();

      try {
        const response = await plaidClient.accountsBalanceGet({
          access_token: accessToken,
        });

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
            institution: institutionName,
          }))
        );
      } catch (err: any) {
        console.error(`Error fetching balances for item ${doc.id}:`, err?.response?.data || err);
      }
    }

    return NextResponse.json({ accounts: allAccounts });
  } catch (error: any) {
    console.error('Error fetching balances:', error?.response?.data || error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}
