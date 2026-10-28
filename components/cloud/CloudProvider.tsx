"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useExpenses } from "@/components/providers/ExpenseProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { getDestination, simulatedOutcome, stagesFor } from "@/lib/cloud/destinations";
import { isDue } from "@/lib/cloud/schedule";
import { filenameFor, serialize } from "@/lib/cloud/serialize";
import { encodeSnapshot, shareUrl, snapshotFrom } from "@/lib/cloud/share";
import { HISTORY_LIMIT, loadCloudState, saveCloudState } from "@/lib/cloud/store";
import { defaultPeriod, describePeriod, getTemplate } from "@/lib/cloud/templates";
import type { Connection, DestinationId, ExportRecord, ExportRequest, JobStage, JobStatus, Schedule, TemplateOutput } from "@/lib/cloud/types";
import { createId } from "@/lib/storage";
import { ShareDialog } from "./ShareDialog";

export interface ActiveJob {
  id: string;
  request: ExportRequest;
  title: string;
  stages: JobStage[];
  stageIndex: number;
  status: JobStatus;
  error?: string;
  recordId?: string;
}

export type SyncState = "local" | "synced" | "syncing" | "offline";

export interface ShareInfo {
  url: string;
  title: string;
  subtitle: string;
  expiresAt: string | null;
}

interface CloudContextValue {
  isLoaded: boolean;
  online: boolean;
  connections: Connection[];
  isConnected: (id: DestinationId) => boolean;
  connect: (id: DestinationId, account: string) => void;
  disconnect: (id: DestinationId) => void;
  history: ExportRecord[];
  clearHistory: () => void;
  schedules: Schedule[];
  saveSchedule: (schedule: Schedule) => void;
  deleteSchedule: (id: string) => void;
  setScheduleEnabled: (id: string, enabled: boolean) => void;
  jobs: ActiveJob[];
  startExport: (request: ExportRequest) => string;
  cancelJob: (id: string) => void;
  dismissJob: (id: string) => void;
  sync: { state: SyncState; lastSyncedAt: string | null };
  openShare: (info: ShareInfo) => void;
}

const CloudContext = createContext<CloudContextValue | null>(null);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** How often due schedules are checked while the app is open. */
const SCHEDULER_INTERVAL_MS = 30_000;

/**
 * Connections, schedules, history and the background job queue. Jobs run in this tab: real destinations
 * (download, share link) produce real output; cloud destinations walk through their stages as a simulation.
 */
