import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { getAdminFirestore } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { publicToken, userId, institutionName } = await req.json();

    if (!publicToken || !userId) {
      return NextResponse.json(
        { error: 'publicToken and userId are required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = response.data;

    // Store access token securely in Firestore
    const db = await getAdminFirestore();
    await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .doc(item_id)
      .set({
        accessToken: access_token,
        itemId: item_id,
        institutionName: institutionName || 'Unknown',
        connectedAt: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      itemId: item_id,
      institutionName,
    });
  } catch (error: any) {
    console.error('Error exchanging token:', error?.response?.data || error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
