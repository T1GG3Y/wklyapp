
'use client';

import { useDoc, useUser } from '@/firebase';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import type { DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';

interface WeeklySummary extends DocumentData {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

export default function ReportDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const reportId = params.id as string;

  const summaryPath = useMemo(() => (user && reportId ? `users/${user.uid}/weeklySummaries/${reportId}` : null), [user, reportId]);
  const { data: summary, loading } = useDoc<WeeklySummary>(summaryPath);
  
  const chartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Income', value: summary.totalIncome, fill: 'hsl(var(--primary))' },
      { name: 'Expenses', value: summary.totalExpenses, fill: 'hsl(var(--secondary))' },
    ];
  }, [summary]);

  if (loading) {
    return <div className="text-center p-10">Loading report...</div>;
  }

  if (!summary) {
    return <div className="text-center p-10">Report not found.</div>;
  }

  const netChange = summary.totalIncome - summary.totalExpenses;

  return (
    <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Week of {format(new Date(summary.weekStartDate), 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                          <p className="font-bold">{`${payload[0].name}: $${(payload[0].value as number).toFixed(2)}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-muted-foreground">Total Income</h3>
              </div>
              <p className="text-2xl font-bold text-primary">${summary.totalIncome.toFixed(2)}</p>
            </div>
             <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownLeft className="size-4 text-secondary" />
                <h3 className="text-sm font-semibold text-muted-foreground">Total Expenses</h3>
              </div>
              <p className="text-2xl font-bold text-secondary">${summary.totalExpenses.toFixed(2)}</p>
            </div>
             <div className={cn("rounded-lg p-4", netChange >= 0 ? 'bg-primary/10' : 'bg-destructive/10')}>
              <div className={cn("flex items-center gap-2 mb-1", netChange >= 0 ? 'text-primary' : 'text-destructive')}>
                {netChange >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                <h3 className="text-sm font-semibold">Net Change</h3>
              </div>
              <p className={cn("text-2xl font-bold", netChange >= 0 ? 'text-primary' : 'text-destructive')}>
                {netChange >= 0 ? '+' : '-'}${Math.abs(netChange).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
