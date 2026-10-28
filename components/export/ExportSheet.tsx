"use client";

import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import {
  EXPORT_FORMATS,
  downloadBlob,
  runExport,
  selectForExport,
  validateFilename,
  withExtension,
  type ExportScope,
} from "@/lib/export";
import { loadPreferences, savePreferences } from "@/lib/export/preferences";
import { formatCurrency } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { ExportOptionsPanel } from "./ExportOptionsPanel";
import { ExportPreview } from "./ExportPreview";
import { useExportDraft } from "./useExportDraft";

type Phase =
  | { status: "idle" }
  | { status: "working" }
  | { status: "done"; filename: string; count: number; bytes: number }
  | { status: "error"; message: string };

/** Keeps a spinner up long enough to read, so instant formats don't flash. */
const MIN_WORKING_MS = 400;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

function formatBytes(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface ExportSheetProps {
  open: boolean;
  onClose: () => void;
  /** Where the scope starts, e.g. the list's current filters. */
  initialScope: ExportScope;
}

export function ExportSheet({ open, onClose, initialScope }: ExportSheetProps) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      dismissible={!busy}
      title="Export expenses"
      description="Choose a format and what to include. Nothing leaves this browser except the file you download."
    >
      {/* Mounted only while open, so every opening starts from the current filters and saved preferences. */}
      {open && <ExportWorkspace initialScope={initialScope} onClose={onClose} onBusyChange={setBusy} />}
    </Sheet>
  );
}

function ExportWorkspace({
  initialScope,
  onClose,
  onBusyChange,
}: {
  initialScope: ExportScope;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { expenses } = useExpenses();
  const { toast } = useToast();
  const [preferences] = useState(loadPreferences);
  const draft = useExportDraft(initialScope, preferences);
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [mobileView, setMobileView] = useState<"options" | "preview">("options");
  const workspaceRef = useRef<HTMLDivElement>(null);

  // The preview re-filters every expense; deferring it keeps typing and toggling responsive on large data.
  const deferredOptions = useDeferredValue(draft.options);
  const previewSelection = useMemo(
    () => selectForExport(expenses, deferredOptions.scope, deferredOptions.sort),
    [expenses, deferredOptions.scope, deferredOptions.sort],
  );
  const stale = deferredOptions !== draft.options;
  const liveSelection = useMemo(
    () => selectForExport(expenses, draft.options.scope, draft.options.sort),
    [expenses, draft.options.scope, draft.options.sort],
  );

  const { options } = draft;
  const format = EXPORT_FORMATS[options.format];
  const working = phase.status === "working";
  const count = liveSelection.records.length;
  const rangeInvalid = !!options.scope.startDate && !!options.scope.endDate && options.scope.startDate > options.scope.endDate;
  const blocker =
    options.scope.categories.length === 0
      ? "Choose at least one category."
      : rangeInvalid
        ? "Fix the date range."
        : validateFilename(options.filename)
          ? "Fix the file name."
          : count === 0
            ? "No expenses match these options."
            : null;

  useEffect(() => onBusyChange(working), [working, onBusyChange]);
  // Any change after a finished export returns the footer to its ready state.
  useEffect(() => {
    setPhase((p) => (p.status === "done" || p.status === "error" ? { status: "idle" } : p));
  }, [options]);

  const handleExport = async () => {
    if (blocker || working) return;
    const started = performance.now();
    setPhase({ status: "working" });
    savePreferences({ format: options.format, sort: options.sort, settings: options.settings });
    try {
      await nextFrame(); // let the spinner paint before synchronous serialization
      const result = await runExport(expenses, options);
      const remaining = MIN_WORKING_MS - (performance.now() - started);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      downloadBlob(result.blob, result.filename);
      setPhase({ status: "done", filename: result.filename, count: result.count, bytes: result.blob.size });
      toast(`Exported ${plural(result.count, "expense")} to ${result.filename}.`);
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "Something went wrong.";
      setPhase({
        status: "error",
        message: options.format === "pdf" ? `Couldn't create the PDF. ${message}` : `Couldn't create the file. ${message}`,
      });
    }
  };

  // Ctrl/⌘ + Enter exports from anywhere in the sheet. The ref keeps the listener stable across renders.
  const exportRef = useRef(handleExport);
  exportRef.current = handleExport;
  useEffect(() => {
    const el = workspaceRef.current?.closest("dialog");
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void exportRef.current();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);
  const [isMac, setIsMac] = useState(false);
  useEffect(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent)), []);

  const resetScope = () => {
    draft.setRange("", "");
    draft.setCategories([...CATEGORIES]);
  };

  return (
    <div ref={workspaceRef} className="flex h-full flex-col">
      {/* Phones: switch between options and preview. Wide screens show both side by side. */}
      <div className="flex gap-1 border-b border-slate-200 px-5 py-2 lg:hidden" role="tablist" aria-label="Export panels">
        {(["options", "preview"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={mobileView === v}
            onClick={() => setMobileView(v)}
            className={clsx(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium",
              mobileView === v ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            {v === "options" ? "Options" : `Preview (${count.toLocaleString("en-US")})`}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className={clsx("min-h-0 overflow-y-auto", mobileView === "preview" && "hidden lg:block")}>
          <ExportOptionsPanel draft={draft} expenses={expenses} disabled={working} />
        </div>
        <section
          aria-label="Preview"
          aria-busy={stale}
          className={clsx(
            "min-h-0 border-slate-200 bg-white transition-opacity lg:border-l",
            mobileView === "options" && "hidden lg:block",
            stale && "opacity-60",
          )}
        >
          <ExportPreview selection={previewSelection} onReset={resetScope} />
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0 flex-1 text-sm" aria-live="polite">
          {phase.status === "done" ? (
            <p className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">
                Saved <span className="font-mono">{phase.filename}</span> · {plural(phase.count, "record")} ·{" "}
                {formatBytes(phase.bytes)}
              </span>
            </p>
          ) : phase.status === "error" ? (
            <p className="flex items-center gap-2 text-red-700" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {phase.message}
            </p>
          ) : blocker ? (
            <p className="text-slate-500">{blocker}</p>
          ) : (
            <p className="truncate text-slate-600">
              <span className="font-semibold text-slate-900">{plural(count, "record")}</span> ·{" "}
              {formatCurrency(liveSelection.total)} →{" "}
              <span className="font-mono text-slate-700">{withExtension(options.filename, format.extension)}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <kbd className="mr-1 hidden rounded border border-slate-200 px-1.5 py-0.5 font-sans text-xs text-slate-500 xl:inline">
            {isMac ? "⌘" : "Ctrl"} ↵
          </kbd>
          <Button variant="secondary" onClick={onClose} disabled={working}>
            {phase.status === "done" ? "Done" : "Cancel"}
          </Button>
          <Button onClick={handleExport} disabled={!!blocker || working} className="min-w-[10.5rem]">
            {working ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                {options.format === "pdf" ? "Building PDF…" : `Preparing ${format.label}…`}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" aria-hidden />
                {phase.status === "done" ? "Export again" : `Export ${format.label}`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
