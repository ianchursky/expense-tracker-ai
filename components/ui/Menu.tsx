"use client";

import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type MenuEntry =
  | { label: string; icon?: LucideIcon; onSelect: () => void; danger?: boolean; disabled?: boolean }
  | "separator";

interface MenuProps {
  /** Contents of the trigger button. */
  trigger: ReactNode;
  /** Accessible name when the trigger has no visible text on some breakpoints. */
  label: string;
  items: MenuEntry[];
  triggerClassName?: string;
}

/** Dropdown action menu following the WAI-ARIA menu button pattern (arrows, Home/End, Esc, Tab). */
export function Menu({ trigger, label, items, triggerClassName }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const enabled = () => itemRefs.current.filter((el): el is HTMLButtonElement => !!el && !el.disabled);
  const focusItem = (index: number) => {
    const list = enabled();
    if (list.length) list[(index + list.length) % list.length].focus();
  };

  useEffect(() => {
    if (!open) return;
    itemRefs.current.find((el) => el && !el.disabled)?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const list = enabled();
    const current = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") focusItem(current + 1);
    else if (e.key === "ArrowUp") focusItem(current - 1);
    else if (e.key === "Home") focusItem(0);
    else if (e.key === "End") focusItem(list.length - 1);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return setOpen(false);
    else return;
    e.preventDefault();
  };

  let itemIndex = 0;
  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-30 mt-1.5 w-60 max-w-[calc(100vw-2rem)] animate-slide-in rounded-xl border border-slate-200 bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)] motion-reduce:animate-none"
        >
          {items.map((item, i) => {
            if (item === "separator") return <div key={`sep-${i}`} role="separator" className="my-1 h-px bg-slate-100" />;
            const index = itemIndex++;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className={clsx(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  item.danger
                    ? "text-red-700 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600"
                    : "text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600",
                )}
              >
                {Icon && <Icon className={clsx("h-4 w-4", item.danger ? "text-red-600" : "text-slate-500")} aria-hidden />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
