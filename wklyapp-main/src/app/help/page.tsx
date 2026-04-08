
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How is my 'Safe to Spend' amount calculated?",
    answer:
      "'Safe to Spend' is the money you have left after accounting for all your required expenses (like rent and bills) and planned discretionary spending (like groceries and dining out). It's calculated as: (Total Weekly Income) - (Total Weekly Required Expenses). Any amount you don't spend from this category rolls over to the next week.",
  },
  {
    question: "How is my 'Need to Spend' amount calculated?",
    answer:
      "'Need to Spend' represents your planned weekly budget for flexible, discretionary categories that you've set up, such as 'Groceries', 'Dining Out', or 'Shopping'. It's the total of all the weekly planned amounts you've assigned to your discretionary expense categories. Any unspent funds from this budget also roll over.",
  },
  {
    question: "What's the difference between 'Safe to Spend' and 'Need to Spend'?",
    answer:
      "'Need to Spend' is your *planned* budget for specific categories you want to track. 'Safe to Spend' is the *un-budgeted* money you have left over after all your income and planned expenses are accounted for. You can spend it on anything without affecting your specific budget categories.",
  },
  {
    question: "How do I edit my budget categories or amounts?",
    answer:
      "You can edit your income, expenses, loans, and savings goals at any time. Navigate to the 'Budget' tab using the bottom navigation bar. From there, you'll see your budget broken down into sections. Click the 'Edit' button within any section to add, remove, or update items.",
  },
  {
    question: "How do rollovers work?",
    answer:
      "At the end of your designated week, any unspent money from your 'Safe to Spend' and 'Need to Spend' totals is automatically carried over to the next week. This is shown on the dashboard to give you an accurate picture of your available funds.",
  },
  {
    question: "How can I delete my account and data?",
    answer:
      "We believe in giving you full control over your data. To permanently delete your account and all associated information, go to the 'Profile' tab, tap on 'Delete Account', and follow the on-screen instructions. This action is irreversible.",
  },
];


export default function HelpPage() {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <header className="px-5 py-4 flex items-center justify-center sticky top-0 glass z-20">
        <h1 className="text-xl font-bold font-headline tracking-tight text-foreground">
          Help & FAQ
        </h1>
      </header>
      <main className="px-4 pb-28 space-y-4 pt-4">
        <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="glass rounded-lg border px-4 mb-2 shadow-sm">
                    <AccordionTrigger className="text-left font-semibold text-foreground">
                        {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </main>
    </div>
  );
}
