"use client";

import * as React from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface HelpDialogProps {
  title: string;
  content: string;
  className?: string;
  iconClassName?: string;
}

export function HelpDialog({
  title,
  content,
  className,
  iconClassName,
}: HelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-full p-1 hover:bg-muted transition-colors",
            className
          )}
          aria-label={`Help: ${title}`}
        >
          <Info
            className={cn("h-4 w-4 text-muted-foreground", iconClassName)}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {content}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
