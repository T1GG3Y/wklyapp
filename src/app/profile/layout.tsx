import { BottomNav } from "@/components/BottomNav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="w-full bg-background min-h-screen flex flex-col relative">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
