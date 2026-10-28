import type { FileFormat, TemplateOutput } from "./types";

function csvCell(value: string | number): string {
  const text = String(value);
  // Neutralize spreadsheet formula injection (cells starting with = + - @ tab or CR), but keep numbers as numbers.
  const safe = typeof value === "string" && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCSV(output: TemplateOutput): string {
  return [output.columns, ...output.rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function toJSON(output: TemplateOutput, generatedAt: Date): string {
  const records = output.rows.map((row) => Object.fromEntries(output.columns.map((c, i) => [c, row[i]])));
  return JSON.stringify(
    {
      report: output.title,
      period: output.subtitle,
      generatedAt: generatedAt.toISOString(),
      highlights: Object.fromEntries(output.highlights.map((h) => [h.label, h.value])),
      records,
    },
    null,
    2,
  );
}

export function serialize(output: TemplateOutput, format: FileFormat, generatedAt = new Date()) {
  const text = format === "csv" ? toCSV(output) : toJSON(output, generatedAt);
  const mimeType = format === "csv" ? "text/csv;charset=utf-8" : "application/json";
  // BOM so Excel reads UTF-8 CSV correctly.
  const blob = new Blob(format === "csv" ? ["﻿", text] : [text], { type: mimeType });
  return { blob, mimeType };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function filenameFor(output: TemplateOutput, format: FileFormat): string {
  return `${slugify(output.title)}_${slugify(output.subtitle) || "export"}.${format}`;
}
