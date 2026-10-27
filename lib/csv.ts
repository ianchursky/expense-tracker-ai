import type { Expense } from "./types";

const HEADERS = ["Date", "Category", "Description", "Amount (USD)"];

function escapeCell(value: string): string {
  // Neutralize spreadsheet formula injection (cells starting with = + - @ tab or CR).
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function expensesToCSV(expenses: Expense[]): string {
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    escapeCell(e.description),
    e.amount.toFixed(2),
  ]);
  return [HEADERS, ...rows].map((row) => row.join(",")).join("\r\n");
}

export function downloadCSV(filename: string, csv: string): void {
  // BOM so Excel opens the file as UTF-8.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
