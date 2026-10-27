const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatCompactCurrency(amount: number): string {
  return compactCurrencyFormatter.format(amount);
}

/** Parses a `YYYY-MM-DD` string as a local date (not UTC). */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a Date as a local `YYYY-MM-DD` string. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseISODate(value);
  return !Number.isNaN(date.getTime()) && toISODate(date) === value;
}

export function formatDate(value: string): string {
  return parseISODate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** `YYYY-MM` month key for a `YYYY-MM-DD` date. */
export function monthKey(value: string): string {
  return value.slice(0, 7);
}

/** "short" → "May" (chart ticks; the year lives in the tooltip), "long" → "May 2026". */
export function formatMonthKey(key: string, style: "short" | "long" = "short"): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(
    "en-US",
    style === "long" ? { month: "long", year: "numeric" } : { month: "short" },
  );
}

/** Compact inclusive range: "Sep 1–27" within one month, otherwise "Sep 28 – Oct 3". */
export function formatShortRange(startDate: string, endDate: string): string {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const month = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return start.getDate() === end.getDate()
      ? `${month(start)} ${start.getDate()}`
      : `${month(start)} ${start.getDate()}–${end.getDate()}`;
  }
  return `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}`;
}

export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
