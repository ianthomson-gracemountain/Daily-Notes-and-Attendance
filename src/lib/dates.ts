const TIMEZONE = 'America/Denver';

/** Get today's date string (YYYY-MM-DD) in Mountain time */
export function getMountainToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Get day of week (0=Sun, 6=Sat) in Mountain time */
export function getMountainDayOfWeek(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
  }).formatToParts(new Date());
  const weekday = parts.find(p => p.type === 'weekday')?.value || '';
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

/** Convert a Date object to YYYY-MM-DD in Mountain time */
export function toMountainDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Get start of week (Sunday) and end of week (Saturday) as YYYY-MM-DD strings in Mountain time */
export function getMountainWeekRange(): { start: string; end: string } {
  const today = getMountainToday();
  const dayOfWeek = getMountainDayOfWeek();

  // Parse the Mountain date string to get a date at noon (avoids DST edge cases)
  const [y, m, d] = today.split('-').map(Number);
  const base = new Date(y, m - 1, d, 12, 0, 0);

  const sunday = new Date(base);
  sunday.setDate(base.getDate() - dayOfWeek);

  const saturday = new Date(base);
  saturday.setDate(base.getDate() + (6 - dayOfWeek));

  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  return { start: fmt(sunday), end: fmt(saturday) };
}

/** Generate array of date strings (YYYY-MM-DD) from start to end inclusive */
export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd, 12, 0, 0);

  const [ey, em, ed] = end.split('-').map(Number);
  const endDate = new Date(ey, em - 1, ed, 12, 0, 0);

  while (current <= endDate) {
    dates.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
    );
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
