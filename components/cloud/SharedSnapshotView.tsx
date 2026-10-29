"use client";

import { Clock, Eye, LinkIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Skeleton } from "@/components/ui/Card";
import { categoryLabel } from "@/lib/categories";
import { decodeSnapshot, type ShareSnapshot } from "@/lib/cloud/share";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "expired"; snapshot: ShareSnapshot } | { status: "ready"; snapshot: ShareSnapshot };

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** Reads the report out of the URL fragment on the recipient's device; nothing is fetched. */
export function SharedSnapshotView() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const load = () => {
      const token = window.location.hash.slice(1);
      if (!token) return setState({ status: "error", message: "This link is missing its report. Ask the sender to share it again." });
      decodeSnapshot(token)
        .then((snapshot) =>
          setState(snapshot.expiresAt && new Date(snapshot.expiresAt) < new Date() ? { status: "expired", snapshot } : { status: "ready", snapshot }),
        )
        .catch((e: Error) => setState({ status: "error", message: e.message }));
    };
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Opening shared report">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (state.status !== "ready") {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {state.status === "expired" ? <Clock className="h-6 w-6" aria-hidden /> : <LinkIcon className="h-6 w-6" aria-hidden />}
        </span>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">{state.status === "expired" ? "This link has expired" : "Can't open this link"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {state.status === "expired"
            ? `The sender set it to stop opening on ${longDate(state.snapshot.expiresAt!)}. Ask them for a new link.`
            : state.message}
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Go to Expense Tracker
        </Link>
      </Card>
    );
  }

  const { snapshot } = state;
  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        <Eye className="h-3.5 w-3.5" aria-hidden /> Shared report · read-only
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{snapshot.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {snapshot.subtitle} · shared {longDate(snapshot.createdAt)}
        {snapshot.expiresAt && ` · opens until ${longDate(snapshot.expiresAt)}`}
      </p>

      <Card className="mt-6 overflow-hidden">
        <dl className="grid grid-cols-2 gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
          {snapshot.highlights.map((h) => (
            <div key={h.label}>
              <dt className="text-xs font-medium text-slate-500">{h.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums">{categoryLabel(h.value)}</dd>
            </div>
          ))}
        </dl>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {snapshot.columns.map((c) => (
                  <th key={c} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshot.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={typeof cell === "number" ? "px-5 py-2.5 text-right tabular-nums text-slate-900" : "px-5 py-2.5 text-slate-700"}>
                      {typeof cell === "number" && snapshot.columns[j].includes("USD")
                        ? cell.toLocaleString("en-US", { style: "currency", currency: "USD" })
                        : snapshot.columns[j] === "Category"
                          ? categoryLabel(String(cell))
                          : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {snapshot.totalRows > snapshot.rows.length && (
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {snapshot.rows.length} of {snapshot.totalRows} rows. The sender kept the link short; ask them for the full file.
          </p>
        )}
      </Card>

      <p className="mt-6 flex gap-2 text-xs leading-relaxed text-slate-500">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        This report travelled inside the link itself and was opened on your device. No server stored or received it.
      </p>
    </div>
  );
}
