"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { HelpDialog } from "@/components/HelpDialog";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  helpTitle?: string;
  helpContent?: string;
  subheader?: string;
  className?: string;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
}

export function PageHeader({
  title,
  helpTitle,
  helpContent,
  subheader,
  className,
  rightContent,
  leftContent,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "px-5 py-4 sticky top-0 glass z-20",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left content area */}
        <div className="flex-1 flex justify-start">
          {leftContent}
        </div>

        {/* Center title with optional help icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <h1 className="text-2xl font-black uppercase tracking-wide text-foreground text-center font-headline">
            {title}
          </h1>
          {helpContent && (
            <HelpDialog
              title={helpTitle || title}
              content={helpContent}
            />
          )}
        </div>

        {/* Right content area */}
        <div className="flex-1 flex justify-end items-center gap-1">
          <Link
            href="/transaction/new"
            className="inline-flex items-center justify-center rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </Link>
          {rightContent}
        </div>
      </div>

      {/* Optional subheader */}
      {subheader && (
        <p className="text-sm text-muted-foreground text-center mt-2">
          {subheader}
        </p>
      )}
    </header>
  );
}
