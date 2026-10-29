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
      {CATEGORY_META[category].label}
    </span>
  );
}
