---
name: Expense Tracker
description: A calm, light personal-finance dashboard. White cards on a slate ground, one reserved green, and category hues kept for data.
colors:
  ledger-green: "#15803d"
  ledger-green-deep: "#166534"
  ledger-green-data: "#16a34a"
  ledger-green-tint: "#dcfce7"
  ledger-green-wash: "#f0fdf4"
  slate-ground: "#f8fafc"
  card-white: "#ffffff"
  hairline: "#e2e8f0"
  divider: "#f1f5f9"
  control-stroke: "#cbd5e1"
  muted-icon: "#64748b"
  secondary-ink: "#475569"
  label-ink: "#334155"
  ink: "#0f172a"
  delta-up-red: "#b91c1c"
  danger-red: "#dc2626"
  warning-wash: "#fffbeb"
  warning-ink: "#92400e"
  category-food: "#f97316"
  category-transportation: "#0ea5e9"
  category-entertainment: "#a855f7"
  category-shopping: "#ec4899"
  category-bills: "#6366f1"
  category-other: "#64748b"
typography:
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  title-dialog:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  body-strong:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
  column-header:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
    letterSpacing: "0.025em"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "10": "40px"
components:
  button-primary:
    backgroundColor: "{colors.ledger-green}"
    textColor: "{colors.card-white}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.ledger-green-deep}"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  button-secondary-hover:
    backgroundColor: "{colors.slate-ground}"
  button-ghost:
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  button-ghost-hover:
    backgroundColor: "{colors.divider}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.lg}"
    padding: "8px 14px"
  button-sm:
    padding: "6px 10px"
  fab-add:
    backgroundColor: "{colors.ledger-green}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.full}"
    size: "56px"
  card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.xl}"
    padding: "20px"
  kpi-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    rounded: "{rounded.xl}"
    padding: "16px 20px"
  input:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  category-badge:
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  preset-pill:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.secondary-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  preset-pill-active:
    backgroundColor: "{colors.ledger-green}"
    textColor: "{colors.card-white}"
  segmented-control:
    backgroundColor: "{colors.divider}"
    rounded: "{rounded.lg}"
    padding: "2px"
  segmented-option-active:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
  nav-item:
    textColor: "{colors.secondary-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  nav-item-active:
    backgroundColor: "{colors.ledger-green-wash}"
    textColor: "{colors.ledger-green-deep}"
  sidebar:
    backgroundColor: "{colors.card-white}"
    width: "240px"
    padding: "20px 16px"
  modal:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.xl}"
    padding: "24px"
    width: "512px"
  toast:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.xl}"
    padding: "16px"
    width: "384px"
---

# Design System: Expense Tracker

## Overview

**Creative North Star: "The Quiet Ledger"**

The system is the personal-finance category standard, built to a high craft bar and played straight. A cool slate ground holds white, hairline-bordered cards. The numbers carry the page: large tabular figures, a clear title row, and charts that use the category palette and nothing else. One green does all the interactive work: the primary action, the active nav item, focus, selection, and the trend series. Everything else is neutral slate.

Density is moderate and even. Cards sit on a 16px gutter, pad 20px inside, and never float on shadows. Hierarchy comes from type size and weight in a single family (Inter), not from color blocks or ornament. The page is calm because so little competes with the figures. The system rejects the indigo SaaS-template finish: weak hierarchy, decorative icon chips, and loose spacing.

The shell is a fixed 240px white sidebar on desktop. On phones it becomes a slim top bar plus a bottom tab bar, with a raised green Add button in the thumb zone. Adding an expense is one click from anywhere.

**Key Characteristics:**
- Slate-50 ground, white cards, 1px slate-200 borders, no resting shadows.
- One reserved green for action, active state, focus, selection, and the spending-down delta.
- Category hues appear only as data: chart series, legend dots, and category badges.
- Inter at a real scale, with tabular figures on every amount and count.
- 12px container corners and 8px control corners.

## Colors

A cool neutral slate system with one reserved green and six data hues that stay inside charts and chips.

### Primary
- **Ledger Green** (`ledger-green`): the action color. It fills primary buttons, the mobile Add FAB, active preset pills, and the wordmark tile. It also colors focus outlines, the caret, `accent-color`, and text links ("View all", "Remove sample data"). White text on it passes 5:1.
- **Ledger Green Deep** (`ledger-green-deep`): the hover state of every green control. It is also the text color for the active nav item and the selected category tile, and the color of the spending-down delta.
- **Ledger Green Data** (`ledger-green-data`): fills only. It draws the spending-trend line, its 22%-to-0 gradient area, and the chart dots. Never set text in it or use it as a button fill.
- **Ledger Green Tint** (`ledger-green-tint`): the text-selection highlight.
- **Ledger Green Wash** (`ledger-green-wash`): the background of the active nav item, the selected category tile, and the Undo-action hover in toasts.

