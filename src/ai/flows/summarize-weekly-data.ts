'use server';

/**
 * @fileOverview Provides an AI flow to summarize weekly financial data.
 *
 * - summarizeWeeklyData - A function that calculates weekly financial totals from a list of transactions.
 * - WeeklyDataInput - The input type for the summarizeWeeklyData function.
 * - WeeklyDataOutput - The return type for the summarizeWeeklyData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['Income', 'Expense']),
  amount: z.number(),
  date: z.string(),
  category: z.string(),
  description: z.string().optional(),
});

export const WeeklyDataInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('A list of financial transactions for the week.'),
});
export type WeeklyDataInput = z.infer<typeof WeeklyDataInputSchema>;

export const WeeklyDataOutputSchema = z.object({
  totalIncome: z.number().describe('Total income for the week.'),
  totalExpenses: z.number().describe('Total expenses for the week.'),
  netChange: z.number().describe('The net financial change for the week (income - expenses).'),
});
export type WeeklyDataOutput = z.infer<typeof WeeklyDataOutputSchema>;


export async function summarizeWeeklyData(input: WeeklyDataInput): Promise<WeeklyDataOutput> {
  return summarizeWeeklyDataFlow(input);
}


const summarizeWeeklyDataFlow = ai.defineFlow(
  {
    name: 'summarizeWeeklyDataFlow',
    inputSchema: WeeklyDataInputSchema,
    outputSchema: WeeklyDataOutputSchema,
  },
  async (input) => {
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const transaction of input.transactions) {
      if (transaction.type === 'Income') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
      }
    }

    const netChange = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netChange,
    };
  }
);
