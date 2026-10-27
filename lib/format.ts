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

export function formatMonthKey(key: string, style: "short" | "long" = "short"): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: style,
    year: style === "long" ? "numeric" : "2-digit",
  });
}

export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
