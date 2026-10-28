"use client";

import { clsx } from "clsx";
import { AlertCircle, CalendarClock, CheckCircle2, Info, Link2, Play, Plus, RotateCcw, Send, Trash2, XCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DESTINATIONS, getDestination } from "@/lib/cloud/destinations";
import { describeCadence, nextRunAt, relativeTime } from "@/lib/cloud/schedule";
import { TEMPLATES, defaultPeriod, describePeriod, getTemplate } from "@/lib/cloud/templates";
import type { DestinationId } from "@/lib/cloud/types";
import { useCloud } from "./CloudProvider";
import { ConnectDialog } from "./ConnectDialog";
import { DemoBadge } from "./DemoBadge";
import { ExportComposer, type ComposerPreset } from "./ExportComposer";
import { ScheduleDialog } from "./ScheduleDialog";
import { SyncIndicator } from "./SyncIndicator";

function Section({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const formatBytes = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

export function ExportHubView() {
  const cloud = useCloud();
  const [composer, setComposer] = useState<ComposerPreset | null>(null);
  const [connectId, setConnectId] = useState<DestinationId | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const now = new Date();
  const thisMonth = cloud.history.filter((h) => h.finishedAt.slice(0, 7) === now.toISOString().slice(0, 7) && h.status === "completed").length;
  const activeSchedules = cloud.schedules.filter((s) => s.enabled).length;
  const cloudDestinations = DESTINATIONS.filter((d) => d.group === "cloud");

  return (
    <>
      <PageHeader
        title="Export Hub"
        description="Send reports where they're needed: as a file, a private link, or to the tools you already use."
        actions={
          <Button onClick={() => setComposer({})}>
            <Send className="h-4 w-4" aria-hidden /> New export
          </Button>
        }
      />

      <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <p>
          <span className="font-semibold">Integrations marked</span> <DemoBadge /> <span className="font-semibold">are simulated</span>: you can try every
          step, and reports are really built from your data, but nothing is sent. Downloads and share links are real, and neither one goes through a
          server.
        </p>
      </div>

      <Card className="mb-10 grid grid-cols-2 divide-slate-100 p-0 sm:grid-cols-4 sm:divide-x">
        {[
          { label: "Sync", value: <SyncIndicator variant="inline" /> },
          { label: "Connected services", value: `${cloud.connections.length} of ${cloudDestinations.length}` },
          { label: "Active schedules", value: String(activeSchedules) },
          { label: "Exports this month", value: String(thisMonth) },
        ].map((s) => (
          <div key={s.label} className="p-4 sm:px-5">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <div className="mt-1 text-base font-semibold text-slate-900">{s.value}</div>
          </div>
        ))}
      </Card>

      <Section title="Templates" description="Ready-made reports for the moments people actually need their numbers.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <Card key={t.id} className="flex flex-col p-5">
                <span className={clsx("flex h-10 w-10 items-center justify-center rounded-xl", t.tint)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{t.name}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-600">{t.purpose}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {describePeriod(defaultPeriod(t))} · {t.defaultFormat.toUpperCase()}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => setComposer({ templateId: t.id })}>
                    Export
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setComposer({ templateId: t.id, destinationId: "share-link" })} aria-label={`Share ${t.name} as a link`}>
                    <Link2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title="Integrations" description="Connect a service once, then send any report to it or put it on a schedule.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cloudDestinations.map((d) => {
            const Icon = d.icon;
            const connection = cloud.connections.find((c) => c.destinationId === d.id);
            return (
              <Card key={d.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className={clsx("flex h-9 w-9 items-center justify-center rounded-lg", d.tint)}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <DemoBadge />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{d.name}</h3>
                <p className="mt-0.5 flex-1 text-xs text-slate-600">
                  {connection ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> {connection.account}
                    </span>
                  ) : (
                    d.description
                  )}
                </p>
                <div className="mt-3">
                  {connection ? (
                    <Button size="sm" variant="ghost" className="-ml-2" onClick={() => cloud.disconnect(d.id)}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setConnectId(d.id)}>
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section
        title="Scheduled backups"
        description="Recurring exports run in the background while Expense Tracker is open. Anything missed while it's closed runs the next time you open it."
        action={
          <Button variant="secondary" onClick={() => setScheduling(true)}>
            <Plus className="h-4 w-4" aria-hidden /> New schedule
          </Button>
        }
      >
        {cloud.schedules.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-10 text-center">
            <CalendarClock className="h-6 w-6 text-slate-400" aria-hidden />
            <p className="mt-3 font-medium text-slate-900">No schedules yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Send a Monthly Summary to your accountant on the 1st, or back everything up to Drive every week.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-slate-100">
            {cloud.schedules.map((s) => {
              const d = getDestination(s.destinationId);
              const next = nextRunAt(s, new Date(Math.max(Date.now(), new Date(s.lastRunAt ?? s.createdAt).getTime())));
              return (
                <div key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium text-slate-900">
                      {s.name} {d.mode === "simulated" && <DemoBadge />}
                    </p>
                    <p className="text-sm text-slate-500">
                      {describeCadence(s)} · {s.format.toUpperCase()}
                      {s.enabled ? ` · next ${relativeTime(next)}` : " · paused"}
                      {s.lastRunAt && ` · last ran ${relativeTime(new Date(s.lastRunAt))}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="mr-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={s.enabled}
                        onChange={(e) => cloud.setScheduleEnabled(s.id, e.target.checked)}
                        className="peer sr-only"
                      />
                      <span
                        className="relative h-5 w-9 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-brand-600 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2"
                        aria-hidden
                      />
                      {s.enabled ? "On" : "Paused"}
                    </label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        cloud.startExport({
                          templateId: s.templateId,
                          period: defaultPeriod(getTemplate(s.templateId)),
                          format: s.format,
                          destinationId: s.destinationId,
                          details: s.details,
                          scheduleId: s.id,
                        })
                      }
                    >
                      <Play className="h-4 w-4" aria-hidden /> Run now
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cloud.deleteSchedule(s.id)} aria-label={`Delete schedule ${s.name}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </Section>

      <Section
        title="Activity"
        description="Every export from this browser, newest first."
        action={
          cloud.history.length > 0 && (
            <Button variant="ghost" onClick={cloud.clearHistory}>
              Clear history
            </Button>
          )
        }
      >
        {cloud.history.length === 0 ? (
          <Card className="px-6 py-10 text-center text-sm text-slate-500">Nothing exported yet. Finished exports and their results show up here.</Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {cloud.history.map((h) => {
                const d = getDestination(h.request.destinationId);
                const DIcon = d.icon;
                const StatusIcon = h.status === "completed" ? CheckCircle2 : h.status === "failed" ? AlertCircle : XCircle;
                return (
                  <li key={h.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <StatusIcon
                      className={clsx(
                        "hidden h-5 w-5 shrink-0 sm:block",
                        h.status === "completed" ? "text-emerald-600" : h.status === "failed" ? "text-red-600" : "text-slate-400",
                      )}
                      aria-label={h.status}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-slate-900">
                        {getTemplate(h.request.templateId).name}
                        <span className="font-normal text-slate-500">· {describePeriod(h.request.period)}</span>
                        {h.request.scheduleId && (
                          <span className="rounded bg-slate-100 px-1.5 text-[11px] font-medium text-slate-600">Scheduled</span>
                        )}
                      </p>
                      <p className={clsx("truncate text-xs", h.status === "failed" ? "text-red-600" : "text-slate-500")} title={h.error ?? h.outcome}>
                        {h.error ?? h.outcome}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <DIcon className="h-3.5 w-3.5" aria-hidden /> {d.name}
                    </span>
                    <span className="w-20 text-xs text-slate-500 tabular-nums sm:text-right">{h.bytes ? formatBytes(h.bytes) : "—"}</span>
                    <time className="w-24 text-xs text-slate-500 sm:text-right" dateTime={h.finishedAt} title={new Date(h.finishedAt).toLocaleString()}>
                      {relativeTime(new Date(h.finishedAt))}
                    </time>
                    <div className="flex gap-1">
                      {h.shareUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            cloud.openShare({
                              url: h.shareUrl!,
                              title: getTemplate(h.request.templateId).name,
                              subtitle: describePeriod(h.request.period),
                              expiresAt: h.shareExpiresAt ?? null,
                            })
                          }
                        >
                          <Link2 className="h-4 w-4" aria-hidden /> Link
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => cloud.startExport(h.request)} aria-label="Run this export again">
                        <RotateCcw className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </Section>

      <ExportComposer open={composer !== null} onClose={() => setComposer(null)} preset={composer ?? {}} />
      <ConnectDialog destinationId={connectId} onClose={() => setConnectId(null)} />
      <ScheduleDialog open={scheduling} onClose={() => setScheduling(false)} />
    </>
  );
}
