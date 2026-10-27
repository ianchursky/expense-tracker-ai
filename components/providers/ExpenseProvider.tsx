"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BACKUP_KEY, loadBackup, parseBackup, saveBackup, type BackupRecord } from "@/lib/backup";
import { createId, loadExpenses, parseStoredExpenses, saveExpenses, STORAGE_KEY } from "@/lib/storage";
import { generateSampleExpenses } from "@/lib/sampleData";
import type { Expense, ExpenseInput } from "@/lib/types";
import { useToast } from "./ToastProvider";

interface ExpenseContextValue {
  expenses: Expense[];
  /** False until localStorage has been read on the client. */
  isLoaded: boolean;
  storageError: string | null;
  addExpense: (input: ExpenseInput) => Expense;
  /** Adds generated demo expenses; returns how many were added. */
  loadSampleData: () => number;
  removeSampleData: () => number;
  hasSampleData: boolean;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => Expense | undefined;
  /** Puts previously removed expenses back (Undo). Ids already present are ignored. */
  restoreExpenses: (expenses: Expense[]) => void;
  /** Adds imported expenses. Returns them, or null when they could not be saved (nothing is changed then). */
  importExpenses: (inputs: ExpenseInput[]) => Expense[] | null;
  removeExpenses: (ids: string[]) => void;
  /** Deletes everything and returns what was removed, for Undo. */
  clearAll: () => Expense[];
  /** Last time every expense was exported to CSV, or null if never. */
  lastBackup: BackupRecord | null;
  /** Expenses added or edited since that backup (deletions aren't tracked). */
  changesSinceBackup: number;
  /** Record that all current expenses were just exported. */
  markBackedUp: () => void;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

// Sample expenses are marked by id prefix so they can be labeled and removed without changing the stored shape.
const SAMPLE_PREFIX = "sample-";
const isSample = (e: Expense) => e.id.startsWith(SAMPLE_PREFIX);

function buildExpense(input: ExpenseInput, idPrefix = ""): Expense {
  const now = new Date().toISOString();
  return { ...input, id: idPrefix + createId(), createdAt: now, updatedAt: now };
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<BackupRecord | null>(null);
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
    setLastBackup(loadBackup());
    setIsLoaded(true);
    if (!loadReported.current) {
      loadReported.current = true;
      if (result.error) toast(result.error, "error");
      else if (result.skipped > 0) toast(`${result.skipped} invalid saved record(s) were skipped.`, "info");
    }

    // Keep multiple open tabs in sync.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) replace(parseStoredExpenses(event.newValue).expenses);
      else if (event.key === BACKUP_KEY) setLastBackup(parseBackup(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [replace, toast]);

  /** Updates state and persists; returns the storage error message, if any. */
  const commit = useCallback(
    (next: Expense[]) => {
      replace(next);
      const error = saveExpenses(next);
      setStorageError(error);
      if (error) toast(error, "error");
      return error;
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

  const loadSampleData = useCallback(() => {
    const sample = generateSampleExpenses().map((input) => buildExpense(input, SAMPLE_PREFIX));
    commit([...sample, ...expensesRef.current]);
    return sample.length;
  }, [commit]);

  const removeSampleData = useCallback(() => {
    const kept = expensesRef.current.filter((e) => !isSample(e));
    const removed = expensesRef.current.length - kept.length;
    commit(kept);
    return removed;
  }, [commit]);

  const hasSampleData = useMemo(() => expenses.some(isSample), [expenses]);

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

  const restoreExpenses = useCallback(
    (restored: Expense[]) => {
      const present = new Set(expensesRef.current.map((e) => e.id));
      const missing = restored.filter((e) => !present.has(e.id));
      if (missing.length) commit([...missing, ...expensesRef.current]);
    },
    [commit],
  );

  const importExpenses = useCallback(
    (inputs: ExpenseInput[]) => {
      const previous = expensesRef.current;
      const imported = inputs.map((input) => buildExpense(input));
      if (commit([...imported, ...previous])) {
        // Storage rejected it (usually quota): roll back so the screen matches what will survive a reload.
        replace(previous);
        setStorageError(null);
        return null;
      }
      return imported;
    },
    [commit, replace],
  );

  const removeExpenses = useCallback(
    (ids: string[]) => {
      const drop = new Set(ids);
      commit(expensesRef.current.filter((e) => !drop.has(e.id)));
    },
    [commit],
  );

  const clearAll = useCallback(() => {
    const removed = expensesRef.current;
    commit([]);
    return removed;
  }, [commit]);

  const markBackedUp = useCallback(() => {
    const record = { at: new Date().toISOString(), count: expensesRef.current.length };
    saveBackup(record);
    setLastBackup(record);
  }, []);

  const changesSinceBackup = useMemo(
    () => (lastBackup ? expenses.filter((e) => e.updatedAt > lastBackup.at).length : expenses.length),
    [expenses, lastBackup],
  );

  const value = useMemo(
    () => ({
      expenses,
      isLoaded,
      storageError,
      addExpense,
      loadSampleData,
      removeSampleData,
      hasSampleData,
      updateExpense,
      deleteExpense,
      restoreExpenses,
      importExpenses,
      removeExpenses,
      clearAll,
      lastBackup,
      changesSinceBackup,
      markBackedUp,
    }),
    [
      expenses,
      isLoaded,
      storageError,
      addExpense,
      loadSampleData,
      removeSampleData,
      hasSampleData,
      updateExpense,
      deleteExpense,
      restoreExpenses,
      importExpenses,
      removeExpenses,
      clearAll,
      lastBackup,
      changesSinceBackup,
      markBackedUp,
    ],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider");
  return ctx;
}
