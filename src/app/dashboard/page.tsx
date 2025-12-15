import { Button } from "@/components/ui/button";
import { Menu, Calendar, Receipt } from "lucide-react";
import Link from "next/link";

export default function DashboardScreen() {
  return (
    <>
      <header className="px-5 py-3 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-sm z-20 border-b">
        <Button variant="ghost" size="icon">
          <Menu className="text-muted-foreground" />
        </Button>
        <h1 className="text-lg font-bold font-headline tracking-tight text-foreground">
          Dashboard
        </h1>
        <Button variant="ghost" size="icon">
          <Calendar className="text-muted-foreground" />
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4 pt-2">
        <div className="bg-card rounded-2xl p-6 shadow-soft flex flex-col items-center relative">
          <div className="mt-4 mb-2 relative flex flex-col items-center justify-center">
            <div className="progress-circle">
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <div className="text-4xl font-bold text-primary tracking-tight font-headline">
                  $448.<span className="text-2xl align-top">87</span>
                </div>
                <div className="text-sm font-medium text-muted-foreground mt-1">
                  Safe-to-Spend
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="text-primary h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold font-headline text-foreground">
                Transactions
              </h2>
            </div>
          </div>
          <div className="flex flex-col items-center text-center py-4">
            <Button asChild className="w-full h-12 shadow-lg shadow-primary/25" size="lg">
              <Link href="/transaction/new">Add a transaction</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
