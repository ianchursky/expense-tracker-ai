"use client";

import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Paperclip, Rocket } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DESTINATIONS, getDestination } from "@/lib/cloud/destinations";
import { TEMPLATES, defaultPeriod, describePeriod, getTemplate } from "@/lib/cloud/templates";
import { filenameFor } from "@/lib/cloud/serialize";
import type { DestinationDetails, DestinationId, FileFormat, Period, TemplateId, TemplateOutput } from "@/lib/cloud/types";
import { formatMonthKey, monthKey } from "@/lib/format";
import { DemoBadge } from "./DemoBadge";
import { useCloud } from "./CloudProvider";

type Step = 0 | 1 | 2;
const STEPS = ["Report", "Destination", "Review"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "block w-full rounded-lg border-0 px-3 py-2 text-base text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function defaultDetails(destinationId: DestinationId, title: string): DestinationDetails {
  switch (destinationId) {
    case "email":
      return { recipients: [], subject: `${title} from Expense Tracker`, message: "Here's the latest report. The file is attached." };
    case "google-sheets":
      return { sheetName: `Expense Tracker – ${title}` };
    case "share-link":
      return { expiresInDays: 7 };
    case "download":
      return {};
    default:
      return { folder: "/Apps/Expense Tracker" };
  }
}

export interface ComposerPreset {
  templateId?: TemplateId;
  destinationId?: DestinationId;
}

export function ExportComposer({ open, onClose, preset }: { open: boolean; onClose: () => void; preset: ComposerPreset }) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title="New export" description="Pick a report, send it somewhere, and let it run in the background.">
      {open && <ComposerBody onClose={onClose} preset={preset} />}
    </Modal>
  );
}

