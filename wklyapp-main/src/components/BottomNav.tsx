"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  User,
  Plus,
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
    <nav className="fixed bottom-4 left-4 right-4 z-30">
      <div className="glass rounded-3xl px-2 py-2 flex justify-around items-center max-w-md mx-auto">
        {navItems.slice(0, 2).map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200",
                isActive
                  ? "gradient-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {isActive && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          );
        })}

        <Link
          href="/transaction/new"
          className="gradient-primary rounded-full p-3 glow-gradient hover:opacity-90 transition-all duration-200 active:scale-95 -my-4"
        >
          <Plus className="h-6 w-6 text-white" />
        </Link>

        {navItems.slice(2).map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200",
                isActive
                  ? "gradient-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {isActive && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
