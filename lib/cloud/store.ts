import type { Connection, ExportRecord, Schedule } from "./types";

export const CLOUD_KEY = "expense-tracker:cloud:v1";
/** History is a convenience log, not an archive; keep it small enough for localStorage. */
export const HISTORY_LIMIT = 50;

export interface CloudState {
  connections: Connection[];
  history: ExportRecord[];
  schedules: Schedule[];
}

export const EMPTY_CLOUD_STATE: CloudState = { connections: [], history: [], schedules: [] };

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

/** Drops malformed entries instead of failing the whole hub, so a bad record never locks the user out. */
export function parseCloudState(raw: string | null): CloudState {
  if (!raw) return EMPTY_CLOUD_STATE;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value)) return EMPTY_CLOUD_STATE;
    const list = (key: string) => (Array.isArray(value[key]) ? (value[key] as unknown[]) : []);
    return {
      connections: list("connections").filter(
        (c): c is Connection => isObject(c) && typeof c.destinationId === "string" && typeof c.account === "string",
      ),
      history: list("history")
        .filter((h): h is ExportRecord => isObject(h) && typeof h.id === "string" && isObject(h.request) && typeof h.finishedAt === "string")
        .slice(0, HISTORY_LIMIT),
      schedules: list("schedules").filter(
        (s): s is Schedule => isObject(s) && typeof s.id === "string" && typeof s.frequency === "string" && isObject(s.details),
      ),
    };
  } catch {
    return EMPTY_CLOUD_STATE;
  }
}

export function loadCloudState(): CloudState {
  try {
    return parseCloudState(window.localStorage.getItem(CLOUD_KEY));
  } catch {
    return EMPTY_CLOUD_STATE;
  }
}

export function saveCloudState(state: CloudState): void {
  try {
    window.localStorage.setItem(CLOUD_KEY, JSON.stringify(state));
  } catch {
    // Non-critical: the hub keeps working for this session.
  }
}
