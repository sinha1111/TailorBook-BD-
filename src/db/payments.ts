import type { SQLiteDatabase } from 'expo-sqlite';
import { newId } from './ids';
import { ORDERS_FIN, type OrderRow } from './sql';
import { validatePayment, validateRefund, type PaymentRow } from '../domain/orders';

export type Method = 'cash' | 'mfs' | 'bank' | 'other';

async function ledger(db: SQLiteDatabase, orderId: string): Promise<PaymentRow[]> {
  const rows = await db.getAllAsync<{ kind: 'payment' | 'refund'; amount_minor: number }>('SELECT kind, amount_minor FROM payments WHERE order_id=?', orderId);
  return rows.map((r) => ({ kind: r.kind, amountMinor: r.amount_minor }));
}

export async function recordPayment(db: SQLiteDatabase, p: { orderId: string; amountMinor: number; method: Method; note?: string }): Promise<void> {
  await db.withTransactionAsync(async () => {
    const o = await db.getFirstAsync<OrderRow>(`SELECT * FROM ${ORDERS_FIN} x WHERE x.id=?`, p.orderId);
    if (!o) throw new Error('not_found');
    const err = validatePayment(o.status, o.total_minor, await ledger(db, p.orderId), p.amountMinor);
    if (err) throw new Error(err);
    const now = new Date().toISOString();
    await db.runAsync(`INSERT INTO payments(id,order_id,customer_id,kind,amount_minor,method,paid_at,note,created_at) VALUES (?,?,?, 'payment', ?,?,?,?,?)`,
      newId(), p.orderId, o.customer_id, p.amountMinor, p.method, now, p.note?.trim() || null, now);
  });
}

/** Corrections never delete: a refund row is appended that points to the payment it reverses. */
export async function reversePayment(db: SQLiteDatabase, paymentId: string, note?: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    const p = await db.getFirstAsync<{ order_id: string; customer_id: string; kind: string; amount_minor: number; method: Method }>('SELECT * FROM payments WHERE id=?', paymentId);
    if (!p || p.kind !== 'payment') throw new Error('not_found');
    const done = await db.getFirstAsync<{ id: string }>('SELECT id FROM payments WHERE reverses_payment_id=?', paymentId);
    if (done) throw new Error('already_reversed');
    const err = validateRefund(await ledger(db, p.order_id), p.amount_minor);
    if (err) throw new Error(err);
    const now = new Date().toISOString();
    await db.runAsync(`INSERT INTO payments(id,order_id,customer_id,kind,amount_minor,method,paid_at,reverses_payment_id,note,created_at) VALUES (?,?,?, 'refund', ?,?,?,?,?,?)`,
      newId(), p.order_id, p.customer_id, p.amount_minor, p.method, now, paymentId, note?.trim() || 'Reversal', now);
  });
}

export function recentPayments(db: SQLiteDatabase, limit = 50) {
  return db.getAllAsync<{ id: string; order_id: string; order_number: string; customer_name: string; kind: string; amount_minor: number; method: string; paid_at: string }>(
    `SELECT p.id, p.order_id, o.order_number, c.name AS customer_name, p.kind, p.amount_minor, p.method, p.paid_at
     FROM payments p JOIN orders o ON o.id=p.order_id JOIN customers c ON c.id=p.customer_id ORDER BY p.paid_at DESC, p.created_at DESC LIMIT ?`, limit);
}
