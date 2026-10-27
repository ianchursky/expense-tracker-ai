import { clsx } from "clsx";
import { CATEGORY_META } from "@/lib/categories";
import type { Category } from "@/lib/types";

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        CATEGORY_META[category].badgeClass,
      )}
    >
      {category}
    </span>
  );
}

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const { icon: Icon, iconClass } = CATEGORY_META[category];
  return (
    <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconClass, className)}>
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}
