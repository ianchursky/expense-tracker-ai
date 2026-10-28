"use client";

import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CATEGORY_META } from "@/lib/categories";
import { todayISO } from "@/lib/format";
import { CATEGORIES, type Expense, type ExpenseInput } from "@/lib/types";
import {
  MAX_DESCRIPTION_LENGTH,
  toExpenseInput,
  validateExpenseForm,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from "@/lib/validation";

interface ExpenseFormProps {
  initial?: Expense;
  onSubmit: (input: ExpenseInput) => void;
  onCancel: () => void;
  /** Shown only when editing. */
  onDelete?: () => void;
}

function initialValues(expense?: Expense): ExpenseFormValues {
  return expense
    ? {
        date: expense.date,
        amount: expense.amount.toFixed(2),
        category: expense.category,
        description: expense.description,
      }
    : { date: todayISO(), amount: "", category: "", description: "" };
}

const inputClass =
  "block w-full rounded-lg border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset sm:text-sm";

function fieldRing(error?: string) {
  return error ? "ring-red-300 focus:ring-red-500" : "ring-slate-300 focus:ring-brand-600";
}

export function ExpenseForm({ initial, onSubmit, onCancel, onDelete }: ExpenseFormProps) {
  const id = useId();
  const [values, setValues] = useState<ExpenseFormValues>(() => initialValues(initial));
  const [touched, setTouched] = useState<Partial<Record<keyof ExpenseFormValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors: ExpenseFormErrors = validateExpenseForm(values);
  const visibleError = (field: keyof ExpenseFormValues) =>
    submitted || touched[field] ? errors[field] : undefined;

  const set = <K extends keyof ExpenseFormValues>(field: K, value: ExpenseFormValues[K]) =>
    setValues((v) => ({ ...v, [field]: value }));
  const touch = (field: keyof ExpenseFormValues) => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      // Move focus to the first invalid field.
      const firstInvalid = (["amount", "date", "category", "description"] as const).find((f) => errors[f]);
      if (firstInvalid) document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }
    onSubmit(toExpenseInput(values));
  };

  const amountError = visibleError("amount");
  const dateError = visibleError("date");
  const categoryError = visibleError("category");
  const descriptionError = visibleError("description");

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-amount`} className="block text-sm font-medium text-slate-700">
            Amount
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 sm:text-sm">
              $
            </span>
            <input
              id={`${id}-amount`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              data-autofocus
              value={values.amount}
              onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
              onBlur={() => {
                touch("amount");
                const n = Number(values.amount);
                if (values.amount && /^\d+(\.\d{0,2})?$/.test(values.amount) && n > 0) set("amount", n.toFixed(2));
              }}
              aria-invalid={!!amountError}
              aria-describedby={amountError ? `${id}-amount-error` : undefined}
              className={clsx(inputClass, fieldRing(amountError), "pl-7 tabular-nums")}
            />
          </div>
          {amountError && (
            <p id={`${id}-amount-error`} className="mt-1.5 text-sm text-red-600">
              {amountError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-date`} className="block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id={`${id}-date`}
            type="date"
            max={todayISO()}
            value={values.date}
            onChange={(e) => set("date", e.target.value)}
            onBlur={() => touch("date")}
            aria-invalid={!!dateError}
            aria-describedby={dateError ? `${id}-date-error` : undefined}
            className={clsx(inputClass, fieldRing(dateError), "mt-1.5 px-3")}
          />
          {dateError && (
            <p id={`${id}-date-error`} className="mt-1.5 text-sm text-red-600">
              {dateError}
            </p>
          )}
        </div>
      </div>

      <fieldset>
        <legend id={`${id}-category-legend`} className="block text-sm font-medium text-slate-700">
          Category
        </legend>
        <div
          role="radiogroup"
          aria-labelledby={`${id}-category-legend`}
          aria-invalid={!!categoryError}
          aria-describedby={categoryError ? `${id}-category-error` : undefined}
          className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {CATEGORIES.map((category, index) => {
            const { icon: Icon, iconClass } = CATEGORY_META[category];
            const selected = values.category === category;
            return (
              <label
                key={category}
                className={clsx(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600",
                  selected
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : categoryError
                      ? "border-red-300 text-slate-700 hover:bg-slate-50"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {/* Also referenced per option so the error is read when any option takes focus. */}
                <input
                  id={index === 0 ? `${id}-category` : undefined}
                  type="radio"
                  name={`${id}-category`}
                  value={category}
                  checked={selected}
                  aria-describedby={categoryError ? `${id}-category-error` : undefined}
                  onChange={() => {
                    set("category", category);
                    touch("category");
                  }}
                  className="sr-only"
                />
                <span className={clsx("flex h-6 w-6 items-center justify-center rounded-md", iconClass)}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                {category}
              </label>
            );
          })}
        </div>
        {categoryError && (
          <p id={`${id}-category-error`} className="mt-1.5 text-sm text-red-600">
            {categoryError}
          </p>
        )}
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${id}-description`} className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <span
            className={clsx(
              "text-xs tabular-nums",
              values.description.trim().length > MAX_DESCRIPTION_LENGTH ? "text-red-600" : "text-slate-500",
            )}
          >
            {values.description.trim().length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <input
          id={`${id}-description`}
          type="text"
          placeholder="e.g. Weekly groceries"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          onBlur={() => touch("description")}
          aria-invalid={!!descriptionError}
          aria-describedby={descriptionError ? `${id}-description-error` : undefined}
          className={clsx(inputClass, fieldRing(descriptionError), "mt-1.5 px-3")}
        />
        {descriptionError && (
          <p id={`${id}-description-error`} className="mt-1.5 text-sm text-red-600">
            {descriptionError}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center">
        {onDelete && (
          <Button variant="ghost" onClick={onDelete} className="!text-red-700 hover:!bg-red-50 hover:!text-red-800 sm:mr-auto">
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </Button>
        )}
        <Button variant="secondary" onClick={onCancel} className="sm:ml-auto">
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save changes" : "Add expense"}</Button>
      </div>
    </form>
  );
}
