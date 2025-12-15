"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  User,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/budget", icon: Wallet, label: "Budget" },
  { href: "/reports", icon: PieChart, label: "Reports" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-card/80 backdrop-blur-lg border-t border-border pb-6 pt-3 px-6 flex justify-around items-center z-30">
      {navItems.slice(0, 2).map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 text-muted-foreground transition-colors w-16",
              isActive ? "text-primary" : "hover:text-foreground"
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}

      <Link href="/transaction/new">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground -mt-10 shadow-lg shadow-primary/40 border-4 border-background">
          <PlusCircle size={32} />
        </div>
      </Link>

      {navItems.slice(2).map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 text-muted-foreground transition-colors w-16",
              isActive ? "text-primary" : "hover:text-foreground"
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
