"use client";

import { clsx } from "clsx";
import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DESTINATIONS, getDestination } from "@/lib/cloud/destinations";
import { WEEKDAYS, describeCadence, nextRunAt } from "@/lib/cloud/schedule";
import { TEMPLATES, getTemplate } from "@/lib/cloud/templates";
import type { DestinationId, FileFormat, Frequency, Schedule, TemplateId } from "@/lib/cloud/types";
import { createId } from "@/lib/storage";
import { useCloud } from "./CloudProvider";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A scheduled download would fire unprompted in the browser, and share links are a person-to-person action.
const SCHEDULABLE = DESTINATIONS.filter((d) => d.id !== "download" && d.id !== "share-link");

const inputClass =
  "block w-full rounded-lg border-0 px-3 py-2 text-base text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm";

export function ScheduleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New scheduled export" description="Runs automatically while Expense Tracker is open in a tab.">
      {open && <ScheduleForm onClose={onClose} />}
    </Modal>
  );
}

function ScheduleForm({ onClose }: { onClose: () => void }) {
  const cloud = useCloud();
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState<TemplateId>("monthly-summary");
  const [destinationId, setDestinationId] = useState<DestinationId>("google-drive");
  const [format, setFormat] = useState<FileFormat>("csv");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [hour, setHour] = useState(9);
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [recipients, setRecipients] = useState("");
  const [folder, setFolder] = useState("/Apps/Expense Tracker/Backups");
  const destination = getDestination(destinationId);
  const template = getTemplate(templateId);

  const recipientList = recipients.split(/[,\s;]+/).filter(Boolean);
  const error =
    destination.requiresConnection && !cloud.isConnected(destinationId)
      ? `Connect ${destination.name} on the Export Hub first.`
      : destinationId === "email" && (recipientList.length === 0 || recipientList.some((r) => !EMAIL.test(r)))
        ? "Add valid email recipients."
        : null;

  const cadence = { frequency, hour, weekday, dayOfMonth };
  const upcoming = useMemo(() => {
    const runs: Date[] = [];
    let from = new Date();
    for (let i = 0; i < 3; i++) {
      from = nextRunAt({ frequency, hour, weekday, dayOfMonth }, from);
      runs.push(from);
    }
    return runs;
  }, [frequency, hour, weekday, dayOfMonth]);

  const save = () => {
    if (error) return;
    const schedule: Schedule = {
      id: createId(),
      name: `${template.name} → ${destination.name}`,
      templateId,
      destinationId,
      format,
      frequency,
      hour,
      weekday,
      dayOfMonth,
      enabled: true,
      details:
        destinationId === "email"
          ? { recipients: recipientList, subject: `${template.name} from Expense Tracker`, message: "Your scheduled report is attached." }
          : destinationId === "google-sheets"
            ? { sheetName: `Expense Tracker – ${template.name}` }
            : { folder },
      createdAt: new Date().toISOString(),
      lastRunAt: null,
    };
    cloud.saveSchedule(schedule);
    toast(`Scheduled: ${describeCadence(cadence).toLowerCase()}.`);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Report</span>
          <select
            className={clsx(inputClass, "mt-1.5 pr-8")}
            value={templateId}
            onChange={(e) => {
              const id = e.target.value as TemplateId;
              setTemplateId(id);
              setFormat(getTemplate(id).defaultFormat);
            }}
            data-autofocus
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Send to</span>
          <select className={clsx(inputClass, "mt-1.5 pr-8")} value={destinationId} onChange={(e) => setDestinationId(e.target.value as DestinationId)}>
            {SCHEDULABLE.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.requiresConnection && !cloud.isConnected(d.id) ? " (not connected)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {destinationId === "email" ? (
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Recipients</span>
          <input className={clsx(inputClass, "mt-1.5")} value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="accountant@example.com" />
        </label>
      ) : (
        destination.group === "cloud" &&
        destinationId !== "google-sheets" && (
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Folder</span>
            <input className={clsx(inputClass, "mt-1.5 font-mono")} value={folder} onChange={(e) => setFolder(e.target.value)} />
          </label>
        )
      )}

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Repeat</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
          {(["daily", "weekly", "monthly"] as const).map((f) => (
            <label
              key={f}
              className={clsx(
                "cursor-pointer rounded-md py-1.5 text-center text-sm font-medium capitalize has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600",
                frequency === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-600",
              )}
            >
              <input type="radio" name="frequency" className="sr-only" checked={frequency === f} onChange={() => setFrequency(f)} />
              {f}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        {frequency === "weekly" && (
          <label className="block text-sm">
            <span className="font-medium text-slate-700">On</span>
            <select className={clsx(inputClass, "mt-1.5 pr-8")} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
        {frequency === "monthly" && (
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Day</span>
            <select className={clsx(inputClass, "mt-1.5 pr-8")} value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-sm">
          <span className="font-medium text-slate-700">At</span>
          <select className={clsx(inputClass, "mt-1.5 pr-8")} value={hour} onChange={(e) => setHour(Number(e.target.value))}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {new Date(2000, 0, 1, h).toLocaleTimeString("en-US", { hour: "numeric" })}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Format</span>
          <select className={clsx(inputClass, "mt-1.5 pr-8")} value={format} onChange={(e) => setFormat(e.target.value as FileFormat)}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </label>
      </div>

      <div className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <div>
          <p className="font-medium text-slate-900">{describeCadence(cadence)}</p>
          <p className="mt-0.5 text-slate-600">
            Next runs:{" "}
            {upcoming.map((d) => d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric" })).join(" · ")}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!!error}>
          Create schedule
        </Button>
      </div>
    </div>
  );
}
