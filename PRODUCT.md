# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily a portfolio and demo piece. The main audience is people evaluating the author's craft (portfolio visitors, interviewers, reviewers), who open it briefly to judge quality, polish, and engineering judgment. Real day-to-day use by someone tracking their own personal spending is secondary but should be credible: the app has to hold up as something a person could actually use.

## Product Purpose

A personal expense tracker. You record expenses (date, amount, category, description), browse and filter them, see spending summaries and charts, and export to CSV. Success means it demonstrates production-grade craft (complete flows, validation, edge cases, responsive layout, accessibility) while working as a usable tool.

## Positioning

Private and local-first. There's no account, no server, and no bank linking. Every expense stays in the visitor's own browser.

## Operating Context

- Evaluators usually arrive with no data. "Load sample data" (six months of realistic, generated expenses) is how they see the populated dashboard quickly.
- Used on both desktop and phone browsers.
- Data lives only in that browser's localStorage. Clearing site data erases it; CSV export is the only way to get data out.

## Capabilities and Constraints

- Add, edit, and delete expenses. Deletes can be undone, and there's a confirmed "Delete all".
- Validation: amount greater than $0 and up to $1,000,000, with at most 2 decimals; a date that's valid and not in the future; a required category; a required description of up to 100 characters.
- Expenses list: search, filter by category and date range (with presets), sort by any column, and export the current view to CSV.
- Dashboard: total, this month vs. last month, daily average, top category, 6-month trend, category breakdown, and recent expenses.
- Syncs across open tabs. Corrupted saved data is detected and reported instead of crashing.
- Stack: Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts. No backend.
- **Open decisions** (current behavior, not yet confirmed as commitments): localStorage-only storage, USD as the only currency, the six fixed categories (Food, Transportation, Entertainment, Shopping, Bills, Other) with no custom ones, and the plain name "Expense Tracker".

## Brand Commitments

- Visual direction: the category standard for personal finance, executed at full craft without irony. Monarch Money's craft level is the quality bar. The user chose this over a distinctive, privacy-led identity in the October 2026 direction round.

## Evidence on Hand

- The only data is generated sample data (`lib/sampleData.ts`). There are no real users, testimonials, usage metrics, or press, and future work must not invent any.
- No logo or brand assets exist beyond a generic wallet icon.

## Product Principles

1. **Privacy is the feature.** Nothing leaves the browser, so don't add accounts, telemetry, or third-party data calls without an explicit decision.
2. **Credible as a real tool, not a mockup.** Every visible control works, and edge cases (empty, invalid, corrupted, huge lists) are handled.
3. **Show it in seconds.** An evaluator should reach a populated, meaningful view within a click or two of arriving.
4. **Craft is in the details.** Validation, feedback, keyboard and screen-reader support, and mobile layout get the same care as the headline screens.
