/** The clinical "now" used across the app — matches the Stitch reference (Fri, Nov 20 2026, 10:45 AM). */
export const NOW = new Date(2026, 10, 20, 10, 45);

const pad = (n: number) => String(n).padStart(2, '0');

export function toLocalIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseLocalIso(iso: string): Date {
  const [d, t = '00:00'] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [h, min] = t.split(':').map(Number);
  return new Date(y, m - 1, day, h, min);
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday-based week start. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (d.getDay() + 6) % 7;
  return addDays(d, -dow);
}

export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function formatTime(date: Date): string {
  const h = date.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${pad(((h + 11) % 12) + 1)}:${pad(date.getMinutes())} ${suffix}`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Nov 18, 2026" */
export function formatDate(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${pad(date.getDate())}, ${date.getFullYear()}`;
}

/** "Friday, Nov 20, 2026" */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "Today, 08:30 AM" or "Nov 18, 2026" — mirrors the Stitch "Last Visit" column. */
export function formatVisit(date: Date, now: Date = NOW): string {
  return isSameDay(date, now) ? `Today, ${formatTime(date)}` : formatDate(date);
}

export function formatMonthDay(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}

/** "2h ago · 11:45 AM" today, otherwise "3d ago · Nov 16, 2026" (Stitch timeline stamps). */
export function relativeStamp(date: Date, now: Date = NOW): string {
  if (isSameDay(date, now)) {
    const mins = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
    const ago = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
    return date > now ? `Today · ${formatTime(date)}` : `${ago} · ${formatTime(date)}`;
  }
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86400000);
  return days > 0 ? `${days}d ago · ${formatDate(date)}` : `In ${-days}d · ${formatDate(date)}`;
}
