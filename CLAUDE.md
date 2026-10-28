# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Requires Node 18.17+ (`.nvmrc` pins 20). Next.js 14 will not run on older Node.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also type-checks and lints)
npm run lint       # next lint (eslint, next/core-web-vitals)
npm run typecheck  # tsc --noEmit
```

There is no test runner. `lib/` is framework-free TypeScript (no React or Next.js imports, except `lib/categories.ts`, which imports lucide icons), so it can be compiled with `tsc` and exercised directly in Node.

## Architecture

Next.js 14 App Router + TypeScript + Tailwind; client-only data stored in `localStorage`. There is no backend and there are no API routes.

**Layers**
- `lib/`: pure logic. `types.ts` (the `Expense` model and the `CATEGORIES` tuple, which is the single source of truth for categories), `analytics.ts` (filtering, sorting, totals, date presets), `validation.ts` (form validation), `storage.ts` (localStorage read/write with schema checks), `csv.ts`, `format.ts`, `sampleData.ts`.
- `components/providers/`: all app state, nested in `app/layout.tsx` as `ToastProvider` → `ExpenseProvider` → `ExpenseDialogProvider`.
  - `ExpenseProvider` owns the expense list. Every mutation goes through `commit()`, which updates state and a ref mirror, then writes to localStorage synchronously. It loads on mount (`isLoaded` stays false until then, and pages render skeletons) and syncs across tabs through the `storage` event.
  - `ExpenseDialogProvider` owns the single app-wide add/edit form modal and the confirm dialog. Any component opens them through `useExpenseDialogs()` (`openAdd`, `openEdit`, `requestDelete`, `confirm`); don't render `ExpenseForm` or `Modal` per page. Deletes offer Undo via `restoreExpense`.
- `app/*/page.tsx`: thin server components that export `metadata` and render a client `*View` component (`components/dashboard/DashboardView.tsx`, `components/expenses/ExpensesView.tsx`).

**Conventions that matter**
- Dates are local `YYYY-MM-DD` strings, never `Date` objects or UTC ISO timestamps. Compare them as strings, and use `parseISODate`/`toISODate` from `lib/format.ts` to avoid timezone off-by-one bugs.
- Amounts are dollars as numbers, rounded with `roundToCents`. Sum them with `sumAmounts`.
- The form keeps `amount` as a string (`ExpenseFormValues`). It becomes an `ExpenseInput` only through `toExpenseInput()` after `validateExpenseForm()` passes.
- Per-category colors, icons, and Tailwind classes live in `CATEGORY_META` (`lib/categories.ts`). Class names there must be complete literal strings so Tailwind's content scan picks them up. Adding a category means updating `CATEGORIES` and `CATEGORY_META`.
- The storage key is versioned (`expense-tracker:expenses:v1`). If you change the `Expense` shape, bump the key or add a migration in `storage.ts`, because `isExpense()` silently drops records that don't match.
- Modals use the native `<dialog>` element (`components/ui/Modal.tsx`), which renders in the browser top layer above toasts.
- Charts use Recharts (`components/dashboard/*Chart*`, `CategoryBreakdown`). They must stay in `"use client"` components.

**Export (`lib/export/`, `components/export/`)**
- Formats are pluggable: each implements `ExportFormat` (`id`, `label`, `extension`, `mimeType`, `build(context, settings) → Promise<Blob>`) and is registered in `EXPORT_FORMATS` in `lib/export/index.ts`. Adding a format means a new module in `lib/export/formats/`, a settings entry in `FormatSettings`, a default in `preferences.ts`, and its controls in `ExportOptionsPanel`.
- `runExport(expenses, options)` is the only entry point. It selects records (`selectForExport`: inclusive date range, explicit category list, where an empty list exports nothing), builds the blob, and names the file (`withExtension`). `lib/export` has no React imports, so it can be tested in Node; the PDF format needs `NODE_PATH` pointing at `node_modules` because it dynamic-imports jsPDF.
- The PDF format dynamic-imports `jspdf` and `jspdf-autotable`; keep it that way so they stay out of the page bundle. jsPDF's built-in fonts only cover WinAnsi, so text goes through `toPdfText()`.
- The UI is a side `Sheet` (`components/ui/Sheet.tsx`, native `<dialog>`) opened from the Expenses page with the list's date and category filters as the starting scope. `useExportDraft` holds the draft; it is mounted only while the sheet is open so each opening starts fresh. Format, sort and per-format settings persist in `expense-tracker:export-preferences:v1`; scope and filename never do.
