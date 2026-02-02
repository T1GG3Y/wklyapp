'use client';

import { Button } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { subWeeks, subDays } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SeedTestDataPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const seedTestData = async () => {
    if (!firestore || !user) {
      setResult('Error: Not logged in');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
      const now = new Date();
      let transactionsCreated = 0;

      // Create test transactions for the past 6 weeks
      for (let week = 1; week <= 6; week++) {
        const weekDate = subWeeks(now, week);

        // Add income transaction (e.g., weekly paycheck)
        await addDoc(transactionsRef, {
          type: 'Income',
          amount: 1500,
          description: `Test Income - Week ${week}`,
          category: 'Paycheck',
          date: Timestamp.fromDate(subDays(weekDate, 2)),
          createdAt: Timestamp.now(),
        });
        transactionsCreated++;

        // Add some expense transactions
        const expenses = [
          { amount: 150, category: 'Groceries', description: 'Weekly groceries' },
          { amount: 50, category: 'Gas/Parking/Tolls', description: 'Gas' },
          { amount: 25, category: 'Personal Care', description: 'Misc' },
        ];

        for (const expense of expenses) {
          await addDoc(transactionsRef, {
            type: 'Expense',
            amount: expense.amount,
            description: `${expense.description} - Week ${week}`,
            category: expense.category,
            date: Timestamp.fromDate(subDays(weekDate, Math.floor(Math.random() * 5))),
            createdAt: Timestamp.now(),
          });
          transactionsCreated++;
        }
      }

      setResult(`Success! Created ${transactionsCreated} test transactions for the past 6 weeks. Visit the Dashboard to generate weekly summaries, then check Reports.`);
    } catch (error) {
      console.error('Error seeding data:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Seed Test Data</h1>
        </div>

        <div className="bg-card rounded-xl p-6 border space-y-4">
          <p className="text-muted-foreground">
            This will create test transactions for the past 6 weeks to test the weekly reports feature.
          </p>
          <p className="text-sm text-muted-foreground">
            Each week will include:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            <li>1 income transaction ($1,500)</li>
            <li>3 expense transactions (~$225 total)</li>
          </ul>

          <Button
            onClick={seedTestData}
            disabled={loading || !user}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Test Transactions'}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg text-sm ${result.startsWith('Success') ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
              {result}
            </div>
          )}

          {!user && (
            <p className="text-destructive text-sm">Please log in first.</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          After creating test data, visit the Dashboard page to trigger weekly summary generation, then check the Reports page.
        </p>
      </div>
    </div>
  );
}
