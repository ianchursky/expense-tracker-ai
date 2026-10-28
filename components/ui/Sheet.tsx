"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Blocks Esc and backdrop dismissal, e.g. while a long operation is running. */
  dismissible?: boolean;
  children: ReactNode;
}

/**
 * Right-hand side sheet on the native <dialog>, which supplies focus trapping, inert background and Esc.
 * Suited to task panels with many controls, where a centered modal would cramp the content.
 */
export function Sheet({ open, onClose, title, description, dismissible = true, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        if (!dismissible) e.preventDefault();
      }}
      onClose={onClose}
      onClick={(e) => {
        if (dismissible && e.target === ref.current) onClose();
      }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-slate-900/40 backdrop:animate-fade-in sm:max-w-[min(100vw,64rem)] motion-reduce:backdrop:animate-none"
    >
      {open && (
        <div className="flex h-full animate-sheet-in flex-col bg-white shadow-2xl motion-reduce:animate-none sm:border-l sm:border-slate-200">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-0.5 text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={!dismissible}
              className="-mr-1.5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      )}
    </dialog>
  );
}
