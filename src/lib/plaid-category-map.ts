// Static mapping from Plaid personal_finance_category to WKLY budget categories
// Format: 'PLAID_PRIMARY.PLAID_DETAILED' → { category, type }
// Falls back to primary category if detailed not found

interface WklyMapping {
  category: string;
  type: 'essential' | 'discretionary' | 'loan';
}

const detailedMap: Record<string, WklyMapping> = {
  // Food & Drink
  'FOOD_AND_DRINK.GROCERIES': { category: 'Groceries', type: 'essential' },
  'FOOD_AND_DRINK.RESTAURANTS': { category: 'Dining Out', type: 'discretionary' },
  'FOOD_AND_DRINK.COFFEE': { category: 'Dining Out', type: 'discretionary' },
  'FOOD_AND_DRINK.FAST_FOOD': { category: 'Dining Out', type: 'discretionary' },
  'FOOD_AND_DRINK.FOOD_AND_DRINK_OTHER': { category: 'Groceries', type: 'essential' },

  // Transportation
  'TRANSPORTATION.GAS': { category: 'Gas/Parking/Tolls', type: 'essential' },
  'TRANSPORTATION.PARKING': { category: 'Gas/Parking/Tolls', type: 'essential' },
  'TRANSPORTATION.TOLLS': { category: 'Gas/Parking/Tolls', type: 'essential' },
  'TRANSPORTATION.PUBLIC_TRANSIT': { category: 'Gas/Parking/Tolls', type: 'essential' },
  'TRANSPORTATION.TAXIS_AND_RIDE_SHARES': { category: 'Gas/Parking/Tolls', type: 'essential' },

  // Rent & Utilities
  'RENT_AND_UTILITIES.RENT': { category: 'Rent', type: 'essential' },
  'RENT_AND_UTILITIES.ELECTRIC': { category: 'Electrical', type: 'essential' },
  'RENT_AND_UTILITIES.GAS': { category: 'Natural Gas', type: 'essential' },
  'RENT_AND_UTILITIES.WATER': { category: 'Water/Sewer', type: 'essential' },
  'RENT_AND_UTILITIES.SEWAGE': { category: 'Water/Sewer', type: 'essential' },
  'RENT_AND_UTILITIES.TELEPHONE': { category: 'Phone', type: 'essential' },
  'RENT_AND_UTILITIES.INTERNET': { category: 'Internet', type: 'discretionary' },
  'RENT_AND_UTILITIES.TRASH': { category: 'Garbage', type: 'essential' },
  'RENT_AND_UTILITIES.CABLE': { category: 'TV Service', type: 'discretionary' },

  // Insurance
  'INSURANCE.AUTO': { category: 'Auto Insurance', type: 'essential' },
  'INSURANCE.HOME': { category: 'Home Insurance', type: 'essential' },
  'INSURANCE.HEALTH': { category: 'Medical', type: 'essential' },

  // Medical
  'MEDICAL.DENTAL': { category: 'Dental', type: 'essential' },
  'MEDICAL.DOCTOR': { category: 'Medical', type: 'essential' },
  'MEDICAL.PHARMACY': { category: 'Medical', type: 'essential' },
  'MEDICAL.EYE_CARE': { category: 'Medical', type: 'essential' },

  // Home
  'HOME_IMPROVEMENT.HARDWARE': { category: 'House Maintenance', type: 'discretionary' },
  'HOME_IMPROVEMENT.FURNITURE': { category: 'House Maintenance', type: 'discretionary' },
  'HOME_IMPROVEMENT.REPAIR_AND_MAINTENANCE': { category: 'House Maintenance', type: 'discretionary' },

  // Personal Care
  'PERSONAL_CARE.HAIR': { category: 'Personal Care', type: 'discretionary' },
  'PERSONAL_CARE.LAUNDRY': { category: 'Personal Care', type: 'discretionary' },
  'PERSONAL_CARE.PERSONAL_CARE_OTHER': { category: 'Personal Care', type: 'discretionary' },

  // Entertainment & Recreation
  'ENTERTAINMENT.SUBSCRIPTION': { category: 'Subscriptions', type: 'discretionary' },
  'ENTERTAINMENT.TV_AND_MOVIES': { category: 'TV Service', type: 'discretionary' },
  'ENTERTAINMENT.FITNESS': { category: 'Fitness', type: 'discretionary' },
  'ENTERTAINMENT.SPORTS': { category: 'Fitness', type: 'discretionary' },
  'RECREATION.OUTDOORS': { category: 'Family Activities', type: 'discretionary' },

  // General Merchandise
  'GENERAL_MERCHANDISE.CLOTHING': { category: 'Apparel', type: 'discretionary' },
  'GENERAL_MERCHANDISE.PET_SUPPLIES': { category: 'Pets', type: 'discretionary' },
  'GENERAL_MERCHANDISE.GIFTS': { category: 'Gifts', type: 'discretionary' },
  'GENERAL_MERCHANDISE.DISCOUNT_STORES': { category: 'Groceries', type: 'essential' },
  'GENERAL_MERCHANDISE.DEPARTMENT_STORES': { category: 'Personal Expenses', type: 'discretionary' },
  'GENERAL_MERCHANDISE.ELECTRONICS': { category: 'Personal Expenses', type: 'discretionary' },
  'GENERAL_MERCHANDISE.SPORTING_GOODS': { category: 'Fitness', type: 'discretionary' },

  // Travel
  'TRAVEL.LODGING': { category: 'Vacation', type: 'discretionary' },
  'TRAVEL.FLIGHTS': { category: 'Vacation', type: 'discretionary' },
  'TRAVEL.RENTAL_CARS': { category: 'Vacation', type: 'discretionary' },

  // Loan Payments
  'LOAN_PAYMENTS.CAR_PAYMENT': { category: 'Auto Loan', type: 'loan' },
  'LOAN_PAYMENTS.MORTGAGE_PAYMENT': { category: 'Home Mortgages', type: 'loan' },
  'LOAN_PAYMENTS.STUDENT_LOAN': { category: 'Student Loan', type: 'loan' },
  'LOAN_PAYMENTS.CREDIT_CARD_PAYMENT': { category: 'Credit Cards', type: 'loan' },

  // Government & Tax
  'GOVERNMENT_AND_NON_PROFIT.TAX_PAYMENT': { category: 'Property Taxes', type: 'essential' },
};