### Tertiary (data hues)
- **Food Orange** (`category-food`), **Transit Sky** (`category-transportation`), **Entertainment Purple** (`category-entertainment`), **Shopping Pink** (`category-shopping`), **Bills Indigo** (`category-bills`), **Other Slate** (`category-other`). These are donut segments, legend and row dots, and the "Top category" dot. As badges, each hue uses its 50 tint background, 700 text, and a 600/20 inset ring.

### Neutral
- **Slate Ground** (`slate-ground`): the page background. Also the hover fill for rows and secondary buttons, and the table-header and totals-bar band at 60% opacity.
- **Card White** (`card-white`): cards, sidebar, tab bar, modal, toasts, and inputs.
- **Hairline** (`hairline`): 1px card and shell borders, chart gridlines, and skeleton fill (at 70%).
- **Divider** (`divider`): row dividers inside cards, the segmented-control track, and ghost-button hover.
- **Control Stroke** (`control-stroke`): the 1px inset ring on inputs, selects, secondary buttons, and inactive preset pills. Also the scrollbar thumb and the chart hover cursor.
- **Muted Icon** (`muted-icon`): resting icons, chart axis ticks, placeholders, and the custom select chevron and date-picker glyph.
- **Secondary Ink** (`secondary-ink`): descriptions, KPI labels and footers, dates, and inactive nav text.
- **Label Ink** (`label-ink`): form labels and secondary-button text.
- **Ink** (`ink`): titles, figures, amounts, and primary row text.

### Semantic
- **Delta Up Red** (`delta-up-red`): the spending-up delta.
- **Danger Red** (`danger-red`): the danger button fill, field error text, and the over-limit character counter. Error input rings use red-300, with red-500 on focus.
- **Warning Wash / Warning Ink** (`warning-wash`, `warning-ink`): the storage-failure banner only, with an amber-200 ring and an amber-500 icon.

### Named Rules
**The Reserved Green Rule.** Green means "act here," "you are here," or "spending went down." No category may be green. Bills is indigo for exactly this reason.

**The Data-Only Hue Rule.** Category hues appear only in charts, legend dots, and category badges or tiles. Never use one on chrome, buttons, or headings.

**The 600-For-Text Rule.** Green text and green-filled controls with text use `ledger-green` or darker. `ledger-green-data` is a fill for chart marks only.

**The Delta Pair Rule.** A delta always pairs color with direction: red-700 with an up-right arrow for an increase, `ledger-green-deep` with a down-right arrow for a decrease. Color is never the only signal.

## Typography

**Display Font:** none. The system has no display face.
**Body Font:** Inter, loaded through `next/font` as `--font-inter` (fallbacks: ui-sans-serif, system-ui, sans-serif).

**Character:** One neutral grotesque, set tight at the top and plain below. Hierarchy comes from size and weight steps (400, 500, 600). Tabular numerals keep amounts aligned in columns and KPI cards.

### Hierarchy
- **Headline** (600, 24px, 32px line height, -0.025em): page titles ("Dashboard", "Expenses") in the page-header row, with a 14px secondary-ink description below.
- **Figure** (600, 24px on phones and 26px from `sm`, 1.25 line height, -0.025em, tabular): KPI card values.
- **Title, dialog** (600, 18px): modal titles.
- **Title** (600, 15px): card titles and the wordmark.
- **Body** (400 or 500, 14px, 20px line height): row text, descriptions, legend rows, nav items, and button labels (600).
- **Label** (500, 12px): category badges, segmented options, preset pills, mobile tab labels, row metadata, and the donut center caption.
- **Column header** (600, 12px, uppercase, 0.025em tracking, muted-icon color): sortable table column headers only.

### Named Rules
**The Tabular Figures Rule.** Every currency amount, percentage, and count uses `tabular-nums`. That includes the KPIs, table and row amounts, legend values, tooltips, the totals bar, the amount input, and the character counter.

**The One Family Rule.** Inter carries every role. Hierarchy comes from size and weight, never from a second face.

## Layout

