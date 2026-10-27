"use client";

import { AlertTriangle } from "lucide-react";
import { useExpenses } from "@/components/providers/ExpenseProvider";

/** Persistent banner shown while localStorage reads or writes are failing. */
export function StorageWarning() {
  const { storageError } = useExpenses();
  if (!storageError) return null;
  return (
    <div role="alert" className="mb-6 flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
      <p>{storageError}</p>
    </div>
  );
}
