import type { ExportFormatId, ExportSort, FormatSettings } from "./types";

/** Choices a returning user expects to persist. Scope and filename depend on the moment, so they don't. */
export interface ExportPreferences {
  format: ExportFormatId;
  sort: ExportSort;
  settings: FormatSettings;
}

export const PREFERENCES_KEY = "expense-tracker:export-preferences:v1";

export const DEFAULT_PREFERENCES: ExportPreferences = {
  format: "csv",
  sort: "date-desc",
  settings: {
    csv: { delimiter: "," },
    json: { pretty: true },
    pdf: { orientation: "portrait", includeBreakdown: true },
  },
};

const FORMATS: ExportFormatId[] = ["csv", "json", "pdf"];
const SORTS: ExportSort[] = ["date-desc", "date-asc", "amount-desc"];

/** Merges stored values over defaults field by field, so a partial or outdated record can't break the dialog. */
export function loadPreferences(): ExportPreferences {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const stored = JSON.parse(raw) as Partial<ExportPreferences>;
    const s = stored.settings ?? ({} as Partial<FormatSettings>);
    const d = DEFAULT_PREFERENCES.settings;
    return {
      format: FORMATS.includes(stored.format as ExportFormatId) ? (stored.format as ExportFormatId) : DEFAULT_PREFERENCES.format,
      sort: SORTS.includes(stored.sort as ExportSort) ? (stored.sort as ExportSort) : DEFAULT_PREFERENCES.sort,
      settings: {
        csv: { delimiter: [",", ";", "\t"].includes(s.csv?.delimiter as string) ? s.csv!.delimiter : d.csv.delimiter },
        json: { pretty: typeof s.json?.pretty === "boolean" ? s.json.pretty : d.json.pretty },
        pdf: {
          orientation: s.pdf?.orientation === "landscape" ? "landscape" : d.pdf.orientation,
          includeBreakdown:
            typeof s.pdf?.includeBreakdown === "boolean" ? s.pdf.includeBreakdown : d.pdf.includeBreakdown,
        },
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: ExportPreferences): void {
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Non-critical: the next export just starts from defaults.
  }
}
