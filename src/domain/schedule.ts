import { addDays } from './dates.ts';
import type { OrderStatus } from './orders.ts';

export interface Schedulable { status: OrderStatus; delivery_date: string }

/** Splits active orders into overdue / due today / upcoming (within horizon days). Dates are local YYYY-MM-DD. */
export function groupSchedule<T extends Schedulable>(orders: T[], today: string, horizonDays = 14) {
  const active = orders.filter((o) => o.status === 'pending' || o.status === 'in_progress' || o.status === 'ready');
  const end = addDays(today, horizonDays);
  const byDate = (a: T, b: T) => (a.delivery_date < b.delivery_date ? -1 : a.delivery_date > b.delivery_date ? 1 : 0);
  return {
    overdue: active.filter((o) => o.delivery_date < today).sort(byDate),
    today: active.filter((o) => o.delivery_date === today),
    upcoming: active.filter((o) => o.delivery_date > today && o.delivery_date <= end).sort(byDate),
  };
}
