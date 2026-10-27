"use client";

import { AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/format";
import type { Expense, ExpenseInput } from "@/lib/types";
import { useExpenses } from "./ExpenseProvider";
import { useToast } from "./ToastProvider";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

interface ExpenseDialogContextValue {
  openAdd: () => void;
  openEdit: (expense: Expense) => void;
  requestDelete: (expense: Expense) => void;
  confirm: (options: ConfirmOptions) => void;
}

const ExpenseDialogContext = createContext<ExpenseDialogContextValue | null>(null);

type FormState = { mode: "add" } | { mode: "edit"; expense: Expense } | null;

/** Owns the app-wide add/edit form and confirmation dialogs so any page or the navbar can open them. */
export function ExpenseDialogProvider({ children }: { children: ReactNode }) {
  const { addExpense, updateExpense, deleteExpense, restoreExpense } = useExpenses();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(null);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmOptions | null>(null);

  const closeForm = useCallback(() => setForm(null), []);
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
          if (removed) toast("Expense deleted.", "success", { label: "Undo", onClick: () => restoreExpense(removed) });
        },
      }),
    [deleteExpense, restoreExpense, toast],
  );

  const value = useMemo<ExpenseDialogContextValue>(
    () => ({
      openAdd: () => setForm({ mode: "add" }),
      openEdit: (expense) => setForm({ mode: "edit", expense }),
      requestDelete,
      confirm: setPendingConfirm,
    }),
    [requestDelete],
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

      <Modal open={pendingConfirm !== null} onClose={closeConfirm} title={pendingConfirm?.title ?? ""}>
        {pendingConfirm && (
          <div>
            <div className="flex gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" aria-hidden />
              <p>{pendingConfirm.message}</p>
            </div>
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
