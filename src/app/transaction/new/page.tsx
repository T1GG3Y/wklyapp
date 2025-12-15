import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, DollarSign } from "lucide-react";
import Link from "next/link";

export default function NewTransactionScreen() {
  return (
    <div className="bg-background text-foreground transition-colors duration-200 min-h-screen flex justify-center">
      <div className="w-full max-w-md bg-card shadow-xl min-h-screen flex flex-col relative overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b mt-8">
          <Button variant="ghost" size="icon" className="-ml-2" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="text-muted-foreground" />
            </Link>
          </Button>
          <h1 className="text-lg font-bold font-headline text-foreground">
            New Transaction
          </h1>
          <div className="w-10"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-6">
          <div className="space-y-3">
            <Label className="block text-sm font-semibold text-muted-foreground">
              Destination
            </Label>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full flex items-center justify-between p-3 rounded-lg bg-green-900/20 border-green-500/30 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="text-green-400" />
                  <span className="font-medium text-green-400">
                    Safe-to-Spend
                  </span>
                </div>
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="block text-sm font-semibold text-muted-foreground">
                Amount
              </Label>
              <div className="flex bg-muted rounded-lg p-1">
                <Button variant="ghost" className="px-3 py-1 text-xs font-medium rounded-md h-auto">
                  Income
                </Button>
                <Button className="px-3 py-1 text-xs font-medium rounded-md h-auto bg-secondary text-secondary-foreground shadow-sm">
                  Expense
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-secondary text-xl font-bold">$</span>
              </div>
              <Input
                className="block w-full pl-8 pr-3 py-3 rounded-lg bg-muted border-none text-xl font-medium text-foreground focus:ring-2 focus:ring-primary h-auto"
                placeholder="0.00"
                type="number"
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-card border-t p-5 pb-8 flex space-x-4 items-center">
          <Button variant="outline" className="flex-1 py-3 px-4 h-auto font-semibold rounded-xl">
            Create + New
          </Button>
          <Button
            asChild
            className="flex-none py-3 px-8 h-auto font-semibold rounded-xl shadow-md"
          >
            <Link href="/dashboard">Create</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
