import type { ExportFormat } from "../types";

/** Bump when the document shape changes so consumers can branch on it. */
export const JSON_SCHEMA_VERSION = 1;

export const jsonFormat: ExportFormat<"json"> = {
  id: "json",
  label: "JSON",
  extension: "json",
  mimeType: "application/json",
  description: "Structured data with a summary, for scripts and other apps",
  async build({ selection, scope, generatedAt }, { pretty }) {
    const document = {
      $schema: "expense-tracker/export",
      version: JSON_SCHEMA_VERSION,
      generatedAt: generatedAt.toISOString(),
      currency: "USD",
      scope: {
        startDate: scope.startDate || null,
        endDate: scope.endDate || null,
        categories: scope.categories,
      },
      summary: {
        count: selection.records.length,
        total: selection.total,
        firstDate: selection.firstDate,
        lastDate: selection.lastDate,
        byCategory: selection.byCategory.map(({ category, count, total }) => ({ category, count, total })),
      },
      expenses: selection.records.map(({ id, date, category, description, amount, createdAt, updatedAt }) => ({
        id,
        date,
        category,
        description,
        amount,
        createdAt,
        updatedAt,
      })),
    };
    return new Blob([JSON.stringify(document, null, pretty ? 2 : undefined)], { type: this.mimeType });
  },
};
