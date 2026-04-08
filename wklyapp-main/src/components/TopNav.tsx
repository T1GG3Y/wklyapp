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
  { href: "/transaction/new", icon: Plus, label: "Transaction" },
  { href: "/reports", icon: PieChart, label: "Report" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        const isTransaction = href === "/transaction/new";

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-200",
              isActive
                ? "gradient-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
              isTransaction && !isActive && "text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[9px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// Compact version for smaller screens
export function TopNavCompact() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-center p-1.5 rounded-lg transition-all duration-200",
              isActive
                ? "gradient-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Link>
        );
      })}
    </nav>
  );
}
