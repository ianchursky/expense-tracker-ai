import colors from "tailwindcss/colors";

/**
 * Raw design-token values shared by tailwind.config.ts and code that can't use classes (Recharts SVG props).
 * Change a color here, not in a component.
 */

/** Green accent. 600 is the action color (white text passes 5:1); 500 is for fills and data only. */
export const brand = {
  50: colors.green[50],
  100: colors.green[100],
  200: colors.green[200],
  500: colors.green[600],
  600: colors.green[700],
  700: colors.green[800],
} as const;

export const chartColors = {
  accent: brand[500],
  grid: colors.slate[200],
  axis: colors.slate[500],
  cursor: colors.slate[300],
} as const;

/** Elevation for surfaces that float above the page. Cards use borders, not shadows. */
export const shadows = {
  popover: "0 4px 12px rgba(15, 23, 42, 0.08)",
  menu: "0 8px 24px rgba(15, 23, 42, 0.12)",
  fab: "0 4px 12px rgba(21, 128, 61, 0.35)",
} as const;
