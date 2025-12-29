
'use client';

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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
            <div className="w-10"></div>
        </header>
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
