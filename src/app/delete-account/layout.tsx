
import { LineChart } from "lucide-react";
import Link from "next/link";

export default function DeleteAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col items-center p-4">
        <header className="py-8 w-full max-w-2xl">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <LineChart className="text-primary h-8 w-8" />
                <h1 className="text-2xl font-bold font-headline text-foreground">WKLY</h1>
            </Link>
        </header>
        <main className="w-full max-w-2xl">
            {children}
        </main>
    </div>
  );
}