The desktop shell is a fixed 240px sidebar from `lg` (1024px) up. The main column is offset by it and capped at 72rem (1152px), centered, with 40px side padding and 32px vertical padding. Below `lg`, a 56px sticky top bar (white at 90% with a backdrop blur) carries the wordmark, and a fixed three-column bottom tab bar carries Dashboard, a raised Add button, and Expenses. That bar respects the bottom safe-area inset. On phones the main column pads 16px at the sides (24px from `sm`) and 112px at the bottom to clear the tab bar.

The dashboard reads top to bottom: the page-header row, then four KPI cards (2 columns on phones, 4 from `lg`, with 12px gaps on phones and 16px from `sm`), then a 3:2 row with the trend chart beside the category breakdown (a five-column grid from `lg`, stacked below that), then the recent-transactions card. Sections are separated by a 16px vertical rhythm.

The Expenses page puts the filters bar, totals bar, and list inside one card. At `md` (768px) the list switches from a five-column sortable table to full-width tappable rows of at least 60px.

Spacing follows a 4px grid. Card insets are 20px (16px for filter and mobile rows). Form fields stack with 20px gaps, and a label sits 6px above its control.

## Elevation & Depth

Surfaces are flat and tonal. A card separates from the slate ground by its white fill and a 1px hairline border, never by a shadow. Shadows appear only on layers that float above the page: tooltips, toasts, the modal, and the mobile FAB. Buttons and the active segmented option carry the faintest lift (shadow-sm).

