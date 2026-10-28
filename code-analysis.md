# Data export: code analysis of three implementations

Analysis date: 2026-10-28. All three versions branch from the same base commit (`ddbd699`, "Initial commit"). Each one replaces the export on the Expenses page. None of them builds on another.

| Version | Branch | Commit | Approach |
|---|---|---|---|
| v1 | `main` (there is no `feature-data-export-v1` branch; the one-button CSV export *is* the baseline) | `ddbd699` | One button, CSV of the visible list |
| v2 | `feature-data-export-v2` | `a1ed47c` | Side sheet with CSV, JSON and PDF, filters, a live preview and persisted preferences |
| v3 | `feature-data-export-v3` | `00d16b6` | Export Hub page with templates, destinations (two real, five simulated), a job queue, schedules, history, and share links with QR codes |

The `redesign/category-standard` branch (PR #1) is not an export version. It does matter for adoption, though: it adds a CSV importer and Export all, and both depend on `lib/csv.ts`, which v2 and v3 delete (see [Integration risks](#integration-risks)).

## How this was measured

- **Code reading:** I checked out each branch and read every created or modified file (`git diff main...<branch>`).
- **Bundle sizes:** each branch got a clean `npm ci && next build` in its own scratch worktree, and I took the sizes from Next's build output. I identified lazy chunks by grepping `.next/static/chunks` and gzipped them to size them.
- **Runtime:**
  - Each branch's `lib/` was compiled with `tsc` to CommonJS and run in Node 24 on synthetic data: 1,000 and 10,000 expenses over about 600 days, with quotes, commas, accents and a formula-injection string in the descriptions.
  - Timings are single runs on one Windows machine. Read them as orders of magnitude, not exact figures.
- **Round-trip:** v2 and v3 output was fed into the CSV importer from `redesign/category-standard` (`lib/csvImport.ts`, `previewImport`).

---

## Summary comparison

| | v1 | v2 | v3 |
|---|---|---|---|
| Lines added (components, lib, app) | about 40 (baseline) | 1,365 | 2,514 |
| New source files | 0 | 13 | 19 |
| Runtime dependencies added | none | `jspdf`, `jspdf-autotable` (23 packages in the lockfile) | `qrcode` (24 packages in the lockfile, mostly its CLI's `yargs` tree, which is not bundled) |
| `/expenses` first-load JS | 101 kB | 111 kB (+10) | 117 kB (+16)¹ |
| Other routes | none | none | `/exports` 123 kB, `/shared` 100 kB |
| Lazy chunks | none | PDF: jsPDF 105 kB gz + autotable 10 kB gz, on first PDF export | QR: 9 kB gz, when the share dialog opens |
| Formats | CSV | CSV (`,` `;` tab), JSON, PDF | CSV, JSON (per template) |
| What gets exported | Exactly the visible list (search + date + category filters) | Any inclusive date range plus any set of categories; ignores search text | One of 4 templates over a fixed period (year, month or all time). No arbitrary range or category filter |
| Preview before export | none | Live: stats, category bar, first 100 rows | Review step: email, spreadsheet or table preview, first 5 rows |
| Delivery | Download | Download | Download, share link + QR (real); Email, Sheets, Drive, Dropbox, OneDrive (simulated, Demo-badged) |
| Async / background | Synchronous | Async with spinner (blocks the main thread during PDF) | Staged job queue, cancel, offline wait, progress tray |
| Persistence | none | Format, sort and per-format settings | Connections, schedules, history (50) |
| Re-importable output² | Yes (it is the importer's reference format) | `,` CSV yes; `;` and tab CSV rejected; JSON and PDF no importer | Full Backup CSV yes; other templates are aggregates (rejected by design); JSON no importer |
| Time to file, 1k rows (CSV) | about 3 ms, instant | about 5 ms + 400 ms minimum spinner | about 2 ms + 1.35 s of simulated stages |

¹ v3 also moves the CSV code out of the Expenses page; the composer and the `CloudProvider` context account for the rise.
² This is tested against the redesign branch's importer, which only exists there.

---

## v1: one-button CSV (`main`)

### Files

| File | Role |
|---|---|
| `lib/csv.ts` (32 lines) | `expensesToCSV()` and `downloadCSV()` |
| `components/expenses/ExpensesView.tsx` | `handleExport` and the **Export CSV** button in the page header |

### Architecture
v1 has two pure functions and one handler, with no component, state, or configuration of its own. `ExpensesView` already holds the filtered and sorted list (`visible`, a `useMemo` over `filterExpenses` and `sortExpenses`), and the export serializes that array.

### How it works
1. The click calls `handleExport` (`ExpensesView.tsx:51`).
2. `expensesToCSV(visible)` builds a header plus rows: `Date, Category, Description, Amount (USD)`. Amounts use `toFixed(2)` and lines are joined with `\r\n`.
3. `downloadCSV()` wraps the text in a `Blob` with a UTF-8 BOM, creates an object URL, clicks a temporary `<a download>`, removes it, and revokes the URL **immediately**.
4. A toast reports the count. The filename is `expenses-YYYY-MM-DD.csv` (local date, via `todayISO()`).

### Libraries
None beyond the browser's `Blob`, `URL.createObjectURL` and `<a download>`.

### State management
None of its own. It reads the view's derived `visible` list.

### Error handling and edge cases
- The whole export is wrapped in `try/catch` and failures show a toast. The button is disabled when `visible.length === 0`.
- **Formula injection:** a description starting with `= + - @ \t \r` gets a leading `'` (`csv.ts:7`). Category and date can't start with those characters, and amounts are never negative because validation rejects them.
- **Quoting:** cells with `" , \r \n` are quoted and inner quotes are doubled (RFC 4180). The BOM keeps accents correct in Excel.
- `URL.revokeObjectURL` runs synchronously after `click()`. That works in current Chromium, but some browsers start the download asynchronously and can lose the blob. v2 and v3 defer the revoke for this reason.

### Security
- Nothing leaves the device and there is no new attack surface.
- Formula injection is handled. Files land wherever the browser saves downloads, so their privacy is the user's responsibility.

### Performance
Linear and synchronous. Measured: 1k rows in about 3 ms (60 KB), 10k rows in about 13 ms (613 KB). No bundle cost.

### Extensibility and maintainability
- It is trivial to read and test.
- Adding a format or a filter means adding UI to `ExpensesView`, which isn't designed for it. v1 is a baseline, not a platform.
- "Export what you see" is a strong, predictable mental model. Search text is included, so a search for "coffee" exports only coffee.

### Complexity
Very low: one handler, two functions, and no branching beyond the empty check.

---

## v2: advanced export sheet (`feature-data-export-v2`)

### Files

| File | Lines | Role |
|---|---|---|
| `lib/export/types.ts` | 58 | `ExportFormat` plugin interface, `ExportScope`, `ExportOptions`, `FormatSettings`, `ExportSelection` |
| `lib/export/index.ts` | 47 | `EXPORT_FORMATS` registry, `runExport()` entry point, `downloadBlob()` |
| `lib/export/select.ts` | 40 | `selectForExport()` (filter, sort, totals, date span), `countByCategoryInRange()` |
| `lib/export/filename.ts` | 38 | `sanitizeFilename`, `validateFilename`, `defaultFilename`, `withExtension` |
| `lib/export/preferences.ts` | 57 | Persisted format, sort and settings (`expense-tracker:export-preferences:v1`), merged field by field over defaults |
| `lib/export/formats/csv.ts` | 26 | Delimiter-aware CSV with BOM and the formula guard |
| `lib/export/formats/json.ts` | 42 | Versioned document (`$schema`, `version: 1`, scope, summary, full records with ids and timestamps) |
| `lib/export/formats/pdf.ts` | 134 | jsPDF report: header, key figures, optional category table, transactions table, page X of Y footer |
| `components/export/useExportDraft.ts` | 87 | `useReducer` draft with typed actions; the filename follows the scope until edited |
| `components/export/ExportSheet.tsx` | 247 | Orchestrates preview, validation (`blocker`), the export phase machine, and the Ctrl/⌘+Enter shortcut |
| `components/export/ExportOptionsPanel.tsx` | 378 | Format cards, range presets plus custom dates, category toggles with counts, sort, per-format settings, filename |
| `components/export/ExportPreview.tsx` | 121 | Stats, category share bar, the first 100 rows, and the empty state |
| `components/ui/Sheet.tsx` | 76 | Generic right-side sheet on native `<dialog>`, with `dismissible` lock |
| Modified | | `ExpensesView.tsx` (opens the sheet, seeded with list filters), `tailwind.config.ts` (`sheet-in` and `fade-in` animations), `package.json`, `CLAUDE.md`; `lib/csv.ts` deleted |

### Architecture
Two clean layers:

- **`lib/export/` is framework-free domain logic** with a single entry point, `runExport(expenses, options)`: select, then `format.build()` into a `Blob`, then name the file. Formats are plugins that implement `ExportFormat<K>` and are keyed in a mapped-type registry (`{ [K in ExportFormatId]: ExportFormat<K> }`), so each format's `build` receives its own settings type.
- **`components/export/` is the UI.** `ExportSheet` is a thin shell that mounts `ExportWorkspace` only while open, so each opening starts fresh from the list's current filters. All draft state lives in one reducer (`useExportDraft`).

### Key components
- **`ExportSheet` / `ExportWorkspace`** compute two selections:
  - a live one for the footer count and validation;
  - a `useDeferredValue` one for the preview, which dims while stale.

  Validation collapses into one `blocker` string. Phases are a discriminated union (`idle | working | done | error`).
- **`ExportOptionsPanel`** holds all controls. Errors attach to their `<fieldset>` via `aria-describedby`, and the controls use `aria-pressed` and `aria-invalid`.
- **`ExportPreview`** is a read-only view of the selection, capped at 100 rows, with a note that the file contains all rows.
- **`Sheet`** is a reusable primitive. It can block Esc and backdrop dismissal while busy.

### Libraries
- **`jspdf` 4.x and `jspdf-autotable` 5.x** are dynamically imported inside `buildPdf`, so the 115 kB gz only loads on the first PDF export.
- Webpack also emits `html2canvas` and DOMPurify chunks, which are optional jsPDF dependencies used only by `doc.html()`. They are never requested, but they add 23 packages to the lockfile.

### How it works
1. **Selection:** `inScope` applies an inclusive string compare on `YYYY-MM-DD` (following the project's convention) and checks category membership. An **empty category list selects nothing** on purpose, rather than meaning "all". Sorting uses comparators with tie-breakers (`createdAt`, then date), so output order is deterministic.
2. **CSV:** the delimiter can be `,`, `;` or tab. Quoting is delimiter-aware, the formula guard applies to every cell, and the file has a BOM.
3. **JSON:**
   - The JSON document is self-describing: `$schema`, `version`, `generatedAt`, `currency`, scope, a summary with by-category totals, and full records including `id`, `createdAt` and `updatedAt`.
   - This makes it the only export across all three versions that keeps record identity, so it could support a lossless restore.
4. **PDF:**
   - Built with jsPDF in points on Letter paper, with brand colors and autotable zebra rows. The footer is drawn in `didDrawPage` and `putTotalPages` fills in the page count.
   - `toPdfText()` replaces characters outside WinAnsi with `?`, because the built-in Helvetica can't render emoji or CJK.
5. **Filename:** `defaultFilename` comes from the range (`expenses_2026-10-01_to_2026-10-31`, `expenses_all-time`).
   - It is sanitized against characters illegal on Windows, macOS and Linux, Windows reserved names, and leading or trailing dots, and capped at 80 characters.
   - `withExtension` won't add a second extension.
6. **Download:** `downloadBlob` revokes the URL on the next tick.

### User interaction
- The button opens a full-height sheet. Wide screens show options and preview side by side; phones get Options and Preview tabs.
- The footer always states the outcome, e.g. "128 records · $4,210.33 → `expenses_all-time.csv`", or the single blocking reason.
- **Ctrl/⌘+Enter** exports from anywhere in the sheet.
- After export the footer shows "Saved *file* · N records · size", and the button becomes **Export again**. Any option change resets the phase.
- The sheet can't be dismissed while working.

### State management
- **`useReducer`** with a discriminated-union `Action`. The action creators are memoized once, so they are stable.
- The derived flag `filenameEdited` stops the filename auto-following the scope once the user types a name. A "Use suggested name" action restores it.
- **Preferences** load once into `useState(loadPreferences)` and save on export. Scope and filename are never persisted, because they depend on the moment.
- **Concurrency:** `useDeferredValue` keeps typing responsive on large lists.

### Error handling and edge cases
- Invalid range (start after end), no categories, bad filename, and an empty selection each produce a specific message, and the Export button is disabled.
- `runExport` also throws on an empty selection, as defense in depth.
- PDF failure is reported as "Couldn't create the PDF. *reason*", inline with `role="alert"` rather than in a toast.
- Corrupt or partial preferences are validated field by field and fall back to defaults. `localStorage` failures are swallowed.
- A minimum spinner time of 400 ms prevents a flash. `nextFrame()` lets the spinner paint before synchronous serialization.
- Unicode: the BOM handles CSV; the PDF replaces unsupported glyphs with `?`, which is visible but lossy.

### Security
- No data leaves the device.
- The formula guard applies to every CSV cell.
- Filename sanitization prevents path tricks and reserved names. The browser also sanitizes `download`, so this is mostly a UX safeguard.
- jsPDF has had CVEs in its HTML/SVG paths. Those paths are unused here: only `text`, `line` and autotable are called, and no user HTML is passed. Keep the dependency current anyway.

### Performance
- CSV and JSON are linear and fast: 10k rows takes about 23 ms for CSV and about 16 ms for JSON.
- **PDF is the bottleneck:** 1k rows takes about 1.2 s and 10k rows about 2.9 s, synchronously on the main thread. Node timings were similar in kind.
  - In the browser the spinner freezes and input stalls for that long.
  - A Web Worker, or chunked `autoTable` with yields, would fix it. A 10k-row PDF is also about 740 KB and hundreds of pages, so a row cap or a summary-only PDF mode is worth considering.
- Preview cost: two `selectForExport` passes per change (live and deferred), each O(n log n) because of the sort. That is fine for thousands of rows; for 50k+ it is worth memoizing the sort separately from the filter.
- Bundle: +10 kB on `/expenses`, and PDF is fully lazy.

### Extensibility and maintainability
- **Strong.** Adding a format is a documented four-step change (CLAUDE.md): a module in `formats/`, a `FormatSettings` entry, a default, and its controls. Type safety links the settings to the format.
- `lib/export` is testable in Node. The PDF format needs `NODE_PATH` because of the dynamic import.
- The `Sheet` primitive can be reused.
- Weaknesses:
  - The options panel is the largest file, at 378 lines, and grows with every format.
  - Search text is deliberately dropped from the scope (`ExpensesView` comment), so "export what I see" is no longer exactly true when a search is active.

### Complexity
Moderate. There is one reducer, one phase machine, and a plugin registry. Control flow is linear and most files are under 150 lines.

---

## v3: cloud-integrated Export Hub (`feature-data-export-v3`)

### Files

| File | Lines (non-blank) | Role |
|---|---|---|
| `lib/cloud/types.ts` | 84 | `TemplateId`, `DestinationId`, `Period`, `TemplateOutput`, `ExportRequest`, `ExportRecord`, `Connection`, `Schedule`, `JobStage` |
| `lib/cloud/templates.ts` | 163 | 4 templates (Tax Report, Monthly Summary, Category Analysis, Full Backup) to `TemplateOutput`; `inPeriod`, `describePeriod`, `defaultPeriod` |
| `lib/cloud/serialize.ts` | 40 | `TemplateOutput` to CSV or JSON; `filenameFor` |
| `lib/cloud/destinations.ts` | 60 | 7 destinations with `mode: real \| simulated`; `stagesFor()` timings; `simulatedOutcome()` wording |
| `lib/cloud/schedule.ts` | 54 | `nextRunAt`, `isDue`, `describeCadence`, `relativeTime` |
| `lib/cloud/share.ts` | 89 | Snapshot to deflate-raw to base64url fragment token, plus a validating decoder |
| `lib/cloud/store.ts` | 47 | `expense-tracker:cloud:v1` load and save, keeping valid entries and dropping malformed ones |
| `components/cloud/CloudProvider.tsx` | 287 | Context: connections, history, schedules, job queue (`runJob`), scheduler, online state, sync state, share dialog host |
| `components/cloud/ExportComposer.tsx` | 443 | 3-step wizard (Report, Destination, Review) with email, sheet and table previews |
| `components/cloud/ExportHubView.tsx` | 294 | `/exports`: status strip, templates, integrations, schedules, activity |
| `components/cloud/ScheduleDialog.tsx` | 212 | New schedule form with a preview of the next 3 runs |
| `components/cloud/ConnectDialog.tsx` | 110 | Simulated account connection: scopes, account, 3 timed steps |
| `components/cloud/ShareDialog.tsx` | 109 | Link, copy, lazy QR, expiry, and an honest explanation of the fragment |
| `components/cloud/SharedSnapshotView.tsx` | 110 | `/shared` recipient view: decode, check expiry, read-only table |
| `components/cloud/JobTray.tsx` | 118 | Fixed bottom-left progress tray: per-stage progress, cancel, dismiss, collapse |
| `components/cloud/SyncIndicator.tsx` | 57 | Nav pill or inline text: Local, Synced, Syncing or Offline |
| `components/cloud/DemoBadge.tsx` | 11 | Dashed amber "Demo" label for simulated destinations |
| `app/exports/page.tsx`, `app/shared/page.tsx` | 10, 12 | Routes (`/shared` is `noindex`) |
| Modified | | `app/layout.tsx` (`CloudProvider`, `JobTray`, extra bottom padding), `Navbar.tsx` (Exports link, sync pill), `Modal.tsx` (`size="lg"`), `ExpensesView.tsx` (Export & share opens the composer), `CLAUDE.md`, `package.json`; `lib/csv.ts` deleted |

### Architecture
v3 is a pipeline of registries feeding one provider:

```
Expense[] ──template.build(period)──▶ TemplateOutput {columns, rows, highlights}
                                            │
                    ┌───────────────────────┼─────────────────────────┐
                    ▼                       ▼                         ▼
              serialize(csv|json)     snapshotFrom → encode     (simulated) outcome text
                    │                       │
              download Blob          /shared#z.<token> + QR
```

- **Templates** decide *what*. **Destinations** decide *where* and *how it looks while it happens* (`stagesFor`). **`CloudProvider`** decides *when*: now, queued, waiting for the network, or on a schedule.
- `TemplateOutput` is format-neutral, so every destination, both serializers, the share snapshot and the preview read one shape. This is the main design win.
- **Real vs simulated is a type-level fact:** `Destination.mode`. It drives the Demo badges, the offline-wait rule (only simulated transfers wait), and the "Simulated: would…" outcome wording. CLAUDE.md makes this a hard rule.

### Key components
- **`CloudProvider.runJob`** (`CloudProvider.tsx:130`) is an async loop over stages:
  1. It checks the connection first.
  2. On each stage it checks for cancellation. Simulated destinations at stage 2 or later wait while offline, using a `while` loop so that a cancel which wakes every waiter is re-checked.
  3. Stage 1 builds the report from `expensesRef.current`, so the data is fresh when the job reaches that step rather than when it was queued.
  4. Each stage then sleeps its `durationMs`.
  5. After the loop, it delivers by download, share link, or simulated outcome; writes an `ExportRecord`; and shows a toast.
- **Scheduler** (`CloudProvider.tsx:231`): an effect that ticks immediately and then every 30 s while the app is open.
  - A `fired` ref keyed on `lastRunAt` makes React StrictMode's double effects and overlapping ticks fire each due run once.
  - Re-enabling a schedule resets `lastRunAt`, so it doesn't fire a backlog.
  - A run missed while the app was closed fires once on the next visit.
- **`ExportComposer`:**
  - Wizard state lives in `useState` hooks. The `output` preview is a `useMemo` of `template.build`.
  - Destination-specific details reset when the destination changes.
  - Unconnected cloud destinations can be connected inline.
- **Share:**
  - `encodeSnapshot` does JSON, then `CompressionStream("deflate-raw")`, then base64url, prefixed `z.`. Browsers without compression streams get `j.` plus plain JSON.
  - `decodeSnapshot` validates the structure (`isSnapshot`) and throws one user-facing message.
  - Snapshots are capped at 40 rows, and QR codes are skipped above 1,800 characters.

### Libraries
- `qrcode` 1.5, dynamically imported in `ShareDialog` (9 kB gz) and rendered as an SVG string.
- Its lockfile footprint (`yargs` and others) belongs to the package's CLI and isn't bundled.
- `CompressionStream` and `DecompressionStream` are platform APIs.

### How it works, per destination
| Destination | Mode | What actually happens |
|---|---|---|
| Download | real | The `Blob` is downloaded after about 1.35 s of staged progress |
| Share link & QR | real | The snapshot is encoded into `/shared#…`, a QR is generated locally, and the dialog opens. History keeps the URL so it can be reopened |
| Email | simulated | Recipients are validated and an email preview is shown. History says "Simulated: would email *file* to *addresses*" |
| Google Sheets | simulated | A spreadsheet-grid preview is shown; "Simulated: would write N rows to *sheet*" |
| Drive, Dropbox, OneDrive | simulated | A mock connect flow, then "Simulated: would upload to *folder*/*file*" |

Measured share links for 1,000 expenses, all of which fit a QR code:

| Template | Rows in link | URL length |
|---|---|---|
| Tax Report | 6 | 444 characters |
| Monthly Summary | 6 | 522 characters |
| Category Analysis | 6 | 646 characters |
| Full Backup | 40 of 1,000 | 873 characters |

All four decoded back to identical rows.

### User interaction
- Entry points: the **Exports** nav item; **Export & share** on Expenses; template cards, which have one-click Export and share-link shortcuts; and **Run again** in Activity.
- The wizard flows Report, then Destination, then Review.
- The global job tray and nav pill give a "this is happening in the background" feel. The user can navigate away mid-job, because jobs live in the root provider.
- `/shared` is a standalone read-only page with a privacy note and states for expired and damaged links.

### State management
- **One context provider at the root** (`CloudProvider`, inside `ExpenseProvider`).
  - Persisted slices: `connections`, `history` and `schedules`, written as one key on every change through an effect.
  - Ephemeral slices: `jobs`, `online` and `share`.
- **Refs mirror state** (`expensesRef`, `connectionsRef`) so long-running async jobs read current values without being re-created. The `cancelled` set and `onlineWaiters` queue are refs as well.
- The context value is `useMemo`'d, but it changes whenever jobs tick, so every `useCloud()` consumer, including the Navbar, re-renders once per stage. That is cheap at this scale.

### Error handling and edge cases
- **Disconnected destination:** the job fails immediately with "Connect *X* first." This covers a schedule whose service was later disconnected.
- **Empty period:** "No expenses in *period*." is recorded as a failed job, with a toast.
- **Offline:** simulated transfers pause with the status `waiting-online` and resume on the `online` event. Local work never waits.
- **Cancel:** works mid-stage or while waiting offline, and records "Cancelled…".
- **Corrupt storage:** `parseCloudState` keeps valid entries and drops malformed ones, and history is capped at 50.
- **Damaged or foreign share links:** these produce one clear message. Expired links show an expired state. The decoder rejects unknown prefixes and invalid shapes.
- **QR failure or overlong URL:** the dialog falls back to the link alone.
- Gaps found in review:
  1. **UTC date bug.** `ExportComposer.tsx:88` builds the current month key with `new Date().toISOString().slice(0, 10)`, which is a UTC date. This breaks the project's local-date rule: on the evening of the last day of a month in the Americas, the month picker offers next month. It should use `todayISO()`.
  2. **`defaultPeriod` doesn't match its comment.** The comment says "the latest complete year" but the code returns the *current* year. A scheduled Tax Report in January therefore exports an almost empty year-to-date instead of the prior tax year.
  3. **Jobs aren't persisted.** Closing the tab mid-job loses it without a history entry. That's acceptable for a demo, but worth knowing.
  4. **Clear history has no confirm or Undo**, unlike the rest of the app's destructive actions.
  5. **Comment typo.** The comment on `QR_MAX_URL_LENGTH` mentions "Version-2 QR codes". It means the largest QR versions (about version 40); the constant itself is fine.

### Security and privacy
- **The share link is the data.** The fragment never reaches a server, which is honest and stated in the UI. But:
  - anyone holding the URL can decode it;
  - it persists in browser history and anywhere it's pasted;
  - **expiry is advisory**, because only this app refuses to render it. The UI and CLAUDE.md both say so.
  - History stores share URLs, so localStorage holds copies of shared snapshots.
- **Decompression bound:** `/shared` decompresses whatever the fragment holds without a size limit. A crafted link could make the recipient's tab allocate heavily. The impact is only that tab, but a byte cap in `pipe()` would close it.
- **`dangerouslySetInnerHTML`** is used only for the QR SVG, which `qrcode` generates locally (path data only; the URL text isn't embedded). Snapshot content renders as React text, so it is escaped.
- **Simulated integrations are explicitly labeled.** They have no fake sign-in page and use no real OAuth, and no credentials are collected; the connect flow only asks for a display email.
- The CSV formula guard applies only to string cells, so numbers stay numbers. The test string was neutralized.
- **`/shared` runs inside the full app layout.** If the recipient also uses the app, their own scheduler and providers run on that page. This is harmless, but a separate layout for `/shared` would be cleaner.

### Performance
- Template build plus serialization is fast: 10k rows takes about 3 ms to build, about 10 ms for CSV, and about 15 ms for JSON.
- **The perceived latency is mostly the simulated stages:**
  - Every download takes about 1.35 s.
  - Simulated cloud destinations take 2.7–3.2 s.
  - The delay is deliberate theater for the demo. For the real destinations it could be removed, or reduced to "build, then deliver".
- The download fires after awaits, outside the click's call stack, and still within the transient user activation window in Chromium. Safari and Firefox should be checked before relying on it.
- Bundle: +16 kB on `/expenses` and 123 kB first load on `/exports`. The QR code is lazy.
- The scheduler interval runs on every page.

### Extensibility and maintainability
- **The registries make the common extensions small:**
  - a new template is one object;
  - a new destination is one object plus a delivery branch in `runJob`;
  - a new format is one branch in `serialize`.
- **Swapping a simulated destination for a real one is the main future cost.** Real Google, Dropbox or Email delivery needs OAuth, a backend or serverless function for tokens and SMTP, and server-side scheduling (today schedules only run while a tab is open). The `mode` field and staged-job model are the right seams for this, but the work isn't done.
- **`CloudProvider` (287 lines) is the point of concentration:** jobs, scheduler, sync state and share host share one closure. If real delivery is added, splitting the job runner from the scheduler would be worth it.
- **Convention drift:** CLAUDE.md says only `lib/categories.ts` may import React-adjacent code (lucide icons), but `lib/cloud/templates.ts` and `lib/cloud/destinations.ts` now import lucide too. Node tests need `NODE_PATH`.
- **Lost capability:** there is no arbitrary date range or category filter. The composer opens with `preset={{}}`, so the Expenses page's filters are ignored and the user can't export "Food in March" the way v1 and v2 allow.

### Complexity
High. It has the most files, async control flow with cancellation and resumption, a timer-driven scheduler, two persistence keys, two new routes, and a context that every page consumes. Each piece is well-commented and individually small, but the system has more interacting state than v1 and v2 combined.

---

## Technical deep dive: side by side

### File generation approach
| | v1 | v2 | v3 |
|---|---|---|---|
| Model | `Expense[]` straight to CSV string | `Expense[]` to `ExportSelection` (records, totals, by-category, span), then each format plugin | `Expense[]` to `TemplateOutput` (generic table), then the serializer |
| Output | String to `Blob` with BOM | `Promise<Blob>` per format | `Blob` (CSV or JSON), or a URL token |
| Amounts in CSV | `5.00` (`toFixed(2)`) | `5.00` | `5` (raw number; re-imports fine, but less spreadsheet-friendly) |
| JSON shape | none | Versioned, full records with ids | Keys are display column names (`"Amount (USD)"`), no ids, no version field |

### User interaction model
- **v1:** one click, done. It has no decisions, and no preview because the list *is* the preview.
- **v2:** configure, see the live result, export. It suits power users who know what they want in the file.
- **v3:** pick a purpose (template), pick a destination, review, then it runs in the background. It suits recurring tasks and handing reports to other people.

### State management patterns
- **v1:** none of its own; derived from the view.
- **v2:** a local reducer scoped to an open sheet, plus a small persisted preferences record. The state's lifetime matches the task.
- **v3:** a global context with persisted collections and an in-memory async job queue, plus refs for async-safe reads. The state's lifetime matches the session and beyond.

### Edge-case coverage (✓ = handled, ✗ = not handled, n/a = not applicable)
| Case | v1 | v2 | v3 |
|---|---|---|---|
| Empty selection | ✓ Button disabled | ✓ Blocker message, empty-state preview with reset | ✓ Fails the job with a message (no up-front block) |
| Formula injection | ✓ | ✓ | ✓ |
| Unicode / Excel | ✓ BOM | ✓ BOM; PDF degrades to `?` | ✓ BOM |
| Invalid user input | n/a | ✓ Range, categories, filename | ✓ Email recipients, connection required |
| Large data | Fast | ✗ PDF blocks the main thread for seconds | Fast (share link capped at 40 rows) |
| Offline | n/a | n/a | ✓ Waits and resumes |
| Cancellation | n/a | ✗ Can't cancel (sheet locked while working) | ✓ |
| Corrupt persisted state | n/a | ✓ Field-level fallback | ✓ Entry-level filtering |
| Timezone | ✓ Local `todayISO` | ✓ String date compares | ✗ One UTC slip in the month picker |

---

## Integration risks

1. **`lib/csv.ts` is deleted by both v2 and v3, but `redesign/category-standard` depends on it.** The redesign's `ExpenseDialogProvider` (Export all) and `ExpensesView` import `expensesToCSV` and `downloadCSV`, and the CSV importer is built to read that exact format.
   - Merging either export branch with the redesign produces a modify/delete conflict.
   - The fix is to keep `lib/csv.ts`, or re-export it from the new layer, so that `markBackedUp()` and import compatibility hold.
2. **Round-trip results** (each fed into the redesign branch's `previewImport`):
   - v2 comma CSV: 3/3 rows imported.
   - v2 semicolon CSV: rejected, because the importer assumes commas.
   - v3 Full Backup CSV: 3/3 rows imported.
   - v3 Tax Report CSV: rejected. It is an aggregate, so this is expected.
   - No JSON importer exists. v2's JSON is the one that could support a lossless restore, because it includes ids and timestamps.
3. **Backup status:** the redesign records "last backed up" via `markBackedUp()` on full exports. Neither v2 nor v3 knows about this. After merging, v2 should call it when the scope is "all dates, all categories", and v3 should call it on a completed Full Backup download.
4. **Visual system:** v2 and v3 were built on `main`'s indigo theme. The redesign moved to a green `brand-*` palette with tokens in `lib/theme.ts`.
   - v2's PDF hard-codes `[79, 70, 229]` (indigo) as RGB. It should read the theme tokens.
   - v3's category-style `tint` classes (rose, emerald, sky…) would need checking against the redesign's rule that green is reserved for actions.

---

## Recommendation

**Adopt v2's export engine as the core, add v3's two real innovations on top of it, and drop or defer the simulated cloud layer.**

| Keep | From | Why |
|---|---|---|
| `runExport` + `ExportFormat` plugin registry, selection, filename and preferences | v2 | The cleanest abstraction: typed per-format settings, framework-free, tested in Node, and supports arbitrary range and category filtering |
| Side sheet with live preview and blocker footer | v2 | The best answer to "what will be in my file?" |
| PDF format | v2 | High user value, already lazy; move it to a Web Worker or cap the rows |
| Versioned JSON with ids | v2 | The only lossless format, and the basis for a future JSON restore |
| Templates as presets | v3 | Tax Report, Monthly Summary and Category Analysis are useful *purposes*. Implement them as v2 scope-and-format presets, or as an `ExportFormat` that emits aggregates, not as a parallel pipeline |
| Share link + QR (fragment snapshot) | v3 | Genuinely novel, works with no backend, and the honesty about expiry is good. Add a decompression size cap |
| History (lightweight) | v3 | Cheap and useful. Skip the job queue for local formats, since they finish in milliseconds |
| `lib/csv.ts` + `markBackedUp()` + importer compatibility | v1 / redesign | Keeps restore working, and v1's one-click "Export what you see" can stay as a quick action beside the sheet |

**Defer:** simulated Email, Sheets, Drive, Dropbox and OneDrive, connections, tab-bound scheduling, and staged progress for instant operations.
- They show the product direction well and are honestly labeled.
- But each one needs a backend (OAuth tokens, SMTP, server-side cron) before it delivers anything. Until then it adds about 1,000 lines of state and UI and about 1.3–3 s of artificial delay.
- If the demo value matters (this is a portfolio piece, per `PRODUCT.md`), keep the Export Hub page behind the v2 engine. Keep the Demo badges and limit the simulation to the destinations, never local downloads.

**Fix whichever you adopt:**
- v3's UTC month key and its `defaultPeriod` year;
- v2's main-thread PDF;
- the `lib/csv.ts` deletion conflict with the redesign branch.
