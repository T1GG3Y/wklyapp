'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between font-body">
      <main className="flex-1 flex flex-col items-center justify-start p-6 pt-12">
        <h1 className="text-3xl font-bold text-foreground font-headline mb-8">
          Welcome
        </h1>

        <div className="w-full max-w-lg border border-border rounded-lg p-6 space-y-6 text-foreground text-sm leading-relaxed">
          <p>
            This budget app was developed for the purpose of helping a person/family
            become self-reliant and debt free including medical, auto and home.
            When a person reaches that point, the relaxation and freedom that you
            feel cannot be put into words. This does not come quickly but with
            diligence you will achieve it much younger in life.
          </p>

          <p>
            The foundation for accomplishing this is called active budgeting. Here you
            enter each income source and each expense category. This allows you to
            see where your money is really going. Where you are overspending you
            can reduce your budget and increase it where needed. When you enter
            an expense, you simply select its category from a drop down.
          </p>

          <p>
            This app also allows for basic budgeting. Enter your income sources and
            then a few basic expense categories like rent and car loan then use the
            miscellaneous category for the balance of your expenses. When you enter
            your expenses, everything will be identified as miscellaneous except for
            the few basic expense categories you have selected.
          </p>

          <p>
            Enjoy your journey towards debt-free living!
          </p>
        </div>
      </main>

      <footer className="p-6 pt-0">
        <Button
          asChild
          className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
          size="lg"
        >
          <Link href="/setup/start-day" className="flex items-center justify-center gap-2">
            Continue
            <span className="text-sm font-normal">to My Start Day</span>
            <ArrowRight className="ml-1 h-5 w-5" />
          </Link>
        </Button>
      </footer>
    </div>
  );
}
