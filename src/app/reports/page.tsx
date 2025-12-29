
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useDoc, useUser } from '@/firebase';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ChevronRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';


interface WeeklySummary extends DocumentData {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalIncome: number;
  totalExpenses: number;
}

interface Transaction extends DocumentData {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: Timestamp;
}

interface UserProfile extends DocumentData {
    startDayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
}

const dayIndexMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

export default function ReportsScreen() {
  const { user } = useUser();
  const [thisWeekNetChange, setThisWeekNetChange] = useState(0);

  const weeklySummariesPath = useMemo(() => (user ? `users/${user.uid}/weeklySummaries` : null), [user]);
  const transactionsPath = useMemo(() => (user ? `users/${user.uid}/transactions` : null), [user]);
  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);

  const { data: summaries, loading: summariesLoading } = useCollection<WeeklySummary>(weeklySummariesPath, {
    orderBy: ['weekStartDate', 'desc']
  });
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsPath);
  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);

  useEffect(() => {
    if (transactions && userProfile) {
      const startDay = userProfile?.startDayOfWeek || 'Sunday';
      const weekStartsOn = dayIndexMap[startDay as keyof typeof dayIndexMap];
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn });
      const weekEnd = endOfWeek(now, { weekStartsOn });

      let currentNet = 0;
      transactions.forEach(t => {
        if (!t.date) return;
        const transactionDate = t.date.toDate();
        if (isWithinInterval(transactionDate, { start: weekStart, end: weekEnd })) {
          if (t.type === 'Income') {
            currentNet += t.amount;
          } else {
            currentNet -= t.amount;
          }
        }
      });
      setThisWeekNetChange(currentNet);
    }
  }, [transactions, userProfile]);

  const loading = summariesLoading || transactionsLoading;

  const NetIconThisWeek = thisWeekNetChange >= 0 ? TrendingUp : TrendingDown;

  return (
    <>
      <header className="px-5 py-3 flex items-center justify-center sticky top-0 bg-background/90 backdrop-blur-sm z-20 border-b">
        <h1 className="text-lg font-bold font-headline tracking-tight text-foreground">
          Reports
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4 pt-4">
        {loading && (
          <div className="text-center text-muted-foreground py-10">
            Loading reports...
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {/* This Week's Report */}
            <Link href="/reports/this-week" className="block group">
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-primary/50 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-lg shrink-0 size-12 border bg-card text-foreground">
                    <Clock className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-bold truncate text-base">
                      This Week
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Live Summary
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className='text-right'>
                      <p className={cn('font-bold text-lg', thisWeekNetChange >= 0 ? 'text-primary' : 'text-destructive')}>
                        {thisWeekNetChange >= 0 ? '+' : '-'}${Math.abs(thisWeekNetChange).toFixed(2)}
                      </p>
                      <p className='text-xs text-muted-foreground'>So Far</p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {(!summaries || summaries.length === 0) && (
              <p className="text-muted-foreground text-center pt-4">
                  Older reports will appear here after each week.
              </p>
            )}

            {summaries && summaries.map(summary => {
                const netChange = summary.totalIncome - summary.totalExpenses;
                const NetIcon = netChange >= 0 ? TrendingUp : TrendingDown;
                
                return (
                    <Link key={summary.id} href={`/reports/${summary.id}`} className="block group">
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                           <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn("flex items-center justify-center rounded-lg shrink-0 size-12 border", 
                                    netChange >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                                )}>
                                    <NetIcon className="size-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground font-bold truncate text-base">
                                        Week of {format(new Date(summary.weekStartDate), 'MMM d')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(summary.weekStartDate), 'MMM d, yyyy')} - {format(new Date(summary.weekEndDate), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className='text-right'>
                                        <p className={cn('font-bold text-lg', netChange >= 0 ? 'text-primary' : 'text-destructive')}>
                                            {netChange >= 0 ? '+' : '-'}${Math.abs(netChange).toFixed(2)}
                                        </p>
                                        <p className='text-xs text-muted-foreground'>Net Change</p>
                                     </div>
                                    <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                           </CardContent>
                        </Card>
                    </Link>
                )
            })}
          </div>
        )}
      </main>
    </>
  );
}
