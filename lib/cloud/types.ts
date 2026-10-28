export type TemplateId = "tax-report" | "monthly-summary" | "category-analysis" | "full-backup";
export type DestinationId = "download" | "share-link" | "email" | "google-sheets" | "google-drive" | "dropbox" | "onedrive";
export type FileFormat = "csv" | "json";
export type Frequency = "daily" | "weekly" | "monthly";

/** What slice of time a template covers. `value` is `YYYY` for years and `YYYY-MM` for months. */
export type Period = { kind: "year"; value: string } | { kind: "month"; value: string } | { kind: "all" };

export type Cell = string | number;

/** A template's rendered result, independent of file format, so every destination can show or ship it. */
export interface TemplateOutput {
  title: string;
  subtitle: string;
  columns: string[];
  rows: Cell[][];
  /** Headline figures shown above the table and in share snapshots. */
  highlights: { label: string; value: string }[];
  /** Number of source expenses the output summarizes. */
  sourceCount: number;
}

/** Destination-specific inputs gathered by the composer. */
export interface DestinationDetails {
  recipients?: string[];
  subject?: string;
  message?: string;
  sheetName?: string;
  folder?: string;
  /** Share links: days until the link stops opening, or null for no expiry. */
  expiresInDays?: number | null;
}

export interface ExportRequest {
  templateId: TemplateId;
  period: Period;
  format: FileFormat;
  destinationId: DestinationId;
  details: DestinationDetails;
  /** Set when a schedule created the request. */
  scheduleId?: string;
}

export type JobStatus = "queued" | "waiting-online" | "running" | "completed" | "failed" | "cancelled";

export interface JobStage {
  label: string;
  /** Simulated duration; real work happens inside the stage that needs it. */
  durationMs: number;
}

/** A finished export, as kept in history. */
export interface ExportRecord {
  id: string;
  request: ExportRequest;
  status: "completed" | "failed" | "cancelled";
  createdAt: string;
  finishedAt: string;
  filename: string;
  bytes: number;
  rowCount: number;
  /** What happened, in the user's terms ("Downloaded", "Simulated: sent to 2 recipients"). */
  outcome: string;
  /** Share links only. */
  shareUrl?: string;
  shareExpiresAt?: string | null;
  error?: string;
}

export interface Connection {
  destinationId: DestinationId;
  account: string;
  connectedAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  templateId: TemplateId;
  destinationId: DestinationId;
  format: FileFormat;
  frequency: Frequency;
  /** 0–23, local time. */
  hour: number;
  /** 0 (Sun) – 6 (Sat); weekly only. */
  weekday: number;
  /** 1–28; monthly only, capped so every month has the day. */
  dayOfMonth: number;
  enabled: boolean;
  /** Destination inputs reused on every run, e.g. email recipients or a cloud folder. */
  details: DestinationDetails;
  createdAt: string;
  lastRunAt: string | null;
}
