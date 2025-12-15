import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CreditCard, Car, Check } from "lucide-react";
import Link from "next/link";

export default function LoansScreen() {
  return (
    <div className="bg-background font-headline antialiased min-h-screen flex flex-col overflow-x-hidden max-w-md mx-auto">
      <div className="sticky top-0 z-50 flex items-center bg-background p-4 pb-2 justify-between border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/setup/required-expenses">
            <ArrowLeft />
          </Link>
        </Button>
        <h2 className="text-foreground text-lg font-bold leading-tight flex-1 text-center pr-12">
          Add Loan
        </h2>
      </div>
      <main className="flex-1 flex flex-col p-4 w-full">
        <div className="mb-6 text-center">
          <h1 className="text-foreground tracking-tight text-[28px] font-bold leading-tight pb-2 pt-2">
            Let&apos;s track your debt
          </h1>
          <p className="text-muted-foreground text-base font-normal">
            Choose a category to get started.
          </p>
        </div>
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            <Button className="pl-3 pr-4 shadow-lg shadow-primary/20" size="lg">
              <CreditCard className="mr-2 h-5 w-5" />
              Credit Card
            </Button>
            <Button variant="outline" className="pl-3 pr-4" size="lg">
              <Car className="mr-2 h-5 w-5" />
              Auto
            </Button>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-2">
            Total Outstanding Balance
          </h2>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-3xl font-light">
              $
            </span>
            <Input
              className="w-full bg-card text-foreground text-[40px] font-bold py-6 pl-10 pr-4 rounded-xl border-2 border-transparent focus:border-primary h-auto shadow-sm"
              placeholder="0.00"
              type="text"
              defaultValue="4,250.00"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 mb-8">
          <div>
            <Label className="block text-muted-foreground text-sm font-medium mb-2">
              Loan Name
            </Label>
            <Input
              className="w-full bg-card text-foreground text-base py-3 px-4 rounded-lg border h-auto focus:border-primary"
              placeholder="e.g. Chase Sapphire"
              type="text"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-muted-foreground text-sm font-medium mb-2">
                Interest Rate (%)
              </Label>
              <div className="relative">
                <Input
                  className="w-full bg-card text-foreground text-base py-3 px-4 rounded-lg border h-auto focus:border-primary"
                  placeholder="0.0"
                  type="number"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
            </div>
            <div>
              <Label className="block text-muted-foreground text-sm font-medium mb-2">
                Frequency
              </Label>
              <Select defaultValue="monthly">
                <SelectTrigger className="w-full bg-card text-foreground text-base py-3 px-4 rounded-lg border h-auto focus:border-primary">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="sticky bottom-4 w-full mt-auto">
          <Button
            asChild
            className="w-full font-bold text-lg py-4 h-auto rounded-xl shadow-lg shadow-primary/20"
            size="lg"
          >
            <Link href="/setup/discretionary">
              Save Loan <Check className="ml-2 h-6 w-6" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
