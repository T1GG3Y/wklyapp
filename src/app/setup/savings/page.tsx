import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Car, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PlannedSavingsScreen() {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-background z-20 shrink-0">
        <Button variant="link" asChild>
          <Link href="/setup/discretionary">Cancel</Link>
        </Button>
        <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
          New Goal
        </h1>
        <Button variant="link" asChild className="text-primary font-bold">
          <Link href="/weekly-summary">Save</Link>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar">
        <section className="pt-4 pb-6">
          <h2 className="px-4 text-2xl font-bold font-headline tracking-tight mb-4 text-foreground">
            What are you saving for?
          </h2>
          <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2">
            <Button
              className="group shrink-0 rounded-full pl-3 pr-5 shadow-lg shadow-primary/20"
              size="lg"
            >
              <Plane className="mr-2 h-5 w-5" />
              <span className="text-sm font-bold">Vacation</span>
            </Button>
            <Button
              variant="outline"
              className="group shrink-0 rounded-full pl-3 pr-5"
              size="lg"
            >
              <Car className="mr-2 h-5 w-5" />
              <span className="text-sm font-medium">Car</span>
            </Button>
          </div>
        </section>
        <section className="px-4 space-y-6">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-sm font-medium ml-1">
              Goal Name
            </Label>
            <Input
              className="w-full bg-card border rounded-xl h-14 px-4 text-base font-medium placeholder:text-muted-foreground/50 focus:border-primary text-foreground"
              type="text"
              defaultValue="Summer Roadtrip"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-sm font-medium ml-1">
              Target Amount
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-2xl font-bold">
                $
              </div>
              <Input
                className="w-full bg-card border rounded-xl h-20 pl-10 pr-4 text-4xl font-bold placeholder:text-muted-foreground/30 focus:border-primary text-foreground"
                inputMode="decimal"
                placeholder="0.00"
                type="number"
                defaultValue="5000"
              />
            </div>
          </div>
        </section>
      </main>
      <footer className="fixed bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pb-8 pt-6 px-4 z-20 pointer-events-none max-w-md mx-auto left-0 right-0">
        <Button
          asChild
          className="w-full pointer-events-auto h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50"
          size="lg"
        >
          <Link href="/weekly-summary">
            Create Goal <ArrowRight className="ml-2 h-6 w-6" />
          </Link>
        </Button>
      </footer>
    </div>
  );
}
