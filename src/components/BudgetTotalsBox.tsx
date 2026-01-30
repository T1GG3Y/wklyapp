"use client";

import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BudgetTotalsBoxProps {
  weeklyTotal: number;
  monthlyTotal?: number;
  yearlyTotal?: number;
  title?: string;
  className?: string;
}

export function BudgetTotalsBox({
  weeklyTotal,
  monthlyTotal,
  yearlyTotal,
  title = "Budget Totals",
  className,
}: BudgetTotalsBoxProps) {
  // Calculate monthly and yearly if not provided
  const monthly = monthlyTotal ?? weeklyTotal * 4.33;
  const yearly = yearlyTotal ?? weeklyTotal * 52;

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-4 border shadow-sm",
        className
      )}
    >
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Weekly</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(weeklyTotal)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Monthly</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(monthly)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Yearly</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(yearly)}
          </p>
        </div>
      </div>
    </div>
  );
}
