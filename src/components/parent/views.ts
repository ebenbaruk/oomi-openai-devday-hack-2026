/** "mascot" is the mascot studio, reached from Settings (no tab of its own). */
export const VIEWS = ["today", "child", "settings", "mascot"] as const;
export type View = (typeof VIEWS)[number];

/** The view lives in the URL (`?view=child`) so a refresh keeps the parent where they were. */
export function parseView(value: string | string[] | null | undefined): View {
  return VIEWS.find((view) => view === value) ?? "today";
}
