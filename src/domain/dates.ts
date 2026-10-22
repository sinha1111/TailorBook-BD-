import { localDateString } from './orders.ts';

export function isValidDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function addDays(date: string, n: number): string {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number);
  return localDateString(new Date(y, m - 1, d + n));
}

/** Local-day boundaries as UTC ISO strings, for querying paid_at timestamps. [start, end) */
export function dayBounds(d: Date): [string, string] {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return [s.toISOString(), e.toISOString()];
}

export function monthBounds(d: Date): [string, string] {
  return [new Date(d.getFullYear(), d.getMonth(), 1).toISOString(), new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()];
}
