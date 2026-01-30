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

// Essential Expense Categories (in order)
export const ESSENTIAL_CATEGORIES = [
  { name: 'Groceries', icon: 'ShoppingBasket' },
  { name: 'Rent/Mortgage', icon: 'Home' },
  { name: 'Natural Gas', icon: 'Flame' },
  { name: 'Electrical', icon: 'Lightbulb' },
  { name: 'Water/Sewer', icon: 'Droplet' },
  { name: 'Garbage', icon: 'Trash2' },
  { name: 'Phone', icon: 'Phone' },
  { name: 'Gas/Parking/Tolls', icon: 'Car' },
  { name: 'Auto Insurance', icon: 'Shield' },
  { name: 'Auto Maintenance', icon: 'Wrench' },
  { name: 'Auto Registration', icon: 'FileText' },
  { name: 'Medical', icon: 'Heart' },
  { name: 'Dental', icon: 'Smile' },
  { name: 'Miscellaneous', icon: 'MoreHorizontal' },
] as const;

// Discretionary Categories (in order)
export const DISCRETIONARY_CATEGORIES = [
  { name: 'Personal Care', icon: 'Sparkles' },
  { name: 'Apparel', icon: 'Shirt' },
  { name: 'House Maintenance', icon: 'Hammer' },
  { name: 'TV Service', icon: 'Tv' },
  { name: 'Internet', icon: 'Wifi' },
  { name: 'Children Activities', icon: 'Baby' },
  { name: 'Date Activities', icon: 'Heart' },
  { name: 'Family Activities', icon: 'Users' },
  { name: 'Vacation', icon: 'Plane' },
  { name: 'Fitness', icon: 'Dumbbell' },
  { name: 'Gifts', icon: 'Gift' },
  { name: 'Pets', icon: 'Dog' },
  { name: 'Subscriptions', icon: 'CreditCard' },
  { name: 'Personal Expenses', icon: 'User' },
  { name: 'Miscellaneous', icon: 'MoreHorizontal' },
] as const;

// Loan Categories
export const LOAN_CATEGORIES = [
  { name: 'Credit Cards', icon: 'CreditCard' },
  { name: 'Auto Loan', icon: 'Car' },
  { name: 'Home Mortgages', icon: 'Home' },
  { name: 'Student Loan', icon: 'GraduationCap' },
  { name: 'Miscellaneous', icon: 'MoreHorizontal' },
] as const;

// Savings Categories
export const SAVINGS_CATEGORIES = [
  { name: 'Emergency Fund', icon: 'ShieldAlert' },
  { name: 'House Purchase', icon: 'Home' },
  { name: 'Automobile', icon: 'Car' },
  { name: 'Vacation', icon: 'Plane' },
  { name: 'Recreation Equipment', icon: 'Bike' },
  { name: 'Education', icon: 'GraduationCap' },
  { name: 'Miscellaneous', icon: 'MoreHorizontal' },
  { name: 'Income Balance', icon: 'Wallet' },
] as const;

// Category Help Text
export const CATEGORY_HELP: Record<string, string> = {
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
  'Credit Cards': 'Visa, MasterCard, Discover, etc.',
  'Auto Loan': 'Cars, motorcycles, trailers, boats, etc.',
  'Home Mortgages': 'Primary residence, secondary residence, etc.',
  'Student Loan': 'Federal Loan, Private, Direct consolidation, etc.',

  // Savings
  'Emergency Fund': 'Savings for a dire time in life, typically 4 months of living expenses/budget.',
  'House Purchase': 'Down payment, closing costs, house renovation, etc.',
  'Automobile': 'New or used car, truck, motorcycle, etc.',
  'Recreation Equipment': 'Boat, dirt bike, surfboard, skis, fishing gear, etc.',
  'Education': 'College, Technical College, enhancement courses, etc.',
  'Income Balance': 'All income not designated in the budget.',

  // Generic (used by multiple categories)
  'Miscellaneous': 'List the item in the description.',
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
  savings: 'My Planned Savings Goals',
} as const;
