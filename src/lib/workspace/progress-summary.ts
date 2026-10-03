import type { Progress } from "./types";

/** Counts updates over four UTC weeks, never wellbeing or health. */
export function summarizeProgress(entries: Progress[], asOf: string) {
  const now = new Date(asOf);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const monday = today - ((now.getUTCDay() + 6) % 7) * 86400000;
  return Array.from({ length: 4 }, (_, index) => {
    const start = monday - (3 - index) * 7 * 86400000;
    const end = start + 7 * 86400000;
    return {
      start: new Date(start).toISOString(),
      label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(start),
      count: entries.filter(entry => {
        const timestamp = Date.parse(entry.created_at);
        return timestamp >= start && timestamp < end && timestamp <= now.getTime();
      }).length,
    };
  });
}
