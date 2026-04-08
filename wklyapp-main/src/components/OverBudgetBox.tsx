"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface OverBudgetBoxProps {
  overBudgetAmount: number;
  label?: string;
  className?: string;
}

export function OverBudgetBox({
  overBudgetAmount,
  label = "Over Budget Total",
  className,
}: OverBudgetBoxProps) {
  const isOverBudget = overBudgetAmount > 0;

  return (
    <div
      className={cn(
        "rounded-xl p-4 border shadow-sm",
        isOverBudget
          ? "bg-destructive/10 border-destructive/30"
          : "bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOverBudget && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </h3>
        </div>
        <p
          className={cn(
            "text-xl font-bold",
            isOverBudget ? "text-destructive" : "text-foreground"
          )}
        >
          {formatCurrency(overBudgetAmount)}
        </p>
      </div>
    </div>
  );
}
