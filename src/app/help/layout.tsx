
'use client';

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="bg-background text-foreground min-h-screen">
       <header className="px-4 py-3 flex items-center justify-between border-b sticky top-0 bg-card/90 backdrop-blur-sm z-10">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()}>
              <ArrowLeft className="text-muted-foreground" />
          </Button>
          <h1 className="text-lg font-bold font-headline text-foreground">
            Help & FAQ
          </h1>
          <div className="w-10"></div>
        </header>
      <div className="w-full bg-background min-h-screen flex flex-col relative">
        {children}
      </div>
    </div>
  );
}
