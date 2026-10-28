import { csvFormat } from "./formats/csv";
import { jsonFormat } from "./formats/json";
import { pdfFormat } from "./formats/pdf";
import { withExtension } from "./filename";
import { selectForExport } from "./select";
import type { ExportFormat, ExportFormatId, ExportOptions } from "./types";
import type { Expense } from "../types";

export const EXPORT_FORMATS: { [K in ExportFormatId]: ExportFormat<K> } = {
  csv: csvFormat,
  json: jsonFormat,
  pdf: pdfFormat,
};

export const FORMAT_ORDER: ExportFormatId[] = ["csv", "json", "pdf"];

export interface ExportResult {
  blob: Blob;
  filename: string;
  count: number;
}

/** Selects, serializes and names one export. Pure apart from the PDF format's lazy import. */
export async function runExport(expenses: Expense[], options: ExportOptions, now = new Date()): Promise<ExportResult> {
  const selection = selectForExport(expenses, options.scope, options.sort);
  if (selection.records.length === 0) throw new Error("Nothing to export with these options.");
  const format = EXPORT_FORMATS[options.format] as ExportFormat<ExportOptions["format"]>;
  const settings = options.settings[options.format];
  const blob = await format.build({ selection, scope: options.scope, generatedAt: now }, settings as never);
  return { blob, filename: withExtension(options.filename, format.extension), count: selection.records.length };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick: some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export * from "./types";
export { selectForExport, countByCategoryInRange } from "./select";
export { defaultFilename, sanitizeFilename, validateFilename, withExtension, MAX_FILENAME_LENGTH } from "./filename";
