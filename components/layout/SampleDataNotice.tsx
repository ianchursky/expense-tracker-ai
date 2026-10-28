"use client";

import { FlaskConical } from "lucide-react";
import { useExpenseDialogs } from "@/components/providers/ExpenseDialogProvider";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { useToast } from "@/components/providers/ToastProvider";

/** Persistent label while generated demo expenses are in the list, so they are never mistaken for real data. */
export function SampleDataNotice() {
  const { hasSampleData, removeSampleData } = useExpenses();
  const { confirm } = useExpenseDialogs();
  const { toast } = useToast();
  if (!hasSampleData) return null;

  const handleRemove = () =>
    confirm({
      title: "Remove sample data?",
      message: "All generated sample expenses will be removed. Expenses you added yourself are kept.",
      confirmLabel: "Remove sample data",
      onConfirm: () => toast(`Removed ${removeSampleData()} sample expenses.`),
    });

  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:mb-6 sm:py-3">
      <FlaskConical className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-slate-700">
        <span className="font-medium text-slate-900">Sample data</span>
        <span className="hidden sm:inline">. These expenses were generated for this demo.</span>
      </p>
      <button
        type="button"
        onClick={handleRemove}
        className="shrink-0 rounded-md text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
      >
        Remove<span className="hidden sm:inline"> sample data</span>
      </button>
    </div>
  );
}
