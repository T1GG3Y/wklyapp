# Weekly Budget App - Review & Requirements (Version 2a)

Source: `Weekly Budget Review Version 2a.docx`

---

## General Items

### Sharing
- Allow more than one person to enter and modify transaction data.
- Allow more than one person to enter and modify the entire Budget Plan.
- Link the PC version of the budget to:
  - Android App
  - iPhone App

### Standardized Items
- **Roll-Over:** Automatically fund every sub-category weekly with the planned budget amount.
- **Carry Over:** Automatically transfer any remaining funds in every sub-category from week to week.
- **Sub-categories:**
  - Provide a way to add or subtract dollars for the current balance of every subcategory.
  - **Remove excess money:** Put it in the "Income Balance" savings category.
  - **Add money:** Take it from the "Income Balance" savings category if the money exists. If not, send a message "not available".
  - Allow user to create sub-categories within a category.
  - Allow each category to be selected more than once just like the loans. When a category is used for a second time or more, require the category to be filled in.
- When the dollar amount is changed, apply it forward. The past dollar amounts should remain as they were.
- When a new category is input and it is part of the way through the billing cycle, calculate how much should be applied to the category "Amount Available" and populate the category with those funds so when the first bill comes due the funds are available.

---

## Page-by-Page Requirements

### Create an Account Page
- Have the email verification send you to the Welcome page, and then that page to the My Start Day page.

### Login Page
- Change "Login to continue to your dashboard" to "Login to continue to your **Home Page**" (rename Dashboard to Home Page).

### Welcome Page
- See PowerPoint for design reference.
- Add this page as the first page a person goes to when they create a new account.
- Content: See the Welcome screen mockup (mission statement about debt-free living, active budgeting, basic budgeting explanation).

