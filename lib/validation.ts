import { isValidISODate, roundToCents, todayISO } from "./format";
import { isCategory, type Category, type ExpenseInput } from "./types";

export const MAX_AMOUNT = 1_000_000;
export const MAX_DESCRIPTION_LENGTH = 100;

/** Raw form state: amount stays a string so partial input like "12." is preserved while typing. */
export interface ExpenseFormValues {
  date: string;
  amount: string;
  category: Category | "";
  description: string;
}

export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};

  if (!values.date) {
    errors.date = "Date is required.";
  } else if (!isValidISODate(values.date)) {
    errors.date = "Enter a valid date.";
  } else if (values.date > todayISO()) {
    errors.date = "Date can't be in the future.";
  } else if (values.date < "1900-01-01") {
    errors.date = "Date is too far in the past.";
  }

  const amountText = values.amount.trim();
  if (!amountText) {
    errors.amount = "Amount is required.";
  } else if (!/^\d+(\.\d{0,2})?$/.test(amountText)) {
    errors.amount = "Enter a positive number with up to 2 decimals.";
  } else {
    const amount = Number(amountText);
    if (amount <= 0) errors.amount = "Amount must be greater than $0.";
    else if (amount > MAX_AMOUNT) errors.amount = "Amount must be $1,000,000 or less.";
  }

  if (!values.category) {
    errors.category = "Choose a category.";
  } else if (!isCategory(values.category)) {
    errors.category = "Choose a valid category.";
  }

  const description = values.description.trim();
  if (!description) {
    errors.description = "Description is required.";
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keep it under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  return errors;
}

/** Converts validated form values into an ExpenseInput. Call only after validation passes. */
export function toExpenseInput(values: ExpenseFormValues): ExpenseInput {
  return {
    date: values.date,
    amount: roundToCents(Number(values.amount)),
    category: values.category as Category,
    description: values.description.trim().replace(/\s+/g, " "),
  };
}
