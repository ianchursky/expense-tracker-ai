"use client";

import { clsx } from "clsx";
import { Cloud, CloudOff, HardDrive, RefreshCw } from "lucide-react";
import Link from "next/link";
import { relativeTime } from "@/lib/cloud/schedule";
import { useCloud, type SyncState } from "./CloudProvider";

const STATES: Record<SyncState, { label: string; icon: typeof Cloud; tone: string; dot: string }> = {
  local: { label: "Local only", icon: HardDrive, tone: "text-slate-600", dot: "bg-slate-400" },
  synced: { label: "Synced", icon: Cloud, tone: "text-emerald-700", dot: "bg-emerald-500" },
  syncing: { label: "Syncing", icon: RefreshCw, tone: "text-brand-700", dot: "bg-brand-500" },
  offline: { label: "Offline", icon: CloudOff, tone: "text-amber-700", dot: "bg-amber-500" },
};

/** Connection and background-job status, as a navbar pill linking to the hub or as inline text. */
export function SyncIndicator({ variant }: { variant: "nav" | "inline" }) {
  const { sync, isLoaded, jobs } = useCloud();
  if (!isLoaded) return null;
  const s = STATES[sync.state];
  const Icon = s.icon;
  const running = jobs.filter((j) => j.status === "running" || j.status === "queued" || j.status === "waiting-online").length;
  const detail =
    sync.state === "syncing"
      ? `${running} export${running === 1 ? "" : "s"} in progress`
      : sync.state === "offline"
        ? "Cloud exports wait until you're back online"
        : sync.state === "synced"
          ? sync.lastSyncedAt
            ? `Last cloud export ${relativeTime(new Date(sync.lastSyncedAt))}`
            : "Connected, nothing sent yet"
          : "No services connected";

  const content = (
    <>
      <Icon className={clsx("h-4 w-4", sync.state === "syncing" && "animate-spin motion-reduce:animate-none")} aria-hidden />
      <span>{s.label}</span>
    </>
  );

  if (variant === "inline") {
    return (
      <span className={clsx("inline-flex items-center gap-1.5", s.tone)} title={detail}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href="/exports"
      title={detail}
      aria-label={`Sync status: ${s.label}. ${detail}. Open Export Hub.`}
      className={clsx(
        "hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium transition-colors hover:bg-slate-50 md:inline-flex",
        s.tone,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {content}
    </Link>
  );
}
