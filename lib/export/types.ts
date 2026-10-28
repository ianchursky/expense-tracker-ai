import type { CategoryTotal } from "../analytics";
import type { Category, Expense } from "../types";

export type ExportFormatId = "csv" | "json" | "pdf";
export type ExportSort = "date-desc" | "date-asc" | "amount-desc";
export type CsvDelimiter = "," | ";" | "\t";

/** Which expenses go into the file. */
export interface ExportScope {
  /** Inclusive `YYYY-MM-DD` bounds; empty string means unbounded. */
  startDate: string;
  endDate: string;
  /** Categories to include. An empty list selects nothing. */
  categories: Category[];
}

/** Per-format settings. Every format's settings are kept so switching formats doesn't lose them. */
export interface FormatSettings {
  csv: { delimiter: CsvDelimiter };
  json: { pretty: boolean };
  pdf: { orientation: "portrait" | "landscape"; includeBreakdown: boolean };
}

export interface ExportOptions {
  format: ExportFormatId;
  scope: ExportScope;
  sort: ExportSort;
  /** Base filename chosen by the user, without extension. */
  filename: string;
  settings: FormatSettings;
}

/** The records an export will contain, plus the figures every format reports. */
export interface ExportSelection {
  records: Expense[];
  total: number;
  byCategory: CategoryTotal[];
  /** Earliest and latest expense dates actually present, or null when empty. */
  firstDate: string | null;
  lastDate: string | null;
}

export interface ExportContext {
  selection: ExportSelection;
  scope: ExportScope;
  generatedAt: Date;
}

/** A pluggable output format. `build` may be async (PDF loads its library on demand). */
export interface ExportFormat<K extends ExportFormatId = ExportFormatId> {
  id: K;
  label: string;
  extension: string;
  mimeType: string;
  /** One line shown in the format picker. */
  description: string;
  build(context: ExportContext, settings: FormatSettings[K]): Promise<Blob>;
}
