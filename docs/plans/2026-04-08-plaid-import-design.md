# Plaid Bank Transaction Import — Design

## Decisions
- Import flow lives on Connected Accounts page
- On-demand sync only (user taps "Sync Transactions")
- Show all bank transactions, flag likely duplicates with warning badge
- Imported transactions become standard WKLY Expense docs (with plaidTransactionId)
- Static Plaid→WKLY category mapping, user can override before import
- Bank balance shown as separate item on Dashboard (additive, doesn't replace Account Summary)

## Category Mapping Table
| Plaid Category | WKLY Category | Type |
|---|---|---|
| FOOD_AND_DRINK.GROCERIES | Groceries | Essential |
| FOOD_AND_DRINK.RESTAURANTS | Dining Out | Discretionary |
| FOOD_AND_DRINK.COFFEE | Dining Out | Discretionary |
| TRANSPORTATION.GAS | Gas/Parking/Tolls | Essential |
| TRANSPORTATION.PARKING | Gas/Parking/Tolls | Essential |
| TRANSPORTATION.TOLLS | Gas/Parking/Tolls | Essential |
| RENT_AND_UTILITIES.RENT | Rent | Essential |
| RENT_AND_UTILITIES.ELECTRIC | Electrical | Essential |
| RENT_AND_UTILITIES.GAS | Natural Gas | Essential |
| RENT_AND_UTILITIES.WATER | Water/Sewer | Essential |
| RENT_AND_UTILITIES.TELEPHONE | Phone | Essential |
| RENT_AND_UTILITIES.INTERNET | Internet | Discretionary |
| RENT_AND_UTILITIES.TRASH | Garbage | Essential |
| HOME_IMPROVEMENT | House Maintenance | Discretionary |
| PERSONAL_CARE | Personal Care | Discretionary |
| MEDICAL.DENTAL | Dental | Essential |
| MEDICAL | Medical | Essential |
| INSURANCE.AUTO | Auto Insurance | Essential |
| INSURANCE.HOME | Home Insurance | Essential |
| ENTERTAINMENT.SUBSCRIPTION | Subscriptions | Discretionary |
| ENTERTAINMENT.TV | TV Service | Discretionary |
| ENTERTAINMENT.FITNESS | Fitness | Discretionary |
| GENERAL_MERCHANDISE.CLOTHING | Apparel | Discretionary |
| GENERAL_MERCHANDISE.PET | Pets | Discretionary |
| GENERAL_MERCHANDISE.GIFTS | Gifts | Discretionary |
| TRAVEL.VACATION | Vacation | Discretionary |
| LOAN_PAYMENTS.CAR | Auto Loan | Loan |
| LOAN_PAYMENTS.MORTGAGE | Home Mortgages | Loan |
| LOAN_PAYMENTS.STUDENT | Student Loan | Loan |
| LOAN_PAYMENTS.CREDIT_CARD | Credit Cards | Loan |

## Duplicate Detection
- Match existing WKLY transactions by: same amount (±$0.01) AND same date (±1 day)
- Flag matches with warning badge, don't hide them
- User decides to skip or import

## Data Flow
1. User taps "Sync Transactions" → calls /api/plaid/transactions
2. API returns bank transactions for last 30 days
3. Client checks each against existing WKLY transactions for duplicates
4. User reviews list: each row shows merchant, amount, date, suggested category, duplicate warning
5. User can change category via dropdown, then tap checkmark to import or X to skip
6. Import creates standard Firestore doc: { type: 'Expense', amount, category, date, description, plaidTransactionId, userProfileId }
7. Transaction appears in WKLY Transaction History and affects Available balance normally

## Dashboard Bank Balance
- New section below Account Summary circles
- Fetches /api/plaid/balances on dashboard load (only if user has connected accounts)
- Shows checking account balance with bank name and last 4 digits
