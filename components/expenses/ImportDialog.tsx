"use client";

import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, CopyCheck, FileUp } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { ImportFileError, MAX_IMPORT_BYTES, previewImport, type ImportPreview } from "@/lib/csvImport";

const ERRORS_SHOWN = 5;

function looksLikeCSV(file: File) {
  return /\.csv$/i.test(file.name) || ["text/csv", "application/vnd.ms-excel", "text/plain"].includes(file.type);
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** Body of the Import CSV dialog: pick a file, preview what will happen, then import (with Undo). */
export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { expenses, importExpenses, removeExpenses } = useExpenses();
  const { toast } = useToast();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const readFile = async (file: File) => {
    setFileName(file.name);
    setPreview(null);
    setFileError(null);
    setIncludeDuplicates(false);
    if (!looksLikeCSV(file)) return setFileError("That doesn't look like a CSV file. Choose a .csv file exported from this app or a spreadsheet.");
    if (file.size > MAX_IMPORT_BYTES) return setFileError("The file is larger than 5 MB. Split it into smaller files and import them one at a time.");
    setReading(true);
    try {
      setPreview(previewImport(await file.text(), expenses));
    } catch (err) {
      setFileError(err instanceof ImportFileError ? err.message : "The file couldn't be read. Make sure it's a plain-text CSV file.");
    } finally {
      setReading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void readFile(file);
  };

  const toImport = preview ? [...preview.rows, ...(includeDuplicates ? preview.duplicates : [])] : [];

  const handleImport = () => {
    const imported = importExpenses(toImport);
    if (!imported) {
      setFileError("Browser storage is full, so nothing was imported. Free up space by deleting expenses, or import a smaller file.");
      return;
    }
    const ids = imported.map((e) => e.id);
    toast(`Imported ${plural(imported.length, "expense")}.`, "success", { label: "Undo", onClick: () => removeExpenses(ids) });
    onClose();
  };

  return (
    <div className="space-y-5">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-7 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600",
          dragging ? "border-brand-600 bg-brand-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
        )}
      >
        <FileUp className="h-6 w-6 text-slate-500" aria-hidden />
        <span className="text-sm font-medium text-slate-900">
          {fileName ? "Choose a different file" : "Choose a CSV file"}
          <span className="hidden font-normal text-slate-600 sm:inline"> or drag it here</span>
        </span>
        <span className="max-w-sm text-xs text-slate-600">
          A file exported from this app, or any CSV with Date, Category, Description and Amount columns.
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          data-autofocus
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void readFile(file);
            e.target.value = ""; // allow re-selecting the same file after fixing it
          }}
        />
      </label>

      <div aria-live="polite">
        {reading && <p className="text-sm text-slate-600">Reading {fileName}…</p>}

        {fileError && (
          <div role="alert" className="flex gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
            <p>
              {fileName && <span className="font-medium">{fileName}: </span>}
              {fileError}
            </p>
          </div>
        )}

        {preview && !fileError && (
          <div className="space-y-3 text-sm">
            <p className="truncate font-medium text-slate-900">{fileName}</p>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              <li className="flex items-start gap-2.5 px-3 py-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <span className="text-slate-700">
                  <span className="font-medium text-slate-900">{plural(preview.rows.length, "new expense")}</span> ready to import
                </span>
              </li>
              {preview.duplicates.length > 0 && (
                <li className="flex items-start gap-2.5 px-3 py-2.5">
                  <CopyCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                  <div className="text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">{plural(preview.duplicates.length, "expense")}</span> already in
                      your data will be skipped.
                    </p>
                    <label className="mt-1.5 flex items-center gap-2 text-slate-700">
                      <input
                        type="checkbox"
                        checked={includeDuplicates}
                        onChange={(e) => setIncludeDuplicates(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Import them anyway
                    </label>
                  </div>
                </li>
              )}
              {preview.errors.length > 0 && (
                <li className="flex items-start gap-2.5 px-3 py-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <div className="min-w-0 text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">{plural(preview.errors.length, "row")}</span> can&apos;t be
                      imported and will be left out:
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                      {preview.errors.slice(0, ERRORS_SHOWN).map((err) => (
                        <li key={err.line} className="break-words">
                          <span className="font-medium text-slate-800 tabular-nums">Line {err.line}:</span> {err.message}
                        </li>
                      ))}
                      {preview.errors.length > ERRORS_SHOWN && (
                        <li>and {plural(preview.errors.length - ERRORS_SHOWN, "more row")}.</li>
                      )}
                    </ul>
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!preview || !!fileError || toImport.length === 0}>
          {preview && toImport.length > 0 ? `Import ${plural(toImport.length, "expense")}` : "Import"}
        </Button>
      </div>
    </div>
  );
}
