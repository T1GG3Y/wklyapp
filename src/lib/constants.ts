// WKLY App Constants
// Standardized values used across the application

// 8 Standardized Frequency Options
export const FREQUENCY_OPTIONS = [
  'Weekly',
  'Bi-Weekly',
  'Twice a month',
  'Monthly',
  'Quarterly',
  'Semi-Annual',
  'Yearly',
  'One time',
] as const;

export type Frequency = (typeof FREQUENCY_OPTIONS)[number];

// Income Categories (alphabetical, Custom last)
export const INCOME_CATEGORIES = [
  { name: 'Bank Transfer', icon: 'Landmark' },
  { name: 'Freelance', icon: 'Laptop' },
  { name: 'Gift', icon: 'Gift' },
  { name: 'Investment', icon: 'TrendingUp' },
  { name: 'Refund', icon: 'RotateCcw' },
  { name: 'Salary', icon: 'Briefcase' },
  { name: 'Side Work', icon: 'Hammer' },
  { name: 'Tips', icon: 'HandCoins' },
  { name: 'Custom', icon: 'MoreHorizontal' },
] as const;

// Essential Expense Categories (alphabetical, Custom last)
export const ESSENTIAL_CATEGORIES = [
  { name: 'Auto Insurance', icon: 'Shield' },
  { name: 'Auto Maintenance', icon: 'Wrench' },
  { name: 'Auto Registration', icon: 'FileText' },
  { name: 'Dental', icon: 'Smile' },
  { name: 'Electrical', icon: 'Lightbulb' },
  { name: 'Garbage', icon: 'Trash2' },
  { name: 'Gas/Parking/Tolls', icon: 'Car' },
  { name: 'Groceries', icon: 'ShoppingBasket' },
  { name: 'Home Insurance', icon: 'ShieldCheck' },
  { name: 'Medical', icon: 'Heart' },
  { name: 'Natural Gas', icon: 'Flame' },
  { name: 'Phone', icon: 'Phone' },
  { name: 'Property Taxes', icon: 'Receipt' },
  { name: 'Rent/Mortgage', icon: 'Home' },
  { name: 'Water/Sewer', icon: 'Droplet' },
  { name: 'Custom', icon: 'MoreHorizontal' },
] as const;

// Discretionary Categories (alphabetical, Custom last)
export const DISCRETIONARY_CATEGORIES = [
  { name: 'Apparel', icon: 'Shirt' },
  { name: 'Children Activities', icon: 'Baby' },
  { name: 'Date Activities', icon: 'Heart' },
  { name: 'Family Activities', icon: 'Users' },
  { name: 'Fitness', icon: 'Dumbbell' },
  { name: 'Gifts', icon: 'Gift' },
  { name: 'House Maintenance', icon: 'Hammer' },
  { name: 'Internet', icon: 'Wifi' },
  { name: 'Personal Care', icon: 'Sparkles' },
  { name: 'Personal Expenses', icon: 'User' },
  { name: 'Pets', icon: 'Dog' },
  { name: 'Subscriptions', icon: 'CreditCard' },
  { name: 'TV Service', icon: 'Tv' },
  { name: 'Vacation', icon: 'Plane' },
  { name: 'Custom', icon: 'MoreHorizontal' },
] as const;

// Loan Categories (alphabetical, Custom last)
export const LOAN_CATEGORIES = [
  { name: 'Auto Loan', icon: 'Car' },
  { name: 'Credit Cards', icon: 'CreditCard' },
  { name: 'Home Mortgages', icon: 'Home' },
  { name: 'Student Loan', icon: 'GraduationCap' },
  { name: 'Custom', icon: 'MoreHorizontal' },
] as const;

// Savings Categories (alphabetical, Custom and Income Balance last)
export const SAVINGS_CATEGORIES = [
  { name: 'Automobile', icon: 'Car' },
  { name: 'Education', icon: 'GraduationCap' },
  { name: 'Emergency Fund', icon: 'ShieldAlert' },
  { name: 'Real Estate Purchase', icon: 'Home' },
  { name: 'Recreation Equipment', icon: 'Bike' },
  { name: 'Vacation', icon: 'Plane' },
  { name: 'Custom', icon: 'MoreHorizontal' },
] as const;