function ComposerBody({ onClose, preset }: { onClose: () => void; preset: ComposerPreset }) {
  const { expenses } = useExpenses();
  const cloud = useCloud();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(0);
  const [templateId, setTemplateId] = useState<TemplateId>(preset.templateId ?? "monthly-summary");
  const template = getTemplate(templateId);
  const [period, setPeriod] = useState<Period>(() => defaultPeriod(template));
  const [format, setFormat] = useState<FileFormat>(template.defaultFormat);
  const [destinationId, setDestinationId] = useState<DestinationId>(preset.destinationId ?? "download");
  const [details, setDetails] = useState<DestinationDetails>(() => defaultDetails(preset.destinationId ?? "download", template.name));
  const [recipientsText, setRecipientsText] = useState("");
  const [connectAccount, setConnectAccount] = useState("");
  const [connecting, setConnecting] = useState(false);
  const destination = getDestination(destinationId);

  // Template switch: reset period and format to what that template expects.
  useEffect(() => {
    setPeriod(defaultPeriod(template));
    setFormat(template.defaultFormat);
  }, [template]);
  useEffect(() => setDetails(defaultDetails(destinationId, template.name)), [destinationId, template.name]);

  const output = useMemo(() => template.build(expenses, period), [template, expenses, period]);
  const years = useMemo(() => [...new Set([String(new Date().getFullYear()), ...expenses.map((e) => e.date.slice(0, 4))])].sort().reverse(), [expenses]);
  const months = useMemo(() => [...new Set([monthKey(new Date().toISOString().slice(0, 10)), ...expenses.map((e) => monthKey(e.date))])].sort().reverse().slice(0, 18), [expenses]);

  const recipients = recipientsText.split(/[,\s;]+/).filter(Boolean);
  const badRecipient = recipients.find((r) => !EMAIL.test(r));
  const needsConnection = destination.requiresConnection && !cloud.isConnected(destinationId);
  const detailError =
    destinationId === "email"
      ? recipients.length === 0
        ? "Add at least one recipient."
        : badRecipient
          ? `“${badRecipient}” isn't a valid email address.`
          : null
      : destinationId === "google-sheets" && !details.sheetName?.trim()
        ? "Name the sheet."
        : destination.group === "cloud" && destinationId !== "google-sheets" && !details.folder?.trim()
          ? "Choose a folder."
          : null;
  const stepError = step === 0 ? (output.rows.length === 0 ? `No expenses in ${describePeriod(period)}.` : null) : step === 1 ? (needsConnection ? `Connect ${destination.name} to continue.` : detailError) : null;

  const connect = async () => {
    if (!EMAIL.test(connectAccount)) return;
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulated authorization round trip
    cloud.connect(destinationId, connectAccount);
    setConnecting(false);
    toast(`${destination.name} connected (simulated).`, "info");
  };

  const start = () => {
    const finalDetails = destinationId === "email" ? { ...details, recipients } : details;
    cloud.startExport({ templateId, period, format, destinationId, details: finalDetails });
    toast(`Export started. Follow it in the activity tray.`, "info");
    onClose();
  };

  return (
    <div>
      <ol className="mb-5 flex items-center gap-2 text-xs font-medium" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={step === i ? "step" : undefined}>
            <span
              className={clsx(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                i < step ? "bg-brand-600 text-white" : i === step ? "bg-brand-50 text-brand-700 ring-2 ring-brand-600" : "bg-slate-100 text-slate-500",
              )}
            >
              {i < step ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={i === step ? "text-slate-900" : "text-slate-500"}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" aria-hidden />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Report template">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              const checked = t.id === templateId;
              return (
                <label
                  key={t.id}
                  className={clsx(
                    "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600",
                    checked ? "border-brand-600 bg-brand-50/60" : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <input type="radio" name="template" className="sr-only" checked={checked} onChange={() => setTemplateId(t.id)} />
                  <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t.tint)}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{t.name}</span>
                    <span className="block text-xs text-slate-600">{t.purpose}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Period">
              {period.kind === "all" ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">All time</p>
              ) : (
                <select
                  className={clsx(inputClass, "pr-8")}
                  value={period.value}
                  onChange={(e) => setPeriod(period.kind === "year" ? { kind: "year", value: e.target.value } : { kind: "month", value: e.target.value })}
                >
                  {(period.kind === "year" ? years : months).map((v) => (
                    <option key={v} value={v}>
                      {period.kind === "year" ? v : formatMonthKey(v, "long")}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="File format">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="File format">
                {(["csv", "json"] as const).map((f) => (
                  <label
                    key={f}
                    className={clsx(
                      "cursor-pointer rounded-md py-1.5 text-center text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600",
                      format === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-600",
                    )}
                  >
                    <input type="radio" name="format" className="sr-only" checked={format === f} onChange={() => setFormat(f)} />
                    {f.toUpperCase()}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <ReportPreview output={output} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Destination">
            {DESTINATIONS.map((d) => {
              const Icon = d.icon;
              const checked = d.id === destinationId;
              const connected = cloud.isConnected(d.id);
              return (
                <label
                  key={d.id}
                  className={clsx(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600",
                    checked ? "border-brand-600 bg-brand-50/60" : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <input type="radio" name="destination" className="sr-only" checked={checked} onChange={() => setDestinationId(d.id)} />
                  <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", d.tint)}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      {d.name}
                      {d.mode === "simulated" && <DemoBadge />}
                    </span>
                    <span className="block truncate text-xs text-slate-600">
                      {d.requiresConnection ? (connected ? `Connected` : "Not connected") : d.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            {needsConnection ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-700">
                  Connect a {destination.name} account to send exports there. <DemoBadge /> No real sign-in happens; the account name is just
                  remembered on this device.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={connectAccount}
                    onChange={(e) => setConnectAccount(e.target.value)}
                    className={inputClass}
                    aria-label={`${destination.name} account email`}
                  />
                  <Button onClick={connect} disabled={!EMAIL.test(connectAccount) || connecting} className="shrink-0">
                    {connecting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    {connecting ? "Connecting…" : "Connect"}
                  </Button>
                </div>
              </div>
            ) : destinationId === "email" ? (
              <div className="space-y-4">
                <Field label="To" hint="Separate addresses with commas." error={recipientsText && detailError ? detailError : null}>
                  <input className={inputClass} value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} placeholder="accountant@example.com" />
                </Field>
                <Field label="Subject">
                  <input className={inputClass} value={details.subject ?? ""} onChange={(e) => setDetails({ ...details, subject: e.target.value })} />
                </Field>
                <Field label="Message">
                  <textarea className={clsx(inputClass, "min-h-[72px]")} value={details.message ?? ""} onChange={(e) => setDetails({ ...details, message: e.target.value })} />
                </Field>
              </div>
            ) : destinationId === "google-sheets" ? (
              <Field label="Sheet name" hint="A new sheet is created, or rows are replaced if one with this name exists.">
                <input className={inputClass} value={details.sheetName ?? ""} onChange={(e) => setDetails({ ...details, sheetName: e.target.value })} />
              </Field>
            ) : destination.group === "cloud" ? (
              <Field label="Folder" hint={`Account: ${cloud.connections.find((c) => c.destinationId === destinationId)?.account}`}>
                <input className={clsx(inputClass, "font-mono")} value={details.folder ?? ""} onChange={(e) => setDetails({ ...details, folder: e.target.value })} />
              </Field>
            ) : destinationId === "share-link" ? (
              <Field label="Link expires" hint="Snapshots include up to 40 rows so the link and QR code stay small.">
                <select
                  className={clsx(inputClass, "pr-8")}
                  value={String(details.expiresInDays ?? "never")}
                  onChange={(e) => setDetails({ expiresInDays: e.target.value === "never" ? null : Number(e.target.value) })}
                >
                  <option value="1">After 1 day</option>
                  <option value="7">After 7 days</option>
                  <option value="30">After 30 days</option>
                  <option value="never">Never</option>
                </select>
              </Field>
            ) : (
              <p className="text-sm text-slate-600">The file downloads to this device when the job finishes.</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
            {[
              ["Report", template.name],
              ["Period", describePeriod(period)],
              ["File", filenameFor(output, format)],
              ["Destination", destination.name],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="truncate font-medium text-slate-900" title={v}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          {destinationId === "email" ? (
            <EmailPreview to={recipients} subject={details.subject ?? ""} message={details.message ?? ""} filename={filenameFor(output, format)} />
          ) : destinationId === "google-sheets" ? (
            <SheetPreview name={details.sheetName ?? ""} output={output} />
          ) : (
            <ReportPreview output={output} />
          )}
          {destination.mode === "simulated" && (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <DemoBadge /> This destination is simulated. The report is really built from your data, but nothing is sent.
            </p>
          )}
        </div>
      )}

      {/* The recipients field shows its own error once something is typed; don't repeat it here. */}
      {stepError && step > 0 && !(step === 1 && destinationId === "email" && recipientsText) && (
        <p className="mt-4 text-sm text-red-600">{stepError}</p>
      )}
      {stepError && step === 0 && <p className="mt-4 text-sm text-amber-700">{stepError}</p>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => (step === 0 ? onClose() : setStep((s) => (s - 1) as Step))}>
          {step === 0 ? "Cancel" : (
            <>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </>
          )}
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!!stepError}>
            Continue <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button onClick={start}>
            <Rocket className="h-4 w-4" aria-hidden /> Start export
          </Button>
        )}
      </div>
    </div>
  );
}

/** Money columns show cents and thousands separators on screen; the exported file keeps raw numbers. */
function displayCell(cell: string | number, column: string) {
  return typeof cell === "number" && column.includes("USD")
    ? cell.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : cell;
}

export function ReportPreview({ output, limit = 5 }: { output: TemplateOutput; limit?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        {output.highlights.map((h) => (
          <div key={h.label}>
            <p className="text-xs text-slate-500">{h.label}</p>
            <p className="text-sm font-semibold text-slate-900 tabular-nums">{h.value}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              {output.columns.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-4 py-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {output.rows.slice(0, limit).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={clsx("whitespace-nowrap px-4 py-2 text-slate-700", typeof cell === "number" && "text-right tabular-nums")}>
                    {displayCell(cell, output.columns[j])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {output.rows.length > limit && (
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">+ {output.rows.length - limit} more rows in the file</p>
      )}
    </div>
  );
}

function SheetPreview({ name, output }: { name: string; output: TemplateOutput }) {
  const letters = output.columns.map((_, i) => String.fromCharCode(65 + i));
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white text-xs" aria-label="Spreadsheet preview">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-50 px-3 py-2 font-medium text-emerald-800">
        <span className="h-3 w-3 rounded-sm bg-emerald-600" aria-hidden /> {name || "Untitled sheet"}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono">
          <thead>
            <tr className="bg-slate-100 text-slate-500">
              <th className="w-8 border border-slate-200" aria-label="Row" />
              {letters.map((l) => (
                <th key={l} className="border border-slate-200 px-2 py-0.5 font-normal">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[output.columns, ...output.rows.slice(0, 5)].map((row, i) => (
              <tr key={i}>
                <td className="border border-slate-200 bg-slate-100 px-1 text-center text-slate-500">{i + 1}</td>
                {row.map((cell, j) => (
                  <td key={j} className={clsx("whitespace-nowrap border border-slate-200 px-2 py-1", i === 0 ? "font-semibold text-slate-900" : "text-slate-700", typeof cell === "number" && "text-right")}>
                    {displayCell(cell, i === 0 ? "" : output.columns[j])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmailPreview({ to, subject, message, filename }: { to: string[]; subject: string; message: string; filename: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 text-sm" aria-label="Email preview">
      <div className="space-y-1 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <p>
          <span className="text-slate-500">To:</span> <span className="text-slate-900">{to.join(", ")}</span>
        </p>
        <p>
          <span className="text-slate-500">Subject:</span> <span className="font-medium text-slate-900">{subject}</span>
        </p>
      </div>
      <div className="space-y-3 px-4 py-3">
        <p className="whitespace-pre-line text-slate-700">{message}</p>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
          <Paperclip className="h-3.5 w-3.5" aria-hidden /> {filename}
        </span>
      </div>
    </div>
  );
}
