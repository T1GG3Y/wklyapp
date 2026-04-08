import { NextRequest, NextResponse } from 'next/server';
import { CountryCode, Products, Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    const env = process.env.PLAID_ENV || 'sandbox';

    if (!clientId || !secret) {
      return NextResponse.json(
        {
          error: 'Plaid credentials not configured',
          hasClientId: !!clientId,
          hasSecret: !!secret,
          env,
        },
        { status: 500 }
      );
    }

    const configuration = new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });

    const client = new PlaidApi(configuration);

    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'WKLY Budget App',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error?.response?.data || error);
    return NextResponse.json(
      {
        error: 'Failed to create link token',
        detail: error?.response?.data?.error_message || error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
