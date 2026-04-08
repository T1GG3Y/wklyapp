"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CategoryHealth {
  name: string;
  onBudgetAmount: number;
  overBudgetAmount: number;
}

interface HealthScoreCirclesProps {
  categories: CategoryHealth[];
  className?: string;
}

export function HealthScoreCircles({
  categories,
  className,
}: HealthScoreCirclesProps) {
  return (
    <div className={cn("bg-card rounded-xl p-4 border shadow-sm", className)}>
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-center mb-4">
        Health Score
      </h3>
      <div className="flex justify-around items-start gap-2">
        {categories.map((category) => {
          const isHealthy = category.overBudgetAmount <= 0;
          const total = category.onBudgetAmount + category.overBudgetAmount;
          const healthyPercent = total > 0 ? (category.onBudgetAmount / total) * 100 : 100;

          return (
            <div key={category.name} className="flex flex-col items-center gap-2">
              <HealthCircle
                healthyPercent={healthyPercent}
                isHealthy={isHealthy}
              />
              <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-16">
                {category.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HealthCircleProps {
  healthyPercent: number;
  isHealthy: boolean;
  size?: number;
}

function HealthCircle({ healthyPercent, isHealthy, size = 40 }: HealthCircleProps) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const greenOffset = circumference * (1 - healthyPercent / 100);

  if (isHealthy) {
    // All green - simple filled circle
    return (
      <div
        className="rounded-full bg-green-500"
        style={{ width: size, height: size }}
      />
    );
  }

  // Mixed or all red - use SVG pie
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Red background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(0, 62.8%, 50%)"
        strokeWidth={size / 2}
      />
      {/* Green portion */}
      {healthyPercent > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius / 2}
          fill="none"
          stroke="hsl(142, 76%, 45%)"
          strokeWidth={radius}
          strokeDasharray={circumference / 2}
          strokeDashoffset={(circumference / 2) * (1 - healthyPercent / 100)}
        />
      )}
    </svg>
  );
}

// Simplified version showing just green/red status
interface SimpleHealthCircleProps {
  isHealthy: boolean;
  size?: number;
}

export function SimpleHealthCircle({ isHealthy, size = 40 }: SimpleHealthCircleProps) {
  return (
    <div
      className={cn(
        "rounded-full",
        isHealthy ? "bg-green-500" : "bg-red-500"
      )}
      style={{ width: size, height: size }}
    />
  );
}
