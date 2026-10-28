"use client";

import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, ChevronDown, CloudOff, Loader2, X, XCircle } from "lucide-react";
import { useState } from "react";
import { getDestination } from "@/lib/cloud/destinations";
import { useCloud, type ActiveJob } from "./CloudProvider";

const isActive = (j: ActiveJob) => j.status === "queued" || j.status === "running" || j.status === "waiting-online";

function JobRow({ job }: { job: ActiveJob }) {
  const { cancelJob, dismissJob } = useCloud();
  const destination = getDestination(job.request.destinationId);
  const Icon = destination.icon;
  const active = isActive(job);
  const stage = job.stages[job.stageIndex];
  // Each stage animates the bar toward its end over the stage's own duration, so progress reads as continuous.
  const progress = job.status === "completed" ? 100 : ((job.stageIndex + (active ? 1 : 0)) / job.stages.length) * 100;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <span className={clsx("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md", destination.tint)}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{job.title}</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            {job.status === "waiting-online" ? (
              <>
                <CloudOff className="h-3.5 w-3.5 text-amber-600" aria-hidden /> Waiting for a connection
              </>
            ) : active ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden />
                {stage?.label}…
              </>
            ) : job.status === "completed" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> Done · {destination.name}
                {destination.mode === "simulated" && " (simulated)"}
              </>
            ) : job.status === "cancelled" ? (
              <>
                <XCircle className="h-3.5 w-3.5 text-slate-400" aria-hidden /> Cancelled
              </>
            ) : (
              <span className="flex min-w-0 items-center gap-1.5 text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> <span className="truncate">{job.error}</span>
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (active ? cancelJob(job.id) : dismissJob(job.id))}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label={active ? `Cancel ${job.title}` : `Dismiss ${job.title}`}
          title={active ? "Cancel" : "Dismiss"}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {(active || job.status === "completed") && (
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label={`${job.title} progress`}
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={clsx("h-full rounded-full transition-[width] ease-linear motion-reduce:transition-none", job.status === "completed" ? "bg-emerald-500" : "bg-brand-600")}
            style={{ width: `${progress}%`, transitionDuration: active && stage ? `${stage.durationMs}ms` : "200ms" }}
          />
        </div>
      )}
    </li>
  );
}

/** Floating panel for background exports, bottom-left so it never collides with toasts on the right. */
export function JobTray() {
  const { jobs, dismissJob } = useCloud();
  const [collapsed, setCollapsed] = useState(false);
  if (jobs.length === 0) return null;
  const running = jobs.filter(isActive).length;
  const finished = jobs.filter((j) => !isActive(j));

  return (
    <section
      aria-label="Background exports"
      className="fixed bottom-4 left-4 right-4 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:right-auto sm:w-80"
    >
      <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="flex-1 text-sm font-semibold text-slate-900" aria-live="polite">
          {running > 0 ? `Exporting ${running}…` : "Exports finished"}
        </p>
        {finished.length > 0 && (
          <button type="button" onClick={() => finished.forEach((j) => dismissJob(j.id))} className="text-xs font-medium text-slate-600 hover:text-slate-900">
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand exports" : "Collapse exports"}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-200/60"
        >
          <ChevronDown className={clsx("h-4 w-4 transition-transform", collapsed && "rotate-180")} aria-hidden />
        </button>
      </header>
      {!collapsed && (
        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
          {jobs.slice(0, 6).map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </ul>
      )}
    </section>
  );
}