// Category Help Text
export const CATEGORY_HELP: Record<string, string> = {
  // Income
  'Salary': 'Regular employment wages or salary.',
  'Tips': 'Tips, gratuities, and bonuses.',
  'Freelance': 'Freelance or contract work income.',
  'Side Work': 'Side jobs, gig work, odd jobs, etc.',
  'Bank Transfer': 'Transfers from savings, other accounts, etc.',
  'Investment': 'Dividends, interest, capital gains, etc.',
  'Refund': 'Tax refunds, rebates, reimbursements, etc.',
  'Gift': 'Monetary gifts received.',

  // Essential
  'Groceries': 'Food, soaps, toiletry etc.',
  'Rent/Mortgage': 'Mortgage payment, rent payment, insurance, taxes, etc.',
  'Natural Gas': 'Yearly total is best.',
  'Electrical': 'Yearly total is best.',
  'Water/Sewer': 'Yearly total is best.',
  'Garbage': 'Yearly total is best.',
  'Phone': 'Cell phone purchase, cell service, land line, etc.',
  'Gas/Parking/Tolls': 'Weekly average is best.',
  'Auto Insurance': 'Cars, motorcycles, trailers, boats, etc.',
  'Auto Maintenance': 'Services, parts, licensing, registration, etc. Yearly total is best.',
  'Auto Registration': 'Testing & government fees.',
  'Medical': 'Doctor, hospital, prescriptions, labs, insurance etc. Yearly total is best.',
  'Dental': 'Dentist, orthodontist, oral surgeon, etc. Yearly total is best.',
  'Home Insurance': 'Homeowners or renters insurance premiums.',
  'Property Taxes': 'Annual property tax payments on real estate.',

  // Discretionary
  'Personal Care': 'Haircuts, nails etc.',
  'Apparel': 'Clothes, shoes, belts, jewelry, purses, hats, etc.',
  'House Maintenance': 'Service or parts for heater, AC, plumbing, paint, carpet cleaning, etc. Yearly total is best.',
  'TV Service': 'Cable, streaming, etc.',
  'Internet': 'Monthly total is best.',
  'Children Activities': 'Sports, dance, singing, music, etc.',
  'Date Activities': 'With a spouse or friends at restaurants, shows, bowling, etc.',
  'Family Activities': 'With children, parents, cousins, etc.',
  'Vacation': 'Time away for day, weekends, week, etc.',
  'Fitness': 'Gym membership, equipment, classes, trainer, massage, etc.',
  'Gifts': 'Holidays, birthdays, friendship, etc.',
  'Pets': 'Food, vet, toys, training, original purchase, etc.',
  'Subscriptions': 'Memberships, software, subscription boxes, etc.',
  'Personal Expenses': 'Personal money that is yours to spend any way you want.',

  // Loans
  'Credit Cards': 'For unpaid credit cards that are no longer being used or the unpaid amount of active used credit cards that interest is being paid on. It is not the current purchases that are budgeted for under the Essential, Discretionary and Loan subcategories.',
  'Auto Loan': 'Cars, motorcycles, trailers, boats, etc.',
  'Home Mortgages': 'Primary residence, secondary residence, etc.',
  'Student Loan': 'Federal Loan, Private, Direct consolidation, etc.',

  // Savings
  'Emergency Fund': 'Savings for a dire time in life, typically 4 months of living expenses/budget.',
  'Real Estate Purchase': 'Down payment, closing costs, house renovation, etc.',
  'Automobile': 'New or used car, truck, motorcycle, etc.',
  'Recreation Equipment': 'Boat, dirt bike, surfboard, skis, fishing gear, etc.',
  'Education': 'College, Technical College, enhancement courses, etc.',
  'Income Balance': 'All income not designated in the budget.',

  // Generic (used by multiple categories)
  'Custom': 'Name and describe your custom item.',
};

// Page Help Text
export const PAGE_HELP = {
  income: 'Sources include employer, self-employed, Social Security, Pension, etc.',
  essentialExpenses: 'These are expenses required to sustain life.',
  discretionaryExpenses: 'These are expenses that make life nicer.',
  loans: 'This includes anything you have owing and are making payments on.',
  savings: 'Put money aside so you can pay cash and avoid paying interest.',
};

// Page Subheaders
export const PAGE_SUBHEADERS = {
  income: 'Add each income. This includes recurring and one time income.',
  essentialExpenses: 'Tap each category to add each expense. This week\'s balance will be added to next week.',
  discretionaryExpenses: 'Tap each category to add each expense. This week\'s balance will be added to next week.',
  loans: 'Tap each category to add each loan.',
  savings: 'Tap each category to add each savings goal. This week\'s balance will be added to next week.',
  budgetPlan: 'Click on the arrow to the right to open and edit each category.',
  transactions: 'Enter new transaction or search for transaction history.',
};

// Navigation Items
export const NAV_ITEMS = [
  { name: 'Home', icon: 'LayoutDashboard', path: '/dashboard' },
  { name: 'Budget', icon: 'Wallet', path: '/budget' },
  { name: 'Transaction', icon: 'Plus', path: '/transaction/new' },
  { name: 'Report', icon: 'PieChart', path: '/reports' },
  { name: 'Profile', icon: 'User', path: '/profile' },
] as const;

// Category type names (for display)
export const CATEGORY_TYPE_NAMES = {
  income: 'My Income',
  essential: 'My Essential Expenses',
  discretionary: 'My Discretionary Expenses',
  loans: 'My Loans',
  savings: 'My Savings Goals',
} as const;
