"use client";

import { clsx } from "clsx";
import { LayoutDashboard, List, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { Button } from "@/components/ui/Button";
import { StorageStatus } from "./StorageStatus";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: List },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md text-[15px] font-semibold text-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Wallet className="h-4 w-4" aria-hidden />
      </span>
      Expense Tracker
    </Link>
  );
}

/** Desktop: fixed left sidebar. Mobile: top bar for identity plus a bottom tab bar with Add in the thumb zone. */
export function Navbar() {
  const isActive = useActive();
  const { openAdd } = useExpenseDialogs();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Wordmark />
        </div>
        <Button onClick={openAdd} className="mt-6 w-full">
          <Plus className="h-4 w-4" aria-hidden />
          Add expense
        </Button>
        <nav className="mt-6 flex flex-col gap-0.5" aria-label="Main">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className={clsx("h-4 w-4", active ? "text-brand-600" : "text-slate-500")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <StorageStatus variant="sidebar" />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Wordmark />
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {LINKS.slice(0, 1).map(({ href, label, icon: Icon }) => (
          <TabLink key={href} href={href} label={label} icon={Icon} active={isActive(href)} />
        ))}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={openAdd}
            aria-label="Add expense"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_4px_12px_rgba(21,128,61,0.35)] transition-colors hover:bg-brand-700"
          >
            <Plus className="h-6 w-6" aria-hidden />
          </button>
        </div>
        {LINKS.slice(1).map(({ href, label, icon: Icon }) => (
          <TabLink key={href} href={href} label={label} icon={Icon} active={isActive(href)} />
        ))}
      </nav>
    </>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof List;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex min-h-[56px] flex-col items-center justify-center gap-1 text-xs font-medium",
        active ? "text-brand-700" : "text-slate-500",
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </Link>
  );
}
