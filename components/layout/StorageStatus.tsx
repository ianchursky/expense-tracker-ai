"use client";

import { clsx } from "clsx";
import { HardDrive } from "lucide-react";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { formatBackupDate } from "@/lib/backup";

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/**
 * Where the data lives and how current the user's backup is. Local-first means the browser is the only
 * copy, so this is the app's standing privacy statement and its data-safety nudge in one place.
 */
export function StorageStatus({ variant }: { variant: "sidebar" | "inline" }) {
  const { expenses, isLoaded, lastBackup, changesSinceBackup } = useExpenses();
  const { exportAll } = useExpenseDialogs();
  if (!isLoaded) return null;

  const hasData = expenses.length > 0;
  const needsBackup = hasData && (!lastBackup || changesSinceBackup > 0);
  const backupText = !lastBackup
    ? "Not backed up yet"
    : changesSinceBackup > 0
      ? `Backed up ${formatBackupDate(lastBackup.at)} · ${plural(changesSinceBackup, "change")} since`
      : `Backed up ${formatBackupDate(lastBackup.at)}`;

  return (
    <section
      aria-label="Data storage"
      className={clsx(
        "text-sm",
        variant === "sidebar" ? "rounded-xl bg-slate-50 p-3" : "rounded-xl border border-slate-200 bg-white p-4",
      )}
    >
      <p className="flex items-center gap-2 font-medium text-slate-900">
        <HardDrive className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        Stored only in this browser
      </p>
      <p className="mt-1 text-xs leading-snug text-slate-600">
        No account, nothing uploaded. Clearing your browser data erases it, so keep a CSV backup.
      </p>
      {hasData && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-2.5">
          <p className="flex items-center gap-1.5 text-xs text-slate-700">
            <span
              className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", needsBackup ? "bg-amber-500" : "bg-slate-400")}
              aria-hidden
            />
            {backupText}
          </p>
          <button
            type="button"
            onClick={exportAll}
            className={clsx(
              "-mx-1 inline-flex items-center rounded-md px-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline",
              variant === "inline" ? "min-h-11" : "py-1",
            )}
          >
            Back up now
          </button>
        </div>
      )}
    </section>
  );
}
