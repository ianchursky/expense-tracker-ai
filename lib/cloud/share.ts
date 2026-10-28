import type { Cell, TemplateOutput } from "./types";

/**
 * A read-only snapshot that travels entirely inside a link's #fragment. Browsers never send the fragment to a
 * server, so sharing works without any backend, and nothing about the data is stored anywhere but the link.
 */
export interface ShareSnapshot {
  v: 1;
  title: string;
  subtitle: string;
  highlights: { label: string; value: string }[];
  columns: string[];
  rows: Cell[][];
  /** Rows in the full report; the snapshot may carry fewer to keep links short. */
  totalRows: number;
  createdAt: string;
  /** Advisory: this app refuses to show an expired snapshot, but the data is still inside the link. */
  expiresAt: string | null;
}

/** Keeps links (and their QR codes) a reasonable size. */
export const MAX_SHARED_ROWS = 40;
/** Version-2 QR codes top out near 2.9 kB in byte mode; leave headroom for error correction. */
export const QR_MAX_URL_LENGTH = 1800;

export function snapshotFrom(output: TemplateOutput, expiresInDays: number | null, now = new Date()): ShareSnapshot {
  return {
    v: 1,
    title: output.title,
    subtitle: output.subtitle,
    highlights: output.highlights,
    columns: output.columns,
    rows: output.rows.slice(0, MAX_SHARED_ROWS),
    totalRows: output.rows.length,
    createdAt: now.toISOString(),
    expiresAt: expiresInDays ? new Date(now.getTime() + expiresInDays * 86_400_000).toISOString() : null,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** "z." + deflated JSON when the browser supports compression streams, otherwise "j." + plain JSON. */
export async function encodeSnapshot(snapshot: ShareSnapshot): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(snapshot));
  if (typeof CompressionStream === "function") {
    return `z.${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`;
  }
  return `j.${toBase64Url(json)}`;
}

function isSnapshot(value: unknown): value is ShareSnapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    s.v === 1 &&
    typeof s.title === "string" &&
    typeof s.subtitle === "string" &&
    Array.isArray(s.highlights) &&
    Array.isArray(s.columns) &&
    Array.isArray(s.rows) &&
    s.rows.every((r) => Array.isArray(r) && r.every((c) => typeof c === "string" || typeof c === "number")) &&
    typeof s.totalRows === "number" &&
    typeof s.createdAt === "string" &&
    (s.expiresAt === null || typeof s.expiresAt === "string")
  );
}

/** Throws a user-facing message when the token is damaged or from an unknown version. */
export async function decodeSnapshot(token: string): Promise<ShareSnapshot> {
  try {
    const [kind, body] = [token.slice(0, 2), token.slice(2)];
    let bytes = fromBase64Url(body);
    if (kind === "z.") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    else if (kind !== "j.") throw new Error();
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!isSnapshot(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error("This link is incomplete or damaged. Ask the sender to share it again.");
  }
}

export function shareUrl(origin: string, token: string): string {
  return `${origin}/shared#${token}`;
}
