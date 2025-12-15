'use server';

/**
 * @fileOverview A flow that analyzes user spending and alerts them when they exceed their weekly budget.
 *
 * - intelligentBudgetAlerts - A function that triggers the budget analysis and alert process.
 * - IntelligentBudgetAlertsInput - The input type for the intelligentBudgetAlerts function.
 * - IntelligentBudgetAlertsOutput - The return type for the intelligentBudgetAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentBudgetAlertsInputSchema = z.object({
  weeklyBudget: z.number().describe('The user\'s weekly spending budget.'),
  spending: z.number().describe('The user\'s current spending for the week.'),
  transactionHistory: z.string().describe('A summary of the user\'s recent transaction history.'),
});
export type IntelligentBudgetAlertsInput = z.infer<typeof IntelligentBudgetAlertsInputSchema>;

const IntelligentBudgetAlertsOutputSchema = z.object({
  alertMessage: z.string().describe('A message to the user indicating whether they have exceeded their budget and suggestions for improvement.'),
});
export type IntelligentBudgetAlertsOutput = z.infer<typeof IntelligentBudgetAlertsOutputSchema>;

export async function intelligentBudgetAlerts(input: IntelligentBudgetAlertsInput): Promise<IntelligentBudgetAlertsOutput> {
  return intelligentBudgetAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentBudgetAlertsPrompt',
  input: {schema: IntelligentBudgetAlertsInputSchema},
  output: {schema: IntelligentBudgetAlertsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's spending habits based on their transaction history and weekly budget.

  Weekly Budget: {{{weeklyBudget}}}
  Current Spending: {{{spending}}}
  Transaction History: {{{transactionHistory}}}

  Determine if the user has exceeded their weekly budget. If they have, generate a message that warns them about exceeding their budget and provides personalized suggestions for how to reduce spending and improve their budget.
  If they are within their budget, congratulate them and offer tips for continuing their good financial habits.
  Be concise and encouraging.
  `,
});

const intelligentBudgetAlertsFlow = ai.defineFlow(
  {
    name: 'intelligentBudgetAlertsFlow',
    inputSchema: IntelligentBudgetAlertsInputSchema,
    outputSchema: IntelligentBudgetAlertsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
