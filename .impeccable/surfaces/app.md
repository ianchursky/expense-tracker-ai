---
version: 1
slug: "app"
primary_target: "app"
related_targets: ["app/expenses","components"]
---

# Surface brief: Expense Tracker app (Dashboard + Expenses)

Scope: the whole app shell, `/` Dashboard and `/expenses`, plus the add/edit and confirm dialogs. Mode: Operate.
Audience and job: evaluators skimming a portfolio piece, and individuals logging and reviewing personal spending.
Constraints: keep all current behavior (validation, Undo, filters, CSV export, cross-tab sync). Not playful, not a dark "hacker" look. Privacy/local-first messaging is deferred to the later onboard and clarify steps.
Unresolved: the privacy indicator and import are planned separately (harden, onboard).

## Direction contract

THESIS: A modern personal-finance dashboard at Monarch Money's craft level. It refuses nothing about the category's arrangement; the category standard is the commitment. It refuses the indigo-SaaS-template finish: weak hierarchy, decorative icon chips, and loose spacing.

OWN-WORLD: A calm light-gray ground (slate-50) with white cards, 1px slate-200 borders, 12-14px radius, and no heavy shadows. Inter at a real type scale, with tabular figures. One green accent (green-700) for primary actions and the active nav. Category hues are used only as data series and chips. Red and green appear on deltas only.

STORY: The visitor sees this month's spending and how it compares, then where the money went, then the latest transactions, and can add an expense from anywhere in one click.

FIRST VIEWPORT: A left sidebar (240px) with the wordmark, Dashboard and Expenses, and the primary "Add expense" button. The main area has the page title row, four KPI cards, then a 3:2 row with a spending-trend area chart beside the category breakdown, and recent transactions below. On mobile, a top bar plus a bottom tab bar with Add in the thumb zone.

FORM: canon (the standing exit, chosen over the assigned "Personal Annual Report"; not on the ordered list). seed:65ddbfaa86c81da1

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
