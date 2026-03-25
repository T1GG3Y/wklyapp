
'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HamburgerMenu } from "@/components/HamburgerMenu";

export default function ReportDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="w-full bg-background min-h-screen flex flex-col relative">
        <header className="px-4 py-3 flex items-center justify-between border-b sticky top-0 bg-background/90 backdrop-blur-sm z-20">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
                <ArrowLeft className="text-muted-foreground" />
            </Button>
            <h1 className="text-lg font-bold font-headline text-foreground">
              Weekly Report
            </h1>
            <div className="flex items-center gap-1">
              <Link
                href="/transaction/new"
                className="inline-flex items-center justify-center rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </Link>
              <HamburgerMenu />
            </div>
        </header>
        {children}
      </div>
    </div>
  );
}
