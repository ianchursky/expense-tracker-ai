"use client";

import { clsx } from "clsx";
import { LayoutDashboard, List, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { Button } from "@/components/ui/Button";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: List },
];

export function Navbar() {
  const pathname = usePathname();
  const { openAdd } = useExpenseDialogs();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Wallet className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">Expense Tracker</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <Button onClick={openAdd} className="ml-auto" aria-label="Add expense">
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Add expense</span>
        </Button>
      </div>
    </header>
  );
}
