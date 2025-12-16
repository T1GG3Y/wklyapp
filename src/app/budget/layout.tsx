import { BottomNav } from "@/components/BottomNav";

export default function BudgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground min-h-screen flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen flex flex-col relative shadow-2xl">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
