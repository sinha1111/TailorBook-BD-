import type { SQLiteDatabase } from 'expo-sqlite';
import { ORDERS_FIN } from './sql';
import { dayBounds, monthBounds } from '../domain/dates';
import { localDateString } from '../domain/orders';

export type Period = 'today' | 'month' | 'all';

export async function buildReport(db: SQLiteDatabase, period: Period, now = new Date()) {
  const today = localDateString(now);
  let pStart = '', pEnd = '9999', dStart = '0000-01-01', dEnd = '9999-12-31';
  if (period === 'today') { [pStart, pEnd] = dayBounds(now); dStart = dEnd = today; }
  if (period === 'month') {
    [pStart, pEnd] = monthBounds(now);
    const ym = today.slice(0, 7); dStart = `${ym}-01`; dEnd = `${ym}-31`;
  }
  const orders = await db.getFirstAsync<{ n: number; value: number; discounts: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(total_minor),0) AS value, COALESCE(SUM(discount_minor),0) AS discounts
     FROM ${ORDERS_FIN} x WHERE status != 'cancelled' AND order_date >= ? AND order_date <= ?`, dStart, dEnd);
  const pay = await db.getFirstAsync<{ received: number; refunds: number }>(
    `SELECT COALESCE(SUM(CASE kind WHEN 'payment' THEN amount_minor END),0) AS received,
            COALESCE(SUM(CASE kind WHEN 'refund' THEN amount_minor END),0) AS refunds
     FROM payments WHERE paid_at >= ? AND paid_at < ?`, pStart, pEnd);
  const byStatus = await db.getAllAsync<{ status: string; n: number }>(
    'SELECT status, COUNT(*) AS n FROM orders WHERE order_date >= ? AND order_date <= ? GROUP BY status', dStart, dEnd);
  const garments = await db.getAllAsync<{ garment_type: string; q: number }>(
    `SELECT i.garment_type, SUM(i.quantity) AS q FROM order_items i JOIN orders o ON o.id = i.order_id
     WHERE o.status != 'cancelled' AND o.order_date >= ? AND o.order_date <= ? GROUP BY i.garment_type ORDER BY q DESC`, dStart, dEnd);
  const outstanding = await db.getAllAsync<{ customer_name: string; bal: number }>(
    `SELECT customer_name, SUM(MAX(total_minor - paid_minor, 0)) AS bal FROM ${ORDERS_FIN} x
     WHERE status != 'cancelled' GROUP BY customer_id HAVING bal > 0 ORDER BY bal DESC LIMIT 20`);
  const rows = await db.getAllAsync<{ paid_at: string; kind: string; amount_minor: number }>('SELECT paid_at, kind, amount_minor FROM payments WHERE paid_at >= ? AND paid_at < ?', pStart, pEnd);
  const daily = new Map<string, number>();
  for (const r of rows) { // group by LOCAL calendar day
    const k = localDateString(new Date(r.paid_at));
    daily.set(k, (daily.get(k) ?? 0) + (r.kind === 'payment' ? r.amount_minor : -r.amount_minor));
  }
  return {
    orders: orders ?? { n: 0, value: 0, discounts: 0 }, received: pay?.received ?? 0, refunds: pay?.refunds ?? 0,
    byStatus, garments, outstanding, daily: [...daily.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)),
  };
}
