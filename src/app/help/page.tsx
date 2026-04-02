'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from '@/components/PageHeader';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: "Why use Weekly Budget?",
    answer:
      "The common concept of trying to pay different bills from different paychecks creates financial conflict and doesn't allow for efficient budgeting. Weekly Budget allows you to level load your expenses so the money is always there to pay your bills when they come due.",
  },
  {
    question: "What happens to extra non-budgeted income?",
    answer:
      'It drops into the My Savings Goals category titled "Unassigned Income". This gives you a default savings that you can use as you desire.',
  },
  {
    question: "How do I edit my budget categories or amounts?",
    answer:
      "You can edit your income, expenses, loans, and savings goals at any time. Navigate to the page using the hamburger menu or header arrows. Click the edit icon within any item to update it, or use 'Add New' to create a new entry.",
  },
  {
    question: "How do rollovers work?",
    answer:
      "At the end of your designated week, any excess or shortage in the subcategory is automatically carried over to the next week. This is shown on the Planned Expenses of the subcategory, giving you an accurate picture of your available funds.",
  },
  {
    question: "With weekly budgeting how do I pay my monthly and semi-annual bills?",
    answer:
      "The category's Amount Available will build week by week until the payment is due. When the payment is made the Amount Available should return close to zero and you will begin building for the next payment.",
  },
  {
    question: "How can I deal with not having a consistent income?",
    answer:
      "Variable income such as tips or commission jobs can create a problem for budgeting but there are a couple of ways to deal with it. This app allows for both.\n\n1. Enter your lowest monthly income. As additional income is received enter it into My Income as a one-time income in the Frequency. It will drop into My Savings under Unassigned Income.\n\n2. Have two checking accounts. In account 2 put all of your income as you receive it and then have a fixed auto deposit to account 1. This can be calculated by taking the last 12 months and dividing by 12. Account 1 is the account that you live on using this WeeklyBudget app. This does require you to have some reserve in account 2, to account for months with little income. (No cheating taking money out of account 2 to spend on things not budgeted for!) If account 2 ends up with additional funds put it in the app as a one-time income and designate where you want it to go in savings. For further support on this Send Feedback under My Profile.",
  },
  {
    question: "Do I add additional funds to a category one time?",
    answer:
      'Go to My Transactions and under Move you can enter the amount you want to move, from what category, and to what category. Usually you will be moving funds from the My Savings category of Unassigned Income.',
  },
  {
    question: "How can I delete my account and data?",
    answer:
      "We believe in giving you full control over your data. To permanently delete your account and all associated information, go to My Profile, tap on 'Delete Account', and follow the on-screen instructions. This action is irreversible.",
  },
];


export default function HelpPage() {
  return (
    <div className="bg-background font-headline flex flex-col min-h-screen overflow-hidden">
      <PageHeader
        title="HELP & FAQ"
        rightContent={<HamburgerMenu />}
        leftContent={
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4" />
              Profile
            </Link>
          </Button>
        }
      />
      <main className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 pt-4">
        <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="glass rounded-lg border px-4 mb-2 shadow-sm">
                    <AccordionTrigger className="text-left font-semibold text-foreground">
                        {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {faq.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </main>
    </div>
  );
}
