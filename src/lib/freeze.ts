/**
 * Read-only freeze for the old Daily Notes & Attendance app.
 * On and after FREEZE_DATE, the app becomes view-only: a banner explains the
 * move to Summit, and every control that creates or edits a note or
 * attendance entry is disabled. Existing notes remain viewable.
 */
export const FREEZE_DATE = '2026-09-15';

/** 06:00Z = midnight Denver under daylight time (UTC-6). */
export const isFrozen = () => new Date() >= new Date(FREEZE_DATE + 'T06:00:00Z');

/** FREEZE_DATE formatted like "Sep 15, 2026" for display in the banner. */
export function formatFreezeDate(): string {
  const [y, m, d] = FREEZE_DATE.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
