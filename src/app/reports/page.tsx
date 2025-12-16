
'use client';

import { useMemo } from 'react';
import { useCollection, useUser } from '@/firebase';
import type { DocumentData } from 'firebase/firestore';
import { format } from 'date-fns';
import { ChevronRight, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';


interface WeeklySummary extends DocumentData {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

export default function ReportsScreen() {
  const { user } = useUser();

  const weeklySummariesPath = useMemo(() => (user ? `users/${user.uid}/weeklySummaries` : null), [user]);

  const { data: summaries, loading } = useCollection<WeeklySummary>(weeklySummariesPath, {
    orderBy: ['weekStartDate', 'desc']
  });

  return (
    <>
      <header className="px-5 py-3 flex items-center justify-center sticky top-0 bg-background/90 backdrop-blur-sm z-20 border-b">
        <h1 className="text-lg font-bold font-headline tracking-tight text-foreground">
          Past Reports
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4 pt-4">
        {loading && (
          <div className="text-center text-muted-foreground py-10">
            Loading reports...
          </div>
        )}

        {!loading && (!summaries || summaries.length === 0) && (
          <Card className="shadow-soft">
            <CardHeader>
                <CardTitle className="text-lg font-headline">No Reports Yet</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Once you complete a week, your summary will appear here. For now, this page is empty. We will build the feature to save your weekly data next.
                </p>
            </CardContent>
          </Card>
        )}

        {!loading && summaries && summaries.length > 0 && (
          <div className="space-y-3">
            {summaries.map(summary => {
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
