import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Utensils,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default function DiscretionaryExpensesScreen() {
  return (
    <div className="bg-background font-headline flex flex-col min-h-screen overflow-hidden max-w-md mx-auto shadow-2xl">
      <header className="shrink-0 z-10">
        <div className="flex items-center p-4 pb-2 justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/setup/loans">
              <ArrowLeft />
            </Link>
          </Button>
          <h2 className="text-foreground text-lg font-bold leading-tight flex-1 text-center pr-12">
            Discretionary Expenses
          </h2>
        </div>
        <div className="flex w-full flex-row items-center justify-center gap-3 py-3">
          <div className="h-2 w-2 rounded-full bg-border"></div>
          <div className="h-2 w-8 rounded-full bg-primary shadow-[0_0_10px_rgba(19,236,91,0.4)] transition-all duration-300"></div>
          <div className="h-2 w-2 rounded-full bg-border"></div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-48 relative">
        <div className="px-4 pt-2">
          <h2 className="text-foreground tracking-tight text-[28px] font-bold leading-tight text-left mb-2">
            Set Your Lifestyle Budget
          </h2>
          <p className="text-muted-foreground text-base font-normal leading-normal mb-6">
            Add flexible expenses like dining, shopping, or fun.
          </p>
        </div>
        <div className="flex flex-col gap-4 px-4">
          <div className="bg-card rounded-xl p-4 border shadow-sm relative group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center border border-transparent">
                  <Utensils />
                </div>
                <span className="text-foreground font-bold text-lg">
                  Dining Out
                </span>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-background rounded-lg px-3 py-2 border">
                <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                  Amount
                </label>
                <div className="flex items-center text-foreground">
                  <span className="mr-1 text-muted-foreground">$</span>
                  <span className="font-bold text-lg">200</span>
                </div>
              </div>
              <div className="relative bg-background rounded-lg px-3 py-2 border">
                <label className="block text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold">
                  Frequency
                </label>
                <div className="text-foreground font-bold text-base">
                  Monthly
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 w-full bg-card/85 backdrop-blur-xl border-t p-5 z-20 pb-8 shadow-up max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">
              Estimated Weekly Spend
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-primary tracking-tight">
                $68.75
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                / week
              </span>
            </div>
          </div>
        </div>
        <Button asChild className="w-full text-lg py-4 h-auto shadow-[0_4px_20px_rgba(19,236,91,0.3)]" size="lg">
          <Link href="/setup/savings">
            Save & Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