### Shadow Vocabulary
- **Control lift** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): primary, secondary, and danger buttons, inputs, and the active segmented option.
- **Chart tooltip** (`box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08)`): the trend and donut tooltips, over a 1px hairline border.
- **Toast** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): with a 1px slate-900/10 ring.
- **Modal** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)`): over a slate-900/50 backdrop with a 4px blur.
- **Add FAB** (`box-shadow: 0 4px 12px rgba(21, 128, 61, 0.35)`): a green-tinted lift for the raised mobile Add button only.

### Named Rules
**The Border-Not-Shadow Rule.** Resting containers (cards, banners, the sidebar, and bars) use a 1px border and no shadow. A shadow means the layer floats.

## Shapes

Corners come in two families. Containers (cards, modal, toasts, banners, skeleton KPI blocks) use 12px. Controls (buttons, inputs, selects, nav items, tooltips, category picker tiles, segmented track) use 8px. Small parts nested inside controls (category badges, segmented options, icon buttons, inline link focus targets) use 6px. Fully round shapes are reserved for the mobile Add FAB, date-preset pills, the empty-state icon disc, and the 8-10px category dots. Strokes are always 1px: a hairline border on containers, and an inset ring on controls that thickens to 2px green on focus. The donut is a thin ring (inner radius 72%) with 2-degree gaps between segments and no stroke.

## Components

### Buttons
Compact, solid, and quiet. Weight comes from fill, not size.
- **Shape:** gently rounded (8px), semibold 14px label, icon gap 8px.
- **Primary:** green fill with white text, 8px by 14px padding (6px by 10px at `sm` size). It hovers to deep green.
- **Secondary:** white with a 1px inset control-stroke ring and label-ink text. It hovers to slate ground.
- **Ghost:** no fill and secondary-ink text. It hovers to a divider fill with ink text.
- **Danger:** red-600 fill that hovers to red-700. Used in confirm dialogs.
- **Focus:** a 2px green outline at a 2px offset (red for danger). Disabled is 50% opacity with a not-allowed cursor. Transitions are color-only, at 150ms.

### Add expense (signature)
On desktop, a full-width primary button sits in the sidebar under the wordmark. On phones it is a 56px green circle with a 24px plus, raised 20px above the tab bar's center column, with the green-tinted FAB shadow.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** card white on the slate ground.
- **Shadow Strategy:** none (see the Border-Not-Shadow Rule).
- **Border:** 1px hairline.
- **Internal Padding:** a 20px header inset (title 15px/600, optional 14px description, and an optional right-aligned action such as a segmented control or "View all" link). Lists inside cards run edge to edge with divider rules.

### KPI Cards
Label (14px/500, secondary ink), then the figure (Figure role), then a one-line footer (13px on phones, 14px from `sm`, secondary ink). The footer carries the delta, a count, or a share. Footers shorten on phones so they never wrap.

### Inputs / Fields
- **Style:** white, borderless, with a 1px inset control-stroke ring, 8px radius, 8px vertical padding, and 14px text. Placeholders use muted-icon color.
- **Focus:** the ring thickens to a 2px inset green ring and the outline is suppressed.
- **Error:** a red-300 ring (red-500 on focus) and 14px red-600 message text 6px below. On submit, focus moves to the first invalid field.
- **Select / date:** a custom 16px slate chevron sits 12px from the right edge. The native date glyph is replaced by a slate calendar icon that turns green on hover. Filter date fields float an 11px label on the top border.

### Chips
- **Category badge:** 12px/500 text with 2px by 8px padding, 6px radius, and the category's 50 tint, 700 text, and 600/20 inset ring.
- **Date-preset pill:** fully round, 12px/500. White with a control-stroke ring when inactive, green fill with white text when active.
- **Segmented control:** an 8px divider-colored track with 2px padding. The active option is white with ink text and control lift. Inactive options use secondary ink.

### Category Picker
In the add/edit form, the six categories form a 2-column grid (3 from `sm`) of 8px tiles with 1px borders. Each tile has a 24px tinted icon square and a 14px/500 label. The selected tile gets a green border, green-wash fill, and deep-green text. Keyboard focus shows a 2px green ring.

### Lists and Table
- **Rows:** 12px vertical padding with divider rules between rows and a slate-ground hover. Amounts are right-aligned, 14px/600, and tabular. Dashboard rows are full-width edit buttons ending in a chevron.
- **Table (from `md`):** a header band in slate ground at 60%, with uppercase column headers and sort arrows (40% opacity when inactive). Edit and delete icon buttons appear on row hover or focus. Delete hovers red-50 with red-600.
- **Mobile rows:** the whole row is the edit target, at least 60px tall. The category shows as a dot plus name, and delete moves into the edit dialog.

### Navigation
- **Sidebar items:** 14px/500 with a 16px icon, 8px by 12px padding, and 8px radius. Inactive items use secondary ink with a muted icon and hover to the divider fill. The active item gets a green-wash fill, deep-green text, and a green icon.
- **Mobile tabs:** 12px/500 labels under 20px icons, at least 56px tall. Active is deep green and inactive is muted icon color.

### Modal
A native `<dialog>`, up to 512px wide (full width minus 32px on phones), 12px radius, with 20px padding (24px from `sm`). The title is 18px/600 with an optional description. A close button sits top right. The backdrop is blurred slate. Form actions are right-aligned, and Delete is pushed left when editing.

### Toasts and Banners
- **Toast:** white, 12px radius, and toast shadow, up to 384px wide. A 20px status icon sits beside 14px/500 text, with an optional green Undo action and a dismiss X. Toasts stack bottom right on desktop, and center above the tab bar on phones. They enter with a 150ms, 8px slide-in.
- **Sample-data notice:** a white 12px card row with a slate flask icon, 14px text, and a green text-button to remove the sample data.
- **Storage warning:** an amber wash with an amber-200 ring and amber-800 text, shown only on storage failure.

### Charts
- **Spending trend:** a monotone area with a 2.5px stroke in Ledger Green Data and a gradient fill from 22% to 0. Dots are white with a green stroke. Gridlines are horizontal hairlines only, axis ticks are 12px muted-icon, and the Y axis uses compact currency. The hover cursor is a dashed control-stroke line.
- **Category breakdown:** a donut with the total in its center, beside a legend listing the dot, name, tabular amount, and right-aligned percent.
- **Motion:** charts use Recharts' default entry animation, which is turned off under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** put every new surface on the slate ground in white cards with a 1px hairline border and 12px corners.
- **Do** use Ledger Green for the single primary action per view, the active nav state, selection, and focus. Hover it to Ledger Green Deep.
- **Do** set every amount, percent, and count in tabular figures.
- **Do** pair any delta color with an arrow (red-700 for up, deep green for down).
- **Do** draw new chart series from the category hues in `CATEGORY_META`, and use Ledger Green Data for a single-series total.
- **Do** keep controls at 8px corners with a 1px inset slate ring and a 2px green focus ring.
- **Do** gate any new animation on `prefers-reduced-motion`, as the charts do.

### Don't:
- **Don't** add shadows to resting cards or banners. Shadows are for tooltips, toasts, the modal, and the FAB.
- **Don't** assign green to a category or use it for decoration. It is reserved for action, active state, and the spending-down delta.
- **Don't** use a category hue on buttons, headings, or nav.
- **Don't** use `ledger-green-data` for text or a text-bearing fill. It fails contrast.
- **Don't** introduce indigo or violet as a UI accent. Indigo exists only as the Bills data hue.
- **Don't** add a second typeface or a display face. Inter carries every role.
- **Don't** place small uppercase eyebrows or kickers above headings. Uppercase is used only for table column headers.
