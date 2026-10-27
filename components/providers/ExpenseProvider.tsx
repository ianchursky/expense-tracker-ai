"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createId, loadExpenses, parseStoredExpenses, saveExpenses, STORAGE_KEY } from "@/lib/storage";
import type { Expense, ExpenseInput } from "@/lib/types";
import { useToast } from "./ToastProvider";

interface ExpenseContextValue {
  expenses: Expense[];
  /** False until localStorage has been read on the client. */
  isLoaded: boolean;
  storageError: string | null;
  addExpense: (input: ExpenseInput) => Expense;
  addExpenses: (inputs: ExpenseInput[]) => void;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => Expense | undefined;
  restoreExpense: (expense: Expense) => void;
  clearAll: () => void;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

function buildExpense(input: ExpenseInput): Expense {
  const now = new Date().toISOString();
  return { ...input, id: createId(), createdAt: now, updatedAt: now };
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  // Mirror of state so mutations can compute the next list synchronously and persist it once.
  const expensesRef = useRef<Expense[]>([]);
  // StrictMode runs effects twice in development; only report load problems once.
  const loadReported = useRef(false);

  const replace = useCallback((next: Expense[]) => {
    expensesRef.current = next;
    setExpenses(next);
  }, []);

  useEffect(() => {
    const result = loadExpenses();
    replace(result.expenses);
    setStorageError(result.error ?? null);
    setIsLoaded(true);
    if (!loadReported.current) {
      loadReported.current = true;
      if (result.error) toast(result.error, "error");
      else if (result.skipped > 0) toast(`${result.skipped} invalid saved record(s) were skipped.`, "info");
    }

    // Keep multiple open tabs in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      replace(parseStoredExpenses(event.newValue).expenses);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [replace, toast]);

  const commit = useCallback(
    (next: Expense[]) => {
      replace(next);
      const error = saveExpenses(next);
      setStorageError(error);
      if (error) toast(error, "error");
    },
    [replace, toast],
  );

  const addExpense = useCallback(
    (input: ExpenseInput) => {
      const expense = buildExpense(input);
      commit([expense, ...expensesRef.current]);
      return expense;
    },
    [commit],
  );

  const addExpenses = useCallback(
    (inputs: ExpenseInput[]) => commit([...inputs.map(buildExpense), ...expensesRef.current]),
    [commit],
  );

  const updateExpense = useCallback(
    (id: string, input: ExpenseInput) =>
      commit(
        expensesRef.current.map((e) => (e.id === id ? { ...e, ...input, updatedAt: new Date().toISOString() } : e)),
      ),
    [commit],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const removed = expensesRef.current.find((e) => e.id === id);
      if (removed) commit(expensesRef.current.filter((e) => e.id !== id));
      return removed;
    },
    [commit],
  );

  const restoreExpense = useCallback(
    (expense: Expense) => {
      if (expensesRef.current.some((e) => e.id === expense.id)) return;
      commit([expense, ...expensesRef.current]);
    },
    [commit],
  );

  const clearAll = useCallback(() => commit([]), [commit]);

  const value = useMemo(
    () => ({
      expenses,
      isLoaded,
      storageError,
      addExpense,
      addExpenses,
      updateExpense,
      deleteExpense,
      restoreExpense,
      clearAll,
    }),
    [expenses, isLoaded, storageError, addExpense, addExpenses, updateExpense, deleteExpense, restoreExpense, clearAll],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider");
  return ctx;
}
