import type { CsvDelimiter, ExportFormat } from "../types";

const HEADERS = ["Date", "Category", "Description", "Amount (USD)"];

function escapeCell(value: string, delimiter: CsvDelimiter): string {
  // Neutralize spreadsheet formula injection (cells starting with = + - @ tab or CR).
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  const mustQuote = safe.includes(delimiter) || /["\r\n]/.test(safe);
  return mustQuote ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const csvFormat: ExportFormat<"csv"> = {
  id: "csv",
  label: "CSV",
  extension: "csv",
  mimeType: "text/csv;charset=utf-8",
  description: "Spreadsheet-ready rows for Excel, Numbers or Google Sheets",
  async build({ selection }, { delimiter }) {
    const rows = selection.records.map((e) =>
      [e.date, e.category, e.description, e.amount.toFixed(2)].map((cell) => escapeCell(cell, delimiter)),
    );
    const text = [HEADERS, ...rows].map((row) => row.join(delimiter)).join("\r\n");
    // BOM so Excel opens the file as UTF-8 instead of guessing a legacy code page.
    return new Blob(["﻿", text], { type: this.mimeType });
  },
};
