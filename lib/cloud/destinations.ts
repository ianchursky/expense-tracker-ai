import { Cloud, Download, FolderSync, HardDrive, Link2, Mail, Table2, type LucideIcon } from "lucide-react";
import type { DestinationDetails, DestinationId, JobStage } from "./types";

export interface Destination {
  id: DestinationId;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile; literal so Tailwind's scanner keeps them. */
  tint: string;
  /**
   * real: the job produces a real file or link on this device.
   * simulated: the flow is shown end to end, but nothing is sent anywhere.
   */
  mode: "real" | "simulated";
  /** Simulated cloud services ask the user to "connect" an account first. */
  requiresConnection: boolean;
  group: "device" | "share" | "cloud";
}

export const DESTINATIONS: Destination[] = [
  { id: "download", name: "Download", description: "Save the file to this device", icon: Download, tint: "bg-slate-100 text-slate-700", mode: "real", requiresConnection: false, group: "device" },
  { id: "share-link", name: "Share link & QR", description: "A private link with the report inside it; no server involved", icon: Link2, tint: "bg-brand-50 text-brand-700", mode: "real", requiresConnection: false, group: "share" },
  { id: "email", name: "Email", description: "Send the report as an attachment", icon: Mail, tint: "bg-rose-50 text-rose-700", mode: "simulated", requiresConnection: false, group: "share" },
  { id: "google-sheets", name: "Google Sheets", description: "Write rows into a new or existing sheet", icon: Table2, tint: "bg-emerald-50 text-emerald-700", mode: "simulated", requiresConnection: true, group: "cloud" },
  { id: "google-drive", name: "Google Drive", description: "Keep exports in a Drive folder", icon: HardDrive, tint: "bg-amber-50 text-amber-700", mode: "simulated", requiresConnection: true, group: "cloud" },
  { id: "dropbox", name: "Dropbox", description: "Sync exports to an app folder", icon: FolderSync, tint: "bg-blue-50 text-blue-700", mode: "simulated", requiresConnection: true, group: "cloud" },
  { id: "onedrive", name: "OneDrive", description: "Save exports alongside your documents", icon: Cloud, tint: "bg-sky-50 text-sky-700", mode: "simulated", requiresConnection: true, group: "cloud" },
];

export const getDestination = (id: DestinationId) => DESTINATIONS.find((d) => d.id === id)!;

/** The visible steps of a background job. Durations pace the simulation; real work runs in the "build" step. */
export function stagesFor(id: DestinationId, details: DestinationDetails): JobStage[] {
  const prepare: JobStage[] = [
    { label: "Collecting expenses", durationMs: 450 },
    { label: "Building report", durationMs: 600 },
  ];
  switch (id) {
    case "download":
      return [...prepare, { label: "Preparing download", durationMs: 300 }];
    case "share-link":
      return [...prepare, { label: "Compressing into a link", durationMs: 500 }];
    case "email": {
      const n = details.recipients?.length ?? 0;
      return [...prepare, { label: "Attaching file", durationMs: 500 }, { label: `Sending to ${n} recipient${n === 1 ? "" : "s"}`, durationMs: 1100 }];
    }
    case "google-sheets":
      return [...prepare, { label: "Opening spreadsheet", durationMs: 700 }, { label: "Writing rows", durationMs: 1200 }];
    default:
      return [...prepare, { label: "Uploading", durationMs: 1400 }, { label: "Verifying upload", durationMs: 500 }];
  }
}

/** Where a simulated export "went", phrased so the UI never claims something real happened. */
export function simulatedOutcome(id: DestinationId, details: DestinationDetails, filename: string, rows: number): string {
  switch (id) {
    case "email":
      return `Simulated: would email ${filename} to ${details.recipients?.join(", ")}`;
    case "google-sheets":
      return `Simulated: would write ${rows} rows to “${details.sheetName}”`;
    default:
      return `Simulated: would upload to ${details.folder?.replace(/\/+$/, "")}/${filename}`;
  }
}
