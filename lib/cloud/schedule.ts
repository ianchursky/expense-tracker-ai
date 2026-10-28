import type { Frequency, Schedule } from "./types";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The first run time strictly after `after` that matches the schedule's cadence. */
export function nextRunAt(schedule: Pick<Schedule, "frequency" | "hour" | "weekday" | "dayOfMonth">, after: Date): Date {
  const { frequency, hour, weekday, dayOfMonth } = schedule;
  const candidate = new Date(after.getFullYear(), after.getMonth(), after.getDate(), hour, 0, 0, 0);
  if (frequency === "daily") {
    if (candidate <= after) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }
  if (frequency === "weekly") {
    const ahead = (weekday - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + ahead);
    if (candidate <= after) candidate.setDate(candidate.getDate() + 7);
    return candidate;
  }
  candidate.setDate(dayOfMonth);
  if (candidate <= after) candidate.setMonth(candidate.getMonth() + 1, dayOfMonth);
  return candidate;
}

/** A schedule is due when its next run after the last run (or creation) has passed. */
export function isDue(schedule: Schedule, now: Date): boolean {
  if (!schedule.enabled) return false;
  const from = new Date(schedule.lastRunAt ?? schedule.createdAt);
  return nextRunAt(schedule, from) <= now;
}

export function describeCadence(schedule: Pick<Schedule, "frequency" | "hour" | "weekday" | "dayOfMonth">): string {
  const time = new Date(2000, 0, 1, schedule.hour).toLocaleTimeString("en-US", { hour: "numeric" });
  const labels: Record<Frequency, string> = {
    daily: `Every day at ${time}`,
    weekly: `Every ${WEEKDAYS[schedule.weekday]} at ${time}`,
    monthly: `Monthly on the ${ordinal(schedule.dayOfMonth)} at ${time}`,
  };
  return labels[schedule.frequency];
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}

/** "in 3 hours", "in 2 days", "5 minutes ago". */
export function relativeTime(target: Date, now = new Date()): string {
  const diff = target.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return diff >= 0 ? "in a moment" : "just now";
}
