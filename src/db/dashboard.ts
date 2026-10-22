import type { SQLiteDatabase } from 'expo-sqlite';
import { ORDERS_FIN, ACTIVE_SQL } from './sql';
import { dayBounds, monthBounds } from '../domain/dates';
import { localDateString } from '../domain/orders';

const NET = `COALESCE(SUM(CASE kind WHEN 'payment' THEN amount_minor ELSE -amount_minor END), 0)`;

export async function dashboardStats(db: SQLiteDatabase, now = new Date()) {
  const today = localDateString(now);
  const o = await db.getFirstAsync<{ total: number; pending: number; active: number; in_progress: number; ready: number; due_today: number; overdue: number; outstanding: number }>(
    `SELECT COUNT(*) AS total,
       COALESCE(SUM(${ACTIVE_SQL}), 0) AS active,
       COALESCE(SUM(status='pending'), 0) AS pending,
       COALESCE(SUM(status='in_progress'), 0) AS in_progress,
       COALESCE(SUM(status='ready'), 0) AS ready,
       COALESCE(SUM(${ACTIVE_SQL} AND delivery_date = ?), 0) AS due_today,
       COALESCE(SUM(${ACTIVE_SQL} AND delivery_date < ?), 0) AS overdue,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN MAX(total_minor - paid_minor, 0) END), 0) AS outstanding
     FROM ${ORDERS_FIN} x`, today, today);
  const [ds, de] = dayBounds(now); const [ms, me] = monthBounds(now);
  const day = await db.getFirstAsync<{ v: number }>(`SELECT ${NET} AS v FROM payments WHERE paid_at >= ? AND paid_at < ?`, ds, de);
  const month = await db.getFirstAsync<{ v: number }>(`SELECT ${NET} AS v FROM payments WHERE paid_at >= ? AND paid_at < ?`, ms, me);
  return { ...(o ?? { total: 0, pending: 0, active: 0, in_progress: 0, ready: 0, due_today: 0, overdue: 0, outstanding: 0 }), receivedToday: day?.v ?? 0, receivedMonth: month?.v ?? 0 };
}

/** Net payments received on each of the last 7 local days (oldest first), for the dashboard mini chart. */
export async function incomeLast7Days(db: SQLiteDatabase, now = new Date()): Promise<number[]> {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const [s, e] = dayBounds(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
    const r = await db.getFirstAsync<{ v: number }>(`SELECT ${NET} AS v FROM payments WHERE paid_at >= ? AND paid_at < ?`, s, e);
    out.push(r?.v ?? 0);
  }
  return out;
}