### My Start Day
- See PowerPoint for design reference.
- Add these words below "Pick a day to start your week":
  > The default is Sunday.
  > This allows you to align your budget and tracking with your personal schedule.
  > The selected day will be used to auto populate the new funds you have for that week.
  > Once this day is set it cannot be changed without starting a new budget. (let's discuss)

### Home (Dashboard)
- See PowerPoint for design reference.
- Insert the "My Budget Plan" section here.
- My Loans: change "total balance" to "Grand Total".
- My Planned Savings Goals: clarify what "$0.00 of $20.00" means.
- On the left-hand side of each row, put an edit symbol so a person does not have to click the down arrow.
- **My Health Score:**
  - **Total Weekly Budget Balance:** The amount available to spend without going over budget. Green if in budget, red if over budget.
  - **Total Weekly Income:** The budgeted weekly income.
  - **My Essential Expenses:** Indicator of any essential expenses over budget. Green = none over, Red = some over.
  - **My Discretionary Expenses:** Indicator of any discretionary expenses over budget. Green = none over, Red = some over.
  - **My Loans:** Indicator of any delinquent loans. Green = none delinquent, Red = some delinquent.
  - **My Savings Goals:** Indicator of whether on target or ahead for each savings goal. Green = on target, Red = behind.

### My Income
- See PowerPoint for design reference.
- FAQ: The information in the header should be a link that opens a dialog box (or some other way to provide the information under My Profile > FAQ > 10.h).

### My Essential Expenses
- See PowerPoint for design reference.
- **Show Totals:**
  - **Weekly Budget:** (Auto update) This is the budgeted amount.
  - **Amount Available:** (Auto update) This is the budgeted amount plus the carryover (negative or positive).
- **Edit button:** Opens Edit Box.
- **Due Date:** Use this to email/send message 5 days before bill is due if checkbox is selected. Create dialog box that states "check box to receive email message 5 days before bill is due."
- **Bug:** Due Date - selecting a day is not populating the box.
- **Bug:** Due date is not showing up.
- **Auto calculate:** Budget amount for a given category once there is enough history.

### My Discretionary Expenses
- See PowerPoint for design reference.
- **Show Totals:**
  - **Weekly Budget:** (Auto update) This is the budgeted amount.
  - **Amount Available:** (Auto update) This is the budgeted amount plus the carryover (negative or positive).
- **Edit button:** Opens Edit Box.
- **Due Date:** Use this to email/send message 5 days before bill is due if checkbox is selected. Create dialog box that states "check box to receive email message 5 days before bill is due."
- **Bug:** Due Date - selecting a day is not populating the box.
- **Auto calculate:** Budget amount for a given category once there is enough history. Create dialog box that states "This box can be used to predict your budget amount once there is enough historical data to draw from."

### My Loans
- See PowerPoint for design reference.
- **My Total Loans (summary):**
  - **Paid:** (Auto update) Grand total paid on all loans combined.
  - **Balance:** (Auto update) Grand total balance on all loans combined.
  - **Delinquent:** (Auto update) Grand total delinquency on all loans combined.
- **Individual Loans:**
  - **Paid:** (Auto update) Total paid on item.
  - **Balance:** (Auto update) Balance to be paid on item.
  - **Payoff date:** (Auto update) Date item will be paid off.
  - **Due Date:** Use this to email/send message 5 days before bill is due if checkbox is selected. Create dialog box that states "check box to receive email message 5 days before bill is due."

### My Planned Savings Goals
- See PowerPoint for design reference.
- **My Savings Goals (summary):**
  - **Saved:** (Auto update) Amount saved for item to date.
  - **Goal:** (Auto update) Goal amount set to save for item.
  - **Target Date:** (Auto update) Date the goal will be achieved.

### My Transactions
- Put Expense on the left and Income on the right. Expense will be used more often.
- Make Income the default setting.
- Have "Create" and "Create + New" the same color, different from the color scheme of income and expense. They are part of the defining criteria of the transaction. The create buttons are an action to submit the transaction.
- **Amount:** Auto-input the decimal into the amount.
- Only populate the categories that have been identified in the budget plan.
- **Transaction History:**
  - On the time dropdown, add 6 months and 12 months options.
  - Move the "Showing ___ transactions" text ahead of (above) the first transaction, so when there are transactions you don't have to scroll to the bottom. Consider "___ transactions identified" as alternative wording.
- **Splitting:** Provide ability to split transactions into different categories.
  - When the split button is selected, initiate a new pop-up window with the Receipt Amount populated and the first row displayed.
  - Enter the first amount, description, and category.
  - Auto populate a new row with the Amount field filled in with the remaining balance.
  - Enter the new Amount if it is not correct, description, and category.
  - Continue this process until the entire Receipt Amount Balance is accounted for.
- **Auto-populate expenses:** Provide a way to auto populate expenses such as rent or cable TV.
- **Bank Import:**
  - Should there be a button to initiate this or should it just be automatic?
  - Automatically categorize expenses from Bank.
  - Provide ability to change category of an expense.

### My Reports
- See PowerPoint for "Over Budget Table".
- Change header from "Weekly Report" to "My Reports".
- Delete "This Week's Report".

### My Profile
- Add the five quick links to the upper right corner of the header, the same as all the other pages.
- Add a back arrow at the left side of the header box.
- Change "Your Profile" to "MY PROFILE" using all caps and the same header font as all the other pages.
- Change "Your name" to "My name".
- Note the email as a profile item below the name.
- **Add Welcome link:** Takes you to the Welcome Page.
- **Add My Start Day link:** Takes you to the original start day screen.
- **Send Feedback:** Have feedback also go to the team (more than one person should receive it for reliability). Between the two of us.
- **Share Your Story Towards Debt Free Living:** Have this be an email or similar mechanism for review and posting for others to read.
- **FAQ Updates:**
  - Delete the double header of "Help & FAQ".
  - Delete "How is my safe to spend amount calculated?"
  - **Add:** "What happens to extra non-budgeted income?" Answer: "It drops into the My Planned Savings Goals category titled 'Income Balance'. This gives you a default savings that you can use as you desire."
  - Delete "How is my need to spend amount calculated?"
  - Delete "What is the difference between safe to spend and need to spend?"
  - **Update "How do rollovers work?"** Change to: "At the end of your designated week, any excess or shortage in the subcategory is automatically carried over to the next week. This is shown on the Planned Expenses of the subcategory, giving you an accurate picture of your available funds."
  - **Keep "Why use weekly budget?"** Answer: "The common concept of trying to pay different bills from different paychecks creates financial conflict and doesn't allow for efficient budgeting. Weekly Budget allows for level loading your expenses so the money is always there to pay your bills when they come due."
  - **Keep "I do not have a consistent income. How can I deal with that?"** Answer: "Variable income such as tips or commission jobs can create a problem for budgeting but there are a couple of ways to deal with it. This app allows for both: (1) Enter a foundational amount that you will consistently receive. As additional income is received enter it as a one-time income. (2) Another way is to have two checking accounts. In account 1 put all of your income as you receive it and then have a fixed auto deposit to account 2. Account 2 is the account that you live from. This does require you to have some reserve in account 1."
  - **Keep "With weekly budgeting how do I pay my monthly and semi-annual bills?"** Answer: "The category's Amount Available will build week by week until the payment is due. When the payment is made the Amount Available should return close to zero and you will begin building once again."
- **Privacy Policy:** Review source of privacy policy text. What about the PC application?
- **Delete Account:**
  - Does this send an email giving them a record that the deletion has taken place? (It should.)
  - Does the deletion process ask them to identify why they are leaving? Should include a very short form with multiple choice questions and a comment box at the end.
  - Does it send an email to the team letting them know of the deletion?

---

## Open Questions (Brian's Questions)

1. How will we deal with new software versions?
2. How will we deal with reviews?
3. When should we look at other currencies such as CAD and Euro? Should we provide a language setting which would take care of this?
4. How many years are we going to store data for?
5. Are we going to have ads to generate income? If so, it should be very minimal and only with the free version.
6. What server is this going to be running on?
7. What is an app versus a widget?
8. Can it sync with multiple devices?
9. When a start date is chosen can it be changed?
