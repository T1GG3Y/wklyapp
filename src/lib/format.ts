// WKLY App Formatting Utilities
// Currency and amount formatting functions

import type { Frequency } from './constants';

/**
 * Format a number as currency with 2 decimal places and comma separators
 * @param amount - The amount to format
 * @returns Formatted string like "$24,352.82"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with 2 decimal places and comma separators (no currency symbol)
 * @param amount - The amount to format
 * @returns Formatted string like "24,352.82"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert any frequency amount to weekly equivalent
 * @param amount - The amount in the given frequency
 * @param frequency - The frequency of the amount
 * @returns Weekly equivalent amount
 */
export function getWeeklyAmount(amount: number, frequency: Frequency | string): number {
  switch (frequency) {
    case 'Weekly':
      return amount;
    case 'Bi-Weekly':
      return amount / 2;
    case 'Twice a month':
      return (amount * 2) / 4.33;
    case 'Monthly':
      return amount / 4.33;
    case 'Quarterly':
      return amount / 13;
    case 'Semi-Annual':
      return amount / 26;
    case 'Yearly':
      return amount / 52;
    case 'One time':
      return 0; // One-time payments don't contribute to weekly budget
    default:
      return 0;
  }
}

/**
 * Convert weekly amount to other frequencies
 * @param weeklyAmount - The weekly amount
 * @returns Object with amounts for all frequencies
 */
export function getAmountsByFrequency(weeklyAmount: number): {
  weekly: number;
  monthly: number;
  yearly: number;
} {
  return {
    weekly: weeklyAmount,
    monthly: weeklyAmount * 4.33,
    yearly: weeklyAmount * 52,
  };
}

/**
 * Format amount input as user types with commas and 2 decimal places
 * @param value - The input string value
 * @returns Formatted string for display
 */
export function formatAmountInput(value: string): string {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');

  // Split by decimal point
  const parts = cleaned.split('.');

  // Get the integer part and format with commas
  let integerPart = parts[0] || '0';
  integerPart = integerPart.replace(/^0+(?=\d)/, ''); // Remove leading zeros
  if (integerPart === '') integerPart = '0';

  // Add commas to integer part
  integerPart = Number(integerPart).toLocaleString('en-US');

  // Handle decimal part (limit to 2 digits)
  let decimalPart = parts[1] || '';
  if (decimalPart.length > 2) {
    decimalPart = decimalPart.substring(0, 2);
  }

  // Combine parts
  if (parts.length > 1) {
    return `${integerPart}.${decimalPart}`;
  }

  return integerPart;
}

/**
 * Parse a formatted amount string back to a number
 * @param value - The formatted string (e.g., "24,352.82")
 * @returns The numeric value
 */
export function parseFormattedAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a percentage with 1 decimal place
 * @param value - The decimal value (e.g., 0.75 for 75%)
 * @returns Formatted string like "75.0%"
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Calculate the percentage of a goal achieved
 * @param current - Current amount saved
 * @param target - Target amount
 * @returns Percentage as decimal (0-1+)
 */
export function calculateGoalPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return current / target;
}