export function CloudProvider({ children }: { children: ReactNode }) {
  const { expenses, isLoaded: expensesLoaded } = useExpenses();
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [online, setOnline] = useState(true);
  const [share, setShare] = useState<ShareInfo | null>(null);

  // Jobs read the latest state when they reach the step that needs it, not what existed when they started.
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const cancelled = useRef(new Set<string>());
  const onlineWaiters = useRef<(() => void)[]>([]);

  useEffect(() => {
    const state = loadCloudState();
    setConnections(state.connections);
    setHistory(state.history);
    setSchedules(state.schedules);
    setOnline(navigator.onLine);
    setIsLoaded(true);
    const goOnline = () => {
      setOnline(true);
      onlineWaiters.current.splice(0).forEach((resume) => resume());
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (isLoaded) saveCloudState({ connections, history, schedules });
  }, [isLoaded, connections, history, schedules]);

  const updateJob = useCallback((id: string, patch: Partial<ActiveJob>) => {
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const record = useCallback((entry: ExportRecord) => {
    setHistory((list) => [entry, ...list].slice(0, HISTORY_LIMIT));
  }, []);

  const runJob = useCallback(
    async (job: ActiveJob) => {
      const { request, stages } = job;
      const destination = getDestination(request.destinationId);
      const createdAt = new Date().toISOString();
      const finish = (status: ExportRecord["status"], fields: Partial<ExportRecord>) => {
        const entry: ExportRecord = {
          id: createId(),
          request,
          status,
          createdAt,
          finishedAt: new Date().toISOString(),
          filename: "",
          bytes: 0,
          rowCount: 0,
          outcome: "",
          ...fields,
        };
        record(entry);
        updateJob(job.id, { status, recordId: entry.id, error: fields.error });
        return entry;
      };

      let output: TemplateOutput | null = null;
      let blob: Blob | null = null;
      let filename = "";
      try {
        if (destination.requiresConnection && !connectionsRef.current.some((c) => c.destinationId === destination.id)) {
          throw new Error(`Connect ${destination.name} first.`);
        }
        for (let i = 0; i < stages.length; i++) {
          if (cancelled.current.has(job.id)) {
            finish("cancelled", { outcome: "Cancelled before it finished" });
            return;
          }
          // Transfers to cloud services pause while offline and resume on reconnect; local work never waits.
          // Loop: a cancel elsewhere wakes every waiter, so re-check before continuing.
          while (i >= 2 && destination.mode === "simulated" && !navigator.onLine && !cancelled.current.has(job.id)) {
            updateJob(job.id, { status: "waiting-online", stageIndex: i });
            await new Promise<void>((resolve) => onlineWaiters.current.push(resolve));
          }
          if (cancelled.current.has(job.id)) {
            finish("cancelled", { outcome: "Cancelled while waiting for a connection" });
            return;
          }
          updateJob(job.id, { status: "running", stageIndex: i });
          if (i === 1) {
            output = getTemplate(request.templateId).build(expensesRef.current, request.period);
            if (output.rows.length === 0) throw new Error(`No expenses in ${describePeriod(request.period)}.`);
            blob = serialize(output, request.format).blob;
            filename = filenameFor(output, request.format);
          }
          await sleep(stages[i].durationMs);
        }
        if (!output || !blob) throw new Error("The report could not be built.");

        if (destination.id === "download") {
          downloadBlob(blob, filename);
          finish("completed", { filename, bytes: blob.size, rowCount: output.rows.length, outcome: "Downloaded to this device" });
          toast(`${filename} downloaded.`);
        } else if (destination.id === "share-link") {
          const snapshot = snapshotFrom(output, request.details.expiresInDays ?? null);
          const url = shareUrl(window.location.origin, await encodeSnapshot(snapshot));
          const expires = snapshot.expiresAt
            ? `expires ${new Date(snapshot.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
            : "never expires";
          finish("completed", { filename, bytes: url.length, rowCount: snapshot.rows.length, outcome: `Share link created · ${expires}`, shareUrl: url, shareExpiresAt: snapshot.expiresAt });
          setShare({ url, title: snapshot.title, subtitle: snapshot.subtitle, expiresAt: snapshot.expiresAt });
        } else {
          const outcome = simulatedOutcome(destination.id, request.details, filename, output.rows.length);
          finish("completed", { filename, bytes: blob.size, rowCount: output.rows.length, outcome });
          toast(`${getTemplate(request.templateId).name} sent to ${destination.name} (simulated).`, "info");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        finish("failed", { filename, outcome: "Failed", error: message });
        toast(`Export failed: ${message}`, "error");
      }
    },
    [record, toast, updateJob],
  );

  const startExport = useCallback(
    (request: ExportRequest) => {
      const template = getTemplate(request.templateId);
      const job: ActiveJob = {
        id: createId(),
        request,
        title: `${template.name} · ${describePeriod(request.period)}`,
        stages: stagesFor(request.destinationId, request.details),
        stageIndex: 0,
        status: "queued",
      };
      setJobs((list) => [job, ...list]);
      void runJob(job);
      return job.id;
    },
    [runJob],
  );

  // Scheduler: runs due schedules while the app is open; anything missed while closed catches up on the next visit.
  const fired = useRef(new Map<string, string | null>());
  useEffect(() => {
    if (!isLoaded || !expensesLoaded) return;
    const tick = () => {
      const now = new Date();
      for (const s of schedules) {
        // StrictMode and overlapping ticks can see the same due schedule twice; fire once per lastRunAt.
        if (!isDue(s, now) || fired.current.get(s.id) === (s.lastRunAt ?? "never")) continue;
        fired.current.set(s.id, s.lastRunAt ?? "never");
        const template = getTemplate(s.templateId);
        startExport({
          templateId: s.templateId,
          period: defaultPeriod(template, expensesRef.current, now),
          format: s.format,
          destinationId: s.destinationId,
          details: s.details,
          scheduleId: s.id,
        });
        setSchedules((list) => list.map((x) => (x.id === s.id ? { ...x, lastRunAt: now.toISOString() } : x)));
      }
    };
    tick();
    const timer = setInterval(tick, SCHEDULER_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLoaded, expensesLoaded, schedules, startExport]);

  const sync = useMemo(() => {
    const lastCloud = history.find((h) => h.status === "completed" && getDestination(h.request.destinationId).group === "cloud");
    const state: SyncState = !online
      ? "offline"
      : jobs.some((j) => j.status === "running" || j.status === "queued" || j.status === "waiting-online")
        ? "syncing"
        : connections.length > 0
          ? "synced"
          : "local";
    return { state, lastSyncedAt: lastCloud?.finishedAt ?? null };
  }, [online, jobs, connections.length, history]);

  const value = useMemo<CloudContextValue>(
    () => ({
      isLoaded,
      online,
      connections,
      isConnected: (id) => connections.some((c) => c.destinationId === id),
      connect: (id, account) =>
        setConnections((list) => [...list.filter((c) => c.destinationId !== id), { destinationId: id, account, connectedAt: new Date().toISOString() }]),
      disconnect: (id) => setConnections((list) => list.filter((c) => c.destinationId !== id)),
      history,
      clearHistory: () => setHistory([]),
      schedules,
      saveSchedule: (schedule) => setSchedules((list) => [schedule, ...list.filter((s) => s.id !== schedule.id)]),
      deleteSchedule: (id) => setSchedules((list) => list.filter((s) => s.id !== id)),
      setScheduleEnabled: (id, enabled) =>
        // Re-enabling starts the clock now, so a paused schedule doesn't fire a backlog the moment it resumes.
        setSchedules((list) => list.map((s) => (s.id === id ? { ...s, enabled, lastRunAt: enabled ? new Date().toISOString() : s.lastRunAt } : s))),
      jobs,
      startExport,
      cancelJob: (id) => {
        cancelled.current.add(id);
        onlineWaiters.current.splice(0).forEach((resume) => resume());
      },
      dismissJob: (id) => setJobs((list) => list.filter((j) => j.id !== id)),
      sync,
      openShare: setShare,
    }),
    [isLoaded, online, connections, history, schedules, jobs, startExport, sync],
  );

  return (
    <CloudContext.Provider value={value}>
      {children}
      <ShareDialog share={share} onClose={() => setShare(null)} />
    </CloudContext.Provider>
  );
}

export function useCloud(): CloudContextValue {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error("useCloud must be used within CloudProvider");
  return ctx;
}

