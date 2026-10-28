"use client";

import { Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QR_MAX_URL_LENGTH } from "@/lib/cloud/share";
import type { ShareInfo } from "./CloudProvider";

/** Generated locally with the qrcode library; the link never leaves this device unless the user shares it. */
function useQrSvg(url: string | null) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    setSvg(null);
    if (!url || url.length > QR_MAX_URL_LENGTH) return;
    let active = true;
    import("qrcode")
      .then((QR) => QR.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "L", color: { dark: "#0f172a", light: "#ffffff" } }))
      .then((markup) => active && setSvg(markup))
      .catch(() => active && setSvg(null));
    return () => {
      active = false;
    };
  }, [url]);
  return svg;
}

export function ShareDialog({ share, onClose }: { share: ShareInfo | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const svg = useQrSvg(share?.url ?? null);
  const tooLongForQr = !!share && share.url.length > QR_MAX_URL_LENGTH;

  useEffect(() => setCopied(false), [share]);

  const copy = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (permissions, insecure context); selecting the field is the fallback.
      document.getElementById("share-url")?.focus();
    }
  };

  return (
    <Modal open={share !== null} onClose={onClose} title="Share link ready" description={share ? `${share.title} · ${share.subtitle}` : undefined}>
      {share && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
              {svg ? (
                <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" role="img" aria-label="QR code for the share link" dangerouslySetInnerHTML={{ __html: svg }} />
              ) : (
                <p className="px-2 text-center text-xs text-slate-500">
                  {tooLongForQr ? "This report is too large for a QR code. Share the link instead." : "Generating QR code…"}
                </p>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3 text-sm">
              <p className="text-slate-600">
                Anyone with this link can open a read-only snapshot of the report. Scan the code to open it on a phone.
              </p>
              <p className="text-slate-600">
                {share.expiresAt
                  ? `Stops opening after ${new Date(share.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
                  : "This link doesn't expire."}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="share-url" className="block text-xs font-medium text-slate-600">
              Link
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="share-url"
                readOnly
                value={share.url}
                onFocus={(e) => e.currentTarget.select()}
                data-autofocus
                className="block min-w-0 flex-1 rounded-lg border-0 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
              <Button variant="secondary" onClick={copy} aria-live="polite">
                {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="flex gap-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <p>
              No server involved: the report is compressed into the part of the link after <span className="font-mono">#</span>, which
              browsers never send anywhere. That also means the expiry is a courtesy: this app won&apos;t show an expired link, but anyone
              who has it could still decode the data.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
            <a
              href={share.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <ExternalLink className="h-4 w-4" aria-hidden /> Preview shared view
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}
