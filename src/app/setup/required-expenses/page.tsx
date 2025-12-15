import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  TrendingUp,
  Home,
  Utensils,
  CalendarMonth,
  Droplet,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";

export default function RequiredExpensesScreen() {
  return (
    <div className="bg-background font-headline min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md h-full min-h-screen bg-background flex flex-col shadow-2xl overflow-hidden relative">
        <header className="flex items-center justify-between p-4 pb-2 z-10 bg-background">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/setup/income">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-foreground text-lg font-bold leading-tight flex-1 text-center pr-12">
            Required Expenses
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="px-4 py-2 sticky top-0 z-20 bg-background/95 backdrop-blur-md">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card shadow-lg border relative overflow-hidden group">
              <div className="relative z-10 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                    Weekly Cost Breakdown
                  </p>
                  <p className="text-foreground text-3xl font-bold leading-tight tracking-tight">
                    $345.50
                  </p>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="text-primary" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 p-4">
            <div>
              <h2 className="text-foreground text-base font-bold leading-tight px-1 mb-3">
                Category
              </h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x">
                <Button className="snap-start shrink-0 pl-3 pr-4 shadow-md shadow-primary/20" size="lg">
                  <Home className="mr-2 h-5 w-5" />
                  Housing
                </Button>
                <Button variant="outline" className="snap-start shrink-0 pl-3 pr-4" size="lg">
                  <Utensils className="mr-2 h-5 w-5 text-muted-foreground" />
                  Food
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-foreground text-base font-bold px-1"
                htmlFor="amount"
              >
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                  $
                </span>
                <Input
                  className="w-full rounded-xl bg-input border text-foreground text-2xl font-bold py-4 pl-8 pr-4 h-auto focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
                  id="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  type="number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-foreground text-base font-bold px-1">
                  Frequency
                </label>
                <Select defaultValue="monthly">
                  <SelectTrigger className="w-full rounded-xl bg-input border text-foreground py-4 h-auto">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-foreground text-base font-bold px-1">
                  Due Date
                </label>
                <Button variant="outline" className="flex items-center justify-between w-full rounded-xl bg-input border text-muted-foreground py-4 h-auto hover:bg-accent group">
                  <span className="text-base truncate">Select Date</span>
                  <CalendarMonth className="text-muted-foreground group-hover:text-primary transition-colors" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-foreground text-base font-bold">
                  Added Items
                </h2>
              </div>
              <div className="flex items-center gap-4 bg-card p-3 rounded-xl border">
                <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Droplet className="text-blue-400 h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-bold truncate">
                    Water Bill
                  </p>
                  <p className="text-muted-foreground text-xs truncate">
                    Monthly • Due 15th
                  </p>
                </div>
                <p className="text-foreground font-bold text-base">$45.50</p>
              </div>
            </div>
          </div>
        </main>
        <div className="p-4 bg-background/95 backdrop-blur-md border-t absolute bottom-0 w-full z-30">
          <Button asChild className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20">
            <Link href="/setup/loans">
              <PlusCircle className="mr-2" /> Add Expense
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
