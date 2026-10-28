"use client";

import { Check, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getDestination } from "@/lib/cloud/destinations";
import type { DestinationId } from "@/lib/cloud/types";
import { DemoBadge } from "./DemoBadge";
import { useCloud } from "./CloudProvider";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEPS = ["Opening authorization", "Checking requested access", "Saving connection"];

/** A simulated connect flow: no real sign-in page, only an account label remembered on this device. */
export function ConnectDialog({ destinationId, onClose }: { destinationId: DestinationId | null; onClose: () => void }) {
  const destination = destinationId ? getDestination(destinationId) : null;
  return (
    <Modal open={destination !== null} onClose={onClose} title={destination ? `Connect ${destination.name}` : ""}>
      {destination && <ConnectFlow destinationId={destination.id} onClose={onClose} />}
    </Modal>
  );
}

function ConnectFlow({ destinationId, onClose }: { destinationId: DestinationId; onClose: () => void }) {
  const destination = getDestination(destinationId);
  const { connect } = useCloud();
  const { toast } = useToast();
  const [account, setAccount] = useState("");
  const [step, setStep] = useState(-1);
  const Icon = destination.icon;
  const scopes =
    destinationId === "google-sheets"
      ? ["Create spreadsheets made by Expense Tracker", "Update only those spreadsheets"]
      : ["Create files in its own app folder", "No access to your other files"];

  useEffect(() => {
    if (step < 0) return;
    if (step >= STEPS.length) {
      connect(destinationId, account);
      toast(`${destination.name} connected (simulated).`, "info");
      onClose();
      return;
    }
    const timer = setTimeout(() => setStep((s) => s + 1), 650);
    return () => clearTimeout(timer);
  }, [step, connect, destinationId, account, destination.name, toast, onClose]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${destination.tint}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="text-sm">
          <p className="flex items-center gap-2 font-semibold text-slate-900">
            {destination.name} <DemoBadge />
          </p>
          <p className="text-slate-600">{destination.description}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Lock className="h-4 w-4 text-slate-500" aria-hidden /> Expense Tracker would ask to:
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {scopes.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" aria-hidden /> {s}
            </li>
          ))}
        </ul>
      </div>

      {step < 0 ? (
        <>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700">Account</span>
            <input
              type="email"
              data-autofocus
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 block w-full rounded-lg border-0 px-3 py-2 text-base text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"
            />
            <span className="mt-1 block text-xs text-slate-500">This is a demo: no password, nothing leaves your browser.</span>
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep(0)} disabled={!EMAIL.test(account)}>
              Connect
            </Button>
          </div>
        </>
      ) : (
        <ol className="space-y-2 text-sm" aria-live="polite">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              {i < step ? (
                <Check className="h-4 w-4 text-emerald-600" aria-hidden />
              ) : i === step ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden />
              ) : (
                <span className="h-4 w-4 rounded-full border border-slate-300" aria-hidden />
              )}
              <span className={i <= step ? "text-slate-900" : "text-slate-500"}>{label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
