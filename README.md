# Expense Tracker

A personal expense tracker built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Recharts. Data is stored in your browser's `localStorage`. There's no account and no server.

## Features

- **Dashboard**: total spending, this month's spending vs. last month, daily average, and top category. It also has a 6-month spending bar chart, a category donut chart (this month or all time), and your recent expenses.
- **Expenses**: search, filter by category and date range (with quick presets), sort by any column, edit, delete (with Undo), and delete all.
- **Add/edit form**: validation for amount (positive, at most 2 decimals, up to $1M), date (valid and not in the future), category, and description (up to 100 characters), with a native date picker.
- **CSV export** of the currently filtered list. Cells are escaped to prevent spreadsheet formula injection.
- **Responsive layout**: a table on desktop and stacked cards on mobile.
- **Feedback**: toasts, loading skeletons, empty states, a warning if browser storage fails, and sync across open tabs.

## Running

Requires **Node.js 18.17 or newer** (20 LTS recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For a production build:

```bash
npm run build
npm start
```

Other scripts: `npm run lint` and `npm run typecheck`.
