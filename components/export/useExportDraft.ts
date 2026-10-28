"use client";

import { useMemo, useReducer } from "react";
import { defaultFilename, type ExportFormatId, type ExportOptions, type ExportScope, type ExportSort, type FormatSettings } from "@/lib/export";
import type { ExportPreferences } from "@/lib/export/preferences";
import { CATEGORIES, type Category } from "@/lib/types";

export type SettingsPatch = { [K in ExportFormatId]?: Partial<FormatSettings[K]> };

interface DraftState {
  options: ExportOptions;
  /** Once the user types a filename it stops following the date range. */
  filenameEdited: boolean;
}

type Action =
  | { type: "format"; format: ExportFormatId }
  | { type: "range"; startDate: string; endDate: string }
  | { type: "toggle-category"; category: Category }
  | { type: "categories"; categories: Category[] }
  | { type: "sort"; sort: ExportSort }
  | { type: "filename"; filename: string }
  | { type: "reset-filename" }
  | { type: "settings"; patch: SettingsPatch };

function withScope(state: DraftState, scope: ExportScope): DraftState {
  const options = { ...state.options, scope };
  if (!state.filenameEdited) options.filename = defaultFilename(scope);
  return { ...state, options };
}

function reducer(state: DraftState, action: Action): DraftState {
  const { options } = state;
  switch (action.type) {
    case "format":
      return { ...state, options: { ...options, format: action.format } };
    case "range":
      return withScope(state, { ...options.scope, startDate: action.startDate, endDate: action.endDate });
    case "toggle-category": {
      const has = options.scope.categories.includes(action.category);
      // Keep CATEGORIES order so files and labels list categories consistently.
      const categories = CATEGORIES.filter((c) => (c === action.category ? !has : options.scope.categories.includes(c)));
      return withScope(state, { ...options.scope, categories });
    }
    case "categories":
      return withScope(state, { ...options.scope, categories: CATEGORIES.filter((c) => action.categories.includes(c)) });
    case "sort":
      return { ...state, options: { ...options, sort: action.sort } };
    case "filename":
      return { filenameEdited: true, options: { ...options, filename: action.filename } };
    case "reset-filename":
      return { filenameEdited: false, options: { ...options, filename: defaultFilename(options.scope) } };
    case "settings": {
      const settings = { ...options.settings };
      for (const key of Object.keys(action.patch) as ExportFormatId[]) {
        settings[key] = { ...settings[key], ...action.patch[key] } as never;
      }
      return { ...state, options: { ...options, settings } };
    }
  }
}

/** Owns the export dialog's draft. Mount it only while the dialog is open so each opening starts fresh. */
export function useExportDraft(initialScope: ExportScope, preferences: ExportPreferences) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    filenameEdited: false,
    options: { ...preferences, scope: initialScope, filename: defaultFilename(initialScope) },
  }));

  const actions = useMemo(
    () => ({
      setFormat: (format: ExportFormatId) => dispatch({ type: "format", format }),
      setRange: (startDate: string, endDate: string) => dispatch({ type: "range", startDate, endDate }),
      toggleCategory: (category: Category) => dispatch({ type: "toggle-category", category }),
      setCategories: (categories: Category[]) => dispatch({ type: "categories", categories }),
      setSort: (sort: ExportSort) => dispatch({ type: "sort", sort }),
      setFilename: (filename: string) => dispatch({ type: "filename", filename }),
      resetFilename: () => dispatch({ type: "reset-filename" }),
      updateSettings: (patch: SettingsPatch) => dispatch({ type: "settings", patch }),
    }),
    [],
  );

  return { ...state, ...actions };
}

export type ExportDraft = ReturnType<typeof useExportDraft>;
