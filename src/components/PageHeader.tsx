"use client";

import * as React from "react";
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
        <div className="flex-1 flex justify-end">
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
