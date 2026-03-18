/**
 * Parse "HH:MM" start time string into a Unix timestamp (ms).
 * Uses a reference date of 2026-05-01 (approximate PdG race date).
 * If the absolute time represents next-day (e.g. 06:30 after 22:45 start),
 * it is resolved accordingly.
 */
export function parseStartTimeMs(startTimeStr: string, raceDateStr = '2026-05-01'): number {
  const [h, m] = startTimeStr.split(':').map(Number);
  const date = new Date(`${raceDateStr}T${pad(h)}:${pad(m)}:00`);
  return date.getTime();
}

/**
 * Given a start time (ms) and an absolute clock time string "HH:MM",
 * return the corresponding Unix timestamp (ms).
 * Handles next-day crossing: if the parsed time is before the start time,
 * add 24 hours (e.g. "06:30" after a "22:45" start is next-day 06:30).
 */
export function resolveAbsoluteTimeMs(absoluteTimeStr: string, startMs: number): number {
  const startDate = new Date(startMs);
  const raceDateStr = startDate.toISOString().slice(0, 10);
  const [h, m] = absoluteTimeStr.split(':').map(Number);

  const candidate = new Date(`${raceDateStr}T${pad(h)}:${pad(m)}:00`).getTime();

  // If this time is before (or equal to) the start, it must be the next calendar day
  if (candidate <= startMs) {
    return candidate + 24 * 60 * 60 * 1000;
  }
  return candidate;
}

/**
 * Format a Unix timestamp (ms) as "HH:MM" in local time.
 */
export function formatClock(ms: number): string {
  const date = new Date(ms);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Format milliseconds duration as "Xh YYm".
 */
export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${pad(m)}m`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
