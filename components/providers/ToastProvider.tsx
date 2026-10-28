"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";

type ToastVariant = "success" | "error" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const ICON_CLASSES = { success: "text-brand-600", error: "text-red-600", info: "text-slate-500" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  // Each toast tracks its remaining time so the countdown can pause while the user hovers or focuses it
  // (an Undo that vanishes mid-reach fails WCAG 2.2.1, Timing Adjustable).
  const timers = useRef(new Map<number, { handle?: ReturnType<typeof setTimeout>; deadline: number; remaining: number }>());
  const paused = useRef(false);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id)?.handle);
    timers.current.delete(id);
  }, []);

  const start = useCallback(
    (id: number, ms: number) => {
      timers.current.set(id, { handle: setTimeout(() => dismiss(id), ms), deadline: Date.now() + ms, remaining: ms });
    },
    [dismiss],
  );

  const pause = useCallback(() => {
    if (paused.current) return;
    paused.current = true;
    timers.current.forEach((t) => {
      clearTimeout(t.handle);
      t.handle = undefined;
      t.remaining = Math.max(t.deadline - Date.now(), 1500);
    });
  }, []);

  const resume = useCallback(() => {
    if (!paused.current) return;
    paused.current = false;
    timers.current.forEach((t, id) => start(id, t.remaining));
  }, [start]);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success", action?: ToastAction) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { id, message, variant, action }]);
      const duration = variant === "error" || action ? 6000 : 3500;
      if (paused.current) timers.current.set(id, { deadline: Date.now() + duration, remaining: duration });
      else start(id, duration);
    },
    [start],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => clearTimeout(t.handle));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Each toast is its own status/alert live region, so the container must not be one too. */}
      <div
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resume();
        }}
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6 lg:bottom-0"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm animate-slide-in items-start motion-reduce:animate-none gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-slate-900/10"
            >
              <Icon className={clsx("mt-0.5 h-5 w-5 shrink-0", ICON_CLASSES[t.variant])} aria-hidden />
              <p className="flex-1 text-sm font-medium text-slate-800">{t.message}</p>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                  className="rounded-md px-2 py-0.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded-md p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
