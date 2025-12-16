'use client';

import { useMemo } from 'react';
import { useCollection, useDoc, useUser } from '@/firebase';
import type { DocumentData, Timestamp } from 'firebase/firestore';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Landmark } from 'lucide-react';


// --- Data Interfaces ---
interface UserProfile extends DocumentData {
  startDayOfWeek?: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
}

interface RequiredExpense extends DocumentData {
  id: string;
  category: string;
  amount: number;
  frequency: 'Weekly' | 'Monthly' | 'Yearly';
}

interface DiscretionaryExpense extends DocumentData {
  id: string;
  category: string;
  plannedAmount: number; // This is a weekly amount
}

interface SavingsGoal extends DocumentData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  // Assuming a planned weekly contribution might be added later
  // plannedContribution?: number; 
}

interface Transaction extends DocumentData {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  date: Timestamp;
  category: string;
  description?: string;
}

const dayIndexMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

// --- Main Component ---
export default function ReportsScreen() {
  const { user } = useUser();

  // --- Data Fetching ---
  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : ''), [user]);
  const requiredExpensesPath = useMemo(() => (user ? `users/${user.uid}/requiredExpenses` : null), [user]);
  const discretionaryExpensesPath = useMemo(() => (user ? `users/${user.uid}/discretionaryExpenses` : null), [user]);
  const savingsGoalsPath = useMemo(() => (user ? `users/${user.uid}/savingsGoals` : null), [user]);
  const transactionsPath = useMemo(() => (user ? `users/${user.uid}/transactions` : null), [user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfilePath);
  const { data: requiredExpenses } = useCollection<RequiredExpense>(requiredExpensesPath);
  const { data: discretionaryExpenses } = useCollection<DiscretionaryExpense>(discretionaryExpensesPath);
  const { data: savingsGoals } = useCollection<SavingsGoal>(savingsGoalsPath);
  const { data: transactions } = useCollection<Transaction>(transactionsPath);

  // --- Data Processing for Charts ---
  const weeklyChartData = useMemo(() => {
    if (!userProfile || !transactions || !requiredExpenses || !discretionaryExpenses || !savingsGoals) {
      return { required: [], discretionary: [], savings: [] };
    }

    const startDay = userProfile.startDayOfWeek || 'Sunday';
    const weekStartsOn = dayIndexMap[startDay as keyof typeof dayIndexMap];
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn });
    const weekEnd = endOfWeek(now, { weekStartsOn });

    const weeklyTransactions = (transactions || []).filter(t => {
        if (!t.date) return false;
        const transactionDate = t.date.toDate();
        return isWithinInterval(transactionDate, { start: weekStart, end: weekEnd });
    });

    // Helper to get weekly planned amount
    const getWeeklyPlanned = (amount: number, frequency: string) => {
        switch (frequency) {
            case 'Weekly': return amount;
            case 'Monthly': return amount / 4.33;
            case 'Yearly': return amount / 52;
            default: return 0;
        }
    };
    
    // Group actual spending by category
    const actualSpending = weeklyTransactions.reduce((acc, t) => {
        if (t.type === 'Expense') {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
    }, {} as {[key: string]: number});

    // 1. Required Expenses Chart Data
    const requiredChartData = (requiredExpenses || []).map(expense => ({
        name: expense.category,
        Planned: parseFloat(getWeeklyPlanned(expense.amount, expense.frequency).toFixed(2)),
        Actual: parseFloat((actualSpending[expense.category] || 0).toFixed(2)),
    }));
    
    // 2. Discretionary Expenses Chart Data
    const discretionaryChartData = (discretionaryExpenses || []).map(expense => ({
        name: expense.category,
        Planned: expense.plannedAmount, // Already weekly
        Actual: parseFloat((actualSpending[expense.category] || 0).toFixed(2)),
    }));
    
    // 3. Savings Chart Data
    // Note: We need a concept of "planned" weekly savings. For now, we'll imagine it's a fixed portion of the goal.
    // Let's assume a 10% weekly goal until a proper planned contribution is added.
    const savingsChartData = (savingsGoals || []).map(goal => ({
        name: goal.name,
        Planned: parseFloat((goal.targetAmount / 10).toFixed(2)), // Placeholder for planned weekly savings
        Actual: parseFloat((actualSpending[goal.name] || 0).toFixed(2)), // Assuming savings are logged as expenses
    }));

    return {
      required: requiredChartData,
      discretionary: discretionaryChartData,
      savings: savingsChartData,
    };
  }, [userProfile, transactions, requiredExpenses, discretionaryExpenses, savingsGoals]);
  
  // Custom label for bars
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0) return null;
    return (
      <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={10}>
        {`$${value.toFixed(0)}`}
      </text>
    );
  };
  
  const ChartWrapper = ({ title, data }: { title: string, data: any[] }) => (
    <Card className="shadow-soft">
        <CardHeader>
            <CardTitle className="text-lg font-headline">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {data.length > 0 ? (
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend wrapperStyle={{paddingTop: '40px'}}/>
                        <Bar dataKey="Planned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                             <LabelList dataKey="Planned" content={renderCustomizedLabel} />
                        </Bar>
                        <Bar dataKey="Actual" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Actual" content={renderCustomizedLabel} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center text-muted-foreground py-10">No data available for this chart.</div>
            )}
        </CardContent>
    </Card>
  );


  return (
    <>
      <header className="px-5 py-3 flex items-center justify-center sticky top-0 bg-background/90 backdrop-blur-sm z-20 border-b">
        <h1 className="text-lg font-bold font-headline tracking-tight text-foreground">
          Weekly Reports
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-6 pt-4">
        
        <ChartWrapper title="Required Expenses" data={weeklyChartData.required} />

        <ChartWrapper title="Discretionary Spending" data={weeklyChartData.discretionary} />

        <ChartWrapper title="Savings Goals" data={weeklyChartData.savings} />
        
         <Alert>
            <Landmark className="h-4 w-4" />
            <AlertTitle>More Reports Coming Soon!</AlertTitle>
            <AlertDescription>
                Features like income growth tracking, upcoming expenses, and loan balances are under construction.
            </AlertDescription>
        </Alert>

      </main>
    </>
  );
}
