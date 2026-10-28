/** When the user last exported *all* expenses: the only copy of their data outside this browser. */
export interface BackupRecord {
  /** ISO timestamp of the export. */
  at: string;
  /** Number of expenses in that export. */
  count: number;
}

export const BACKUP_KEY = "expense-tracker:last-backup:v1";

export function parseBackup(raw: string | null): BackupRecord | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const { at, count } = value as Record<string, unknown>;
    if (typeof at !== "string" || Number.isNaN(Date.parse(at)) || typeof count !== "number") return null;
    return { at, count };
  } catch {
    return null;
  }
}

export function loadBackup(): BackupRecord | null {
  try {
    return parseBackup(window.localStorage.getItem(BACKUP_KEY));
  } catch {
    return null;
  }
}

export function saveBackup(record: BackupRecord): void {
  try {
    window.localStorage.setItem(BACKUP_KEY, JSON.stringify(record));
  } catch {
    // Non-critical: the status simply won't survive a reload.
  }
}

/** "today", "yesterday", or "Oct 12" ("Oct 12, 2025" in another year). */
export function formatBackupDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}
