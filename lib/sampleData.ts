import { roundToCents, toISODate } from "./format";
import type { Category, ExpenseInput } from "./types";

const TEMPLATES: { category: Category; description: string; min: number; max: number; perMonth: number }[] = [
  { category: "Food", description: "Groceries", min: 45, max: 140, perMonth: 4 },
  { category: "Food", description: "Lunch with coworkers", min: 12, max: 28, perMonth: 3 },
  { category: "Food", description: "Coffee", min: 4, max: 7, perMonth: 4 },
  { category: "Transportation", description: "Gas", min: 35, max: 65, perMonth: 2 },
  { category: "Transportation", description: "Rideshare", min: 11, max: 32, perMonth: 1 },
  { category: "Entertainment", description: "Movie tickets", min: 18, max: 34, perMonth: 1 },
  { category: "Entertainment", description: "Streaming subscription", min: 15.99, max: 15.99, perMonth: 1 },
  { category: "Shopping", description: "Clothing", min: 30, max: 120, perMonth: 1 },
  { category: "Shopping", description: "Household supplies", min: 15, max: 60, perMonth: 1 },
  { category: "Bills", description: "Electricity bill", min: 70, max: 130, perMonth: 1 },
  { category: "Bills", description: "Internet", min: 64.99, max: 64.99, perMonth: 1 },
  { category: "Bills", description: "Phone plan", min: 45, max: 45, perMonth: 1 },
  { category: "Other", description: "Gift for a friend", min: 20, max: 75, perMonth: 0.5 },
];

/** Small deterministic PRNG so sample data looks the same every time it's loaded. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generates realistic expenses for the last `months` months, never dated after today. */
export function generateSampleExpenses(months = 6, now = new Date()): ExpenseInput[] {
  const random = mulberry32(42);
  const result: ExpenseInput[] = [];

  for (let offset = months - 1; offset >= 0; offset--) {
    const year = now.getFullYear();
    const month = now.getMonth() - offset;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = offset === 0 ? now.getDate() : daysInMonth;

    for (const t of TEMPLATES) {
      const whole = Math.floor(t.perMonth);
      const count = whole + (random() < t.perMonth - whole ? 1 : 0);
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(random() * lastDay);
        result.push({
          date: toISODate(new Date(year, month, day)),
          amount: roundToCents(t.min + random() * (t.max - t.min)),
          category: t.category,
          description: t.description,
        });
      }
    }
  }
  return result;
}
