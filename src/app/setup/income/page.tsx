import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Calendar,
  Briefcase,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function IncomeScreen() {
  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl overflow-hidden bg-background">
      <header className="sticky top-0 z-50 flex items-center bg-background/95 backdrop-blur-md p-4 pb-2 justify-between border-b">
        <h2 className="text-foreground text-xl font-bold font-headline leading-tight flex-1">
          Income Setup
        </h2>
        <Button variant="link" asChild className="text-primary font-bold">
          <Link href="/setup/required-expenses">Done</Link>
        </Button>
      </header>
      <main className="flex-1 flex flex-col gap-6 p-4 pb-24">
        <section>
          <div className="flex flex-col gap-2 mb-4">
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
              Summary
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3 rounded-2xl p-5 bg-card shadow-sm border relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-primary h-5 w-5" />
                <p className="text-muted-foreground text-sm font-medium">
                  Total Weekly
                </p>
              </div>
              <p className="text-foreground text-2xl font-extrabold tabular-nums">
                $1,250.00
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl p-5 bg-card shadow-sm border relative overflow-hidden group">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary h-5 w-5" />
                <p className="text-muted-foreground text-sm font-medium">
                  Total Monthly
                </p>
              </div>
              <p className="text-foreground text-2xl font-extrabold tabular-nums">
                $5,416.00
              </p>
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
              Active Sources
            </p>
          </div>
          <div className="group flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-center rounded-xl bg-muted text-foreground shrink-0 size-12 border">
              <Briefcase />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-foreground text-base font-bold truncate">
                Software Engineer Salary
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium">
                  Bi-weekly
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-foreground text-base font-bold tabular-nums">
                $2,500.00
              </p>
            </div>
          </div>
        </section>
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none max-w-md mx-auto">
        <Button
          className="pointer-events-auto w-full h-14 text-base font-bold tracking-wide shadow-lg shadow-primary/20"
          size="lg"
        >
          <Plus className="mr-2 h-6 w-6" />
          Add New Income Source
        </Button>
      </div>
    </div>
  );
}
