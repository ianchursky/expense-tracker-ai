import { toISODate } from "./format";
import { CATEGORIES, type Category, type Expense, type ExpenseInput } from "./types";
import { toExpenseInput, validateExpenseForm } from "./validation";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 20_000;

export interface ImportRowError {
  /** 1-based line number in the file, counting the header as line 1. */
  line: number;
  message: string;
}

export interface ImportPreview {
  /** Valid rows that are not already in the app. */
  rows: ExpenseInput[];
  /** Valid rows matching an expense already in the app (each existing expense matches at most one row). */
  duplicates: ExpenseInput[];
  errors: ImportRowError[];
  /** Data rows in the file, excluding the header and blank lines. */
  total: number;
}

/** Thrown for problems with the file as a whole (wrong columns, too big, not a CSV). */
export class ImportFileError extends Error {}

/** RFC 4180 parser: quoted fields may contain commas, newlines and doubled quotes. Returns rows with their start line. */
export function parseCSV(text: string): { cells: string[]; line: number }[] {
  const rows: { cells: string[]; line: number }[] = [];
  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let rowStart = 1;

  const endRow = () => {
    cells.push(field);
    if (cells.some((c) => c.trim() !== "")) rows.push({ cells, line: rowStart });
    cells = [];
    field = "";
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === "\n") line++;
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
      line++;
      rowStart = line;
    } else {
      field += ch;
    }
  }
  if (inQuotes) throw new ImportFileError(`A quoted value starting on line ${rowStart} is never closed.`);
  if (field !== "" || cells.length > 0) endRow();
  return rows;
}

const COLUMN_ALIASES: Record<"date" | "category" | "description" | "amount", RegExp> = {
  date: /^date$/,
  category: /^category$/,
  description: /^(description|note|notes|memo)$/,
  amount: /^amount( \(usd\))?$/,
};

function findColumns(header: string[]) {
  const normalized = header.map((h) => h.trim().toLowerCase());
  const columns = {} as Record<keyof typeof COLUMN_ALIASES, number>;
  const missing: string[] = [];
  for (const [key, pattern] of Object.entries(COLUMN_ALIASES) as [keyof typeof COLUMN_ALIASES, RegExp][]) {
    const index = normalized.findIndex((h) => pattern.test(h));
    if (index === -1) missing.push(key[0].toUpperCase() + key.slice(1));
    columns[key] = index;
  }
  if (missing.length) {
    throw new ImportFileError(
      `Missing ${missing.join(", ")} column${missing.length > 1 ? "s" : ""}. Expected a header row with Date, Category, Description and Amount, like the files this app exports.`,
    );
  }
  return columns;
}

/** Accepts the exported YYYY-MM-DD, plus M/D/YYYY because spreadsheet apps often rewrite dates on save. */
function normalizeDate(value: string): string {
  const v = value.trim();
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  if (us) {
    const [, m, d, y] = us.map(Number);
    const date = new Date(y, m - 1, d);
    // Reject rollovers like 2/30 rather than silently shifting them.
    return date.getMonth() === m - 1 && date.getDate() === d ? toISODate(date) : v;
  }
  return v;
}

/** Strips "$", thousands separators and spaces; keeps anything else so validation can report it. */
function normalizeAmount(value: string): string {
  return value.trim().replace(/^\$/, "").replace(/,/g, "").replace(/\s/g, "");
}

/** Undoes the export's formula-injection guard: a leading apostrophe before = + - @. */
function normalizeDescription(value: string): string {
  return /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}

function matchCategory(value: string): Category | undefined {
  const v = value.trim().toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase() === v);
}

export const expenseKey = (e: ExpenseInput) =>
  `${e.date}|${e.amount.toFixed(2)}|${e.category}|${e.description.trim().toLowerCase()}`;

/**
 * Validates a CSV file's text against the same rules as the add-expense form.
 * Bad rows are reported, not fatal; whole-file problems throw ImportFileError.
 */
export function previewImport(text: string, existing: Expense[]): ImportPreview {
  const parsed = parseCSV(text.replace(/^﻿/, ""));
  if (parsed.length === 0) throw new ImportFileError("The file is empty.");

  const [header, ...dataRows] = parsed;
  const columns = findColumns(header.cells);
  if (dataRows.length === 0) throw new ImportFileError("The file has a header row but no expenses.");
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new ImportFileError(`The file has ${dataRows.length.toLocaleString()} rows; the limit is ${MAX_IMPORT_ROWS.toLocaleString()}.`);
  }

  // Count-based so a backup restored into the same data matches one-for-one, while identical
  // rows inside the file (two $5 coffees on one day) are still imported.
  const existingCounts = new Map<string, number>();
  for (const e of existing) existingCounts.set(expenseKey(e), (existingCounts.get(expenseKey(e)) ?? 0) + 1);
  const rows: ExpenseInput[] = [];
  const errors: ImportRowError[] = [];
  const duplicates: ExpenseInput[] = [];

  for (const { cells, line } of dataRows) {
    const cell = (i: number) => cells[i] ?? "";
    const rawCategory = cell(columns.category).trim();
    const category = matchCategory(rawCategory);
    if (rawCategory && !category) {
      errors.push({ line, message: `Unknown category "${rawCategory}". Use one of: ${CATEGORIES.join(", ")}.` });
      continue;
    }

    const values = {
      date: normalizeDate(cell(columns.date)),
      amount: normalizeAmount(cell(columns.amount)),
      category: category ?? ("" as const),
      description: normalizeDescription(cell(columns.description)),
    };
    const fieldErrors = validateExpenseForm(values);
    const firstError = fieldErrors.date ?? fieldErrors.amount ?? fieldErrors.category ?? fieldErrors.description;
    if (firstError) {
      errors.push({ line, message: firstError });
      continue;
    }

    const input = toExpenseInput(values);
    const key = expenseKey(input);
    const remaining = existingCounts.get(key) ?? 0;
    if (remaining > 0) {
      existingCounts.set(key, remaining - 1);
      duplicates.push(input);
    } else {
      rows.push(input);
    }
  }

  return { rows, duplicates, errors, total: dataRows.length };
}