// Primary-only fallbacks (when detailed category doesn't match)
const primaryMap: Record<string, WklyMapping> = {
  'FOOD_AND_DRINK': { category: 'Groceries', type: 'essential' },
  'TRANSPORTATION': { category: 'Gas/Parking/Tolls', type: 'essential' },
  'RENT_AND_UTILITIES': { category: 'Rent', type: 'essential' },
  'INSURANCE': { category: 'Auto Insurance', type: 'essential' },
  'MEDICAL': { category: 'Medical', type: 'essential' },
  'HOME_IMPROVEMENT': { category: 'House Maintenance', type: 'discretionary' },
  'PERSONAL_CARE': { category: 'Personal Care', type: 'discretionary' },
  'ENTERTAINMENT': { category: 'Subscriptions', type: 'discretionary' },
  'RECREATION': { category: 'Family Activities', type: 'discretionary' },
  'GENERAL_MERCHANDISE': { category: 'Personal Expenses', type: 'discretionary' },
  'GENERAL_SERVICES': { category: 'Personal Expenses', type: 'discretionary' },
  'TRAVEL': { category: 'Vacation', type: 'discretionary' },
  'LOAN_PAYMENTS': { category: 'Auto Loan', type: 'loan' },
  'TRANSFER_IN': { category: 'Income', type: 'essential' },
  'TRANSFER_OUT': { category: 'Personal Expenses', type: 'discretionary' },
  'GOVERNMENT_AND_NON_PROFIT': { category: 'Property Taxes', type: 'essential' },
};

/**
 * Map a Plaid transaction category to a WKLY budget category.
 * Returns the best match or null if no mapping found.
 */
export function mapPlaidCategory(
  primaryCategory: string,
  detailedCategory?: string
): WklyMapping | null {
  // Try detailed match first
  if (detailedCategory) {
    const detailedKey = `${primaryCategory}.${detailedCategory}`;
    if (detailedMap[detailedKey]) {
      return detailedMap[detailedKey];
    }
  }

  // Fall back to primary
  if (primaryMap[primaryCategory]) {
    return primaryMap[primaryCategory];
  }

  return null;
}
