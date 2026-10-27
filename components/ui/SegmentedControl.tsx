"use client";

import { clsx } from "clsx";

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={clsx(
            "whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === option.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
