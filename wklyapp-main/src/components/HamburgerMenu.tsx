"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Wallet,
  Home as HomeIcon,
  ShoppingBasket,
  Landmark,
  PiggyBank,
  LayoutDashboard,
  Plus,
  PieChart,
  User,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/income", icon: Wallet, label: "Income" },
  { href: "/essential-expenses", icon: HomeIcon, label: "Essential Expenses" },
  { href: "/discretionary-expenses", icon: ShoppingBasket, label: "Discretionary Expenses" },
  { href: "/loans", icon: Landmark, label: "Loans" },
  { href: "/savings-goals", icon: PiggyBank, label: "Savings Goals" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/transaction/new", icon: Plus, label: "Transactions" },
  { href: "/reports", icon: PieChart, label: "Reports" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function HamburgerMenu() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-muted transition-colors">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-left font-headline text-lg">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-2">
          {menuItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
