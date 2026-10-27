"use client";

import { AlertTriangle, Check, Download } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ImportDialog } from "@/components/expenses/ImportDialog";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { downloadCSV, expensesToCSV } from "@/lib/csv";
import { formatCurrency, todayISO } from "@/lib/format";
import type { Expense, ExpenseInput } from "@/lib/types";
import { useExpenses } from "./ExpenseProvider";
import { useToast } from "./ToastProvider";

interface ConfirmOptions {
  title: string;
  message: string;
  /** Extra content between the warning and the buttons, e.g. a backup action. */
  body?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}

interface ExpenseDialogContextValue {
  openAdd: () => void;
  openEdit: (expense: Expense) => void;
  openImport: () => void;
  requestDelete: (expense: Expense) => void;
  requestDeleteAll: () => void;
  /** Downloads every expense as a CSV backup that Import can restore. */
  exportAll: () => void;
  confirm: (options: ConfirmOptions) => void;
}

const ExpenseDialogContext = createContext<ExpenseDialogContextValue | null>(null);

type FormState = { mode: "add" } | { mode: "edit"; expense: Expense } | null;

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** Inline "download a backup first" action shown inside the Delete all confirmation. */
function BackupFirst({ onExport, count }: { onExport: () => void; count: number }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
      <p className="text-slate-700">
        {done ? "Backup downloaded. You can restore it with Import CSV." : `Keep a copy of all ${plural(count, "expense")}.`}
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          onExport();
          setDone(true);
        }}
      >
        {done ? <Check className="h-4 w-4 text-brand-600" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
        {done ? "Downloaded" : "Download backup"}
      </Button>
    </div>
  );
}

/** Owns the app-wide add/edit, import, and confirmation dialogs so any page or the navbar can open them. */
export function ExpenseDialogProvider({ children }: { children: ReactNode }) {
  const { expenses, addExpense, updateExpense, deleteExpense, restoreExpenses, clearAll } = useExpenses();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmOptions | null>(null);

  const closeForm = useCallback(() => setForm(null), []);
  const closeImport = useCallback(() => setImportOpen(false), []);
  const closeConfirm = useCallback(() => setPendingConfirm(null), []);

  const handleSubmit = (input: ExpenseInput) => {
    if (form?.mode === "edit") {
      updateExpense(form.expense.id, input);
      toast("Expense updated.");
    } else {
      addExpense(input);
      toast(`Added ${formatCurrency(input.amount)} for ${input.description}.`);
    }
    setForm(null);
  };

  const requestDelete = useCallback(
    (expense: Expense) =>
      setPendingConfirm({
        title: "Delete expense?",
        message: `"${expense.description}" (${formatCurrency(expense.amount)}) will be removed.`,
        confirmLabel: "Delete",
        onConfirm: () => {
          const removed = deleteExpense(expense.id);
          if (removed) toast("Expense deleted.", "success", { label: "Undo", onClick: () => restoreExpenses([removed]) });
        },
      }),
    [deleteExpense, restoreExpenses, toast],
  );

  const exportAll = useCallback(() => {
    try {
      downloadCSV(`expenses-backup-${todayISO()}.csv`, expensesToCSV(expenses));
      toast(`Exported ${plural(expenses.length, "expense")} to CSV.`);
    } catch {
      toast("Export failed. Please try again.", "error");
    }
  }, [expenses, toast]);

  const requestDeleteAll = useCallback(
    () =>
      setPendingConfirm({
        title: "Delete all expenses?",
        message: `This removes all ${plural(expenses.length, "expense")} from this browser. They aren't stored anywhere else.`,
        body: <BackupFirst onExport={exportAll} count={expenses.length} />,
        confirmLabel: "Delete all",
        onConfirm: () => {
          const removed = clearAll();
          toast(`Deleted ${plural(removed.length, "expense")}.`, "success", {
            label: "Undo",
            onClick: () => restoreExpenses(removed),
          });
        },
      }),
    [clearAll, exportAll, expenses.length, restoreExpenses, toast],
  );

  const value = useMemo<ExpenseDialogContextValue>(
    () => ({
      openAdd: () => setForm({ mode: "add" }),
      openEdit: (expense) => setForm({ mode: "edit", expense }),
      openImport: () => setImportOpen(true),
      requestDelete,
      requestDeleteAll,
      exportAll,
      confirm: setPendingConfirm,
    }),
    [requestDelete, requestDeleteAll, exportAll],
  );

  return (
    <ExpenseDialogContext.Provider value={value}>
      {children}

      <Modal
        open={form !== null}
        onClose={closeForm}
        title={form?.mode === "edit" ? "Edit expense" : "Add expense"}
        description={form?.mode === "edit" ? "Update the details of this expense." : "Record a new expense."}
      >
        {form && (
          <ExpenseForm
            key={form.mode === "edit" ? form.expense.id : "new"}
            initial={form.mode === "edit" ? form.expense : undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            onDelete={
              form.mode === "edit"
                ? () => {
                    const { expense } = form;
                    setForm(null);
                    requestDelete(expense);
                  }
                : undefined
            }
          />
        )}
      </Modal>

      <Modal
        open={importOpen}
        onClose={closeImport}
        title="Import expenses"
        description="Restore a backup or bring in expenses from a spreadsheet."
      >
        {importOpen && <ImportDialog onClose={closeImport} />}
      </Modal>

      <Modal open={pendingConfirm !== null} onClose={closeConfirm} title={pendingConfirm?.title ?? ""}>
        {pendingConfirm && (
          <div>
            <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
              <p>{pendingConfirm.message}</p>
            </div>
            {pendingConfirm.body}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={closeConfirm} data-autofocus>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  pendingConfirm.onConfirm();
                  closeConfirm();
                }}
              >
                {pendingConfirm.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ExpenseDialogContext.Provider>
  );
}

export function useExpenseDialogs(): ExpenseDialogContextValue {
  const ctx = useContext(ExpenseDialogContext);
  if (!ctx) throw new Error("useExpenseDialogs must be used within ExpenseDialogProvider");
  return ctx;
}
