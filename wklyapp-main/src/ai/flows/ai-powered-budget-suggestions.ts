'use server';

/**
 * @fileOverview Provides AI-powered budget suggestions based on user spending habits.
 *
 * - getBudgetSuggestions - A function that generates budget improvement suggestions.
 * - BudgetSuggestionsInput - The input type for the getBudgetSuggestions function.
 * - BudgetSuggestionsOutput - The return type for the getBudgetSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetSuggestionsInputSchema = z.object({
  spendingData: z.string().describe('A JSON string containing the user\u0027s spending data, including categories, amounts, and frequency.'),
  weeklyBudget: z.number().describe('The user\u0027s current weekly budget.'),
});
export type BudgetSuggestionsInput = z.infer<typeof BudgetSuggestionsInputSchema>;

const BudgetSuggestionsOutputSchema = z.object({
  suggestions: z.string().describe('A list of AI-powered suggestions for improving the user\u0027s budget, based on their spending habits.'),
});
export type BudgetSuggestionsOutput = z.infer<typeof BudgetSuggestionsOutputSchema>;

export async function getBudgetSuggestions(input: BudgetSuggestionsInput): Promise<BudgetSuggestionsOutput> {
  return budgetSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetSuggestionsPrompt',
  input: {schema: BudgetSuggestionsInputSchema},
  output: {schema: BudgetSuggestionsOutputSchema},
  prompt: `You are a personal finance expert. Analyze the user's spending data and provide actionable suggestions for improving their budget.

User's current weekly budget: {{{weeklyBudget}}}

Spending Data: {{{spendingData}}}

Based on this data, provide a list of suggestions on how the user can improve their budget and save money. Consider specific categories where they are overspending and suggest alternatives.
`,
});

const budgetSuggestionsFlow = ai.defineFlow(
  {
    name: 'budgetSuggestionsFlow',
    inputSchema: BudgetSuggestionsInputSchema,
    outputSchema: BudgetSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
