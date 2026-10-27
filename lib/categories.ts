import {
  Car,
  Film,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "./types";

interface CategoryMeta {
  icon: LucideIcon;
  /** Hex color used by charts. */
  color: string;
  /** Tailwind classes for badges/icons. Must be literal strings so Tailwind can detect them. */
  badgeClass: string;
  iconClass: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Food: {
    icon: UtensilsCrossed,
    color: "#f97316",
    badgeClass: "bg-orange-50 text-orange-700 ring-orange-600/20",
    iconClass: "bg-orange-100 text-orange-600",
  },
  Transportation: {
    icon: Car,
    color: "#0ea5e9",
    badgeClass: "bg-sky-50 text-sky-700 ring-sky-600/20",
    iconClass: "bg-sky-100 text-sky-600",
  },
  Entertainment: {
    icon: Film,
    color: "#a855f7",
    badgeClass: "bg-purple-50 text-purple-700 ring-purple-600/20",
    iconClass: "bg-purple-100 text-purple-600",
  },
  Shopping: {
    icon: ShoppingBag,
    color: "#ec4899",
    badgeClass: "bg-pink-50 text-pink-700 ring-pink-600/20",
    iconClass: "bg-pink-100 text-pink-600",
  },
  Bills: {
    icon: Receipt,
    color: "#10b981",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  Other: {
    icon: MoreHorizontal,
    color: "#64748b",
    badgeClass: "bg-slate-50 text-slate-700 ring-slate-600/20",
    iconClass: "bg-slate-100 text-slate-600",
  },
};
