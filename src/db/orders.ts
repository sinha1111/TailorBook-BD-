import type { SQLiteDatabase } from 'expo-sqlite';
import { newId } from './ids';
import { ORDERS_FIN, ACTIVE_SQL, type OrderRow } from './sql';
import { canTransition, formatOrderNumber, orderTotal, validateItem, validatePayment, type OrderStatus } from '../domain/orders';
import { isValidDate } from '../domain/dates';
import { localDateString } from '../domain/orders';

export interface NewOrderItem { garmentType: string; description?: string; quantity: number; unitPriceMinor: number }
export interface NewOrder {
  clientRequestId: string; customerId: string; deliveryDate: string; discountMinor: number; advanceMinor: number;
  items: NewOrderItem[]; fabricInfo?: string; styleNotes?: string; instructions?: string;
}
const clean = (s?: string): string | null => (s && s.trim() ? s.trim() : null);

/** Creates the order, items, measurement snapshots, advance payment and order number in ONE transaction. Idempotent per clientRequestId. */
export async function createOrder(db: SQLiteDatabase, o: NewOrder): Promise<string> {
  if (o.items.length === 0) throw new Error('items_required');
  for (const it of o.items) { const e = validateItem(it); if (e) throw new Error(e); }
  const total = orderTotal(o.items, o.discountMinor);
  if (total === null) throw new Error('discount_invalid');
  const today = localDateString(new Date());
  if (!isValidDate(o.deliveryDate) || o.deliveryDate < today) throw new Error('date_invalid');
  if (o.advanceMinor < 0) throw new Error('amount_invalid');
  if (o.advanceMinor > 0) {
    const e = validatePayment('pending', total, [], o.advanceMinor);
    if (e) throw new Error(e);
  }
  let orderId = '';
  await db.withTransactionAsync(async () => {
    const dup = await db.getFirstAsync<{ id: string }>('SELECT id FROM orders WHERE client_request_id=?', o.clientRequestId);
    if (dup) { orderId = dup.id; return; }
    await db.runAsync("UPDATE counters SET value = value + 1 WHERE name='order_seq'");
    const seq = (await db.getFirstAsync<{ value: number }>("SELECT value FROM counters WHERE name='order_seq'"))?.value ?? 1;
    const now = new Date().toISOString();
    orderId = newId();
    await db.runAsync(
      `INSERT INTO orders(id,order_number,client_request_id,customer_id,status,order_date,delivery_date,discount_minor,fabric_info,style_notes,instructions,created_at,updated_at)
       VALUES (?,?,?,?, 'pending', ?,?,?,?,?,?,?,?)`,
      orderId, formatOrderNumber(seq, new Date().getFullYear()), o.clientRequestId, o.customerId, today, o.deliveryDate,
      o.discountMinor, clean(o.fabricInfo), clean(o.styleNotes), clean(o.instructions), now, now);
    for (const it of o.items) {
      const itemId = newId();
      await db.runAsync('INSERT INTO order_items(id,order_id,garment_type,description,quantity,unit_price_minor) VALUES (?,?,?,?,?,?)',
        itemId, orderId, it.garmentType, clean(it.description), it.quantity, it.unitPriceMinor);
      // Freeze the customer's latest measurement for this garment into the order.
      const m = await db.getFirstAsync<{ id: string; unit: string; fields_json: string; notes: string | null }>(
        'SELECT id, unit, fields_json, notes FROM measurements WHERE customer_id=? AND garment_type=? ORDER BY version DESC LIMIT 1',
        o.customerId, it.garmentType);
      if (m) {
        await db.runAsync('INSERT INTO order_measurement_snapshots(id,order_item_id,unit,fields_json,notes,source_measurement_id) VALUES (?,?,?,?,?,?)',
          newId(), itemId, m.unit, m.fields_json, m.notes, m.id);
      }
    }
    if (o.advanceMinor > 0) {
      await db.runAsync(`INSERT INTO payments(id,order_id,customer_id,kind,amount_minor,method,paid_at,note,created_at) VALUES (?,?,?, 'payment', ?, 'cash', ?, 'Advance', ?)`,
        newId(), orderId, o.customerId, o.advanceMinor, now, now);
    }
  });
  return orderId;
}

export interface OrderQuery { q?: string; filter?: 'all' | 'active' | 'due_today' | 'overdue' | OrderStatus; sort?: 'latest' | 'earliest' | 'delivery'; today: string }

export function listOrders(db: SQLiteDatabase, qy: OrderQuery) {
  const where: string[] = []; const params: string[] = [];
  if (qy.q?.trim()) {
    const l = `%${qy.q.trim()}%`;
    where.push(`(x.order_number LIKE ? OR x.customer_name LIKE ? OR IFNULL(x.garments,'') LIKE ? OR IFNULL(x.customer_phone,'') LIKE ?)`);
    params.push(l, l, l, l);
  }
  const f = qy.filter ?? 'all';
  if (f === 'active') where.push(ACTIVE_SQL);
  else if (f === 'due_today') { where.push(`${ACTIVE_SQL} AND delivery_date = ?`); params.push(qy.today); }
  else if (f === 'overdue') { where.push(`${ACTIVE_SQL} AND delivery_date < ?`); params.push(qy.today); }
  else if (f !== 'all') { where.push('status = ?'); params.push(f); }
  const order = qy.sort === 'earliest' ? 'x.created_at ASC' : qy.sort === 'delivery' ? 'x.delivery_date ASC' : 'x.created_at DESC';
  return db.getAllAsync<OrderRow>(`SELECT * FROM ${ORDERS_FIN} x ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`, ...params);
}

export interface ItemRow { id: string; garment_type: string; description: string | null; quantity: number; unit_price_minor: number; snapshot_json: string | null; snapshot_unit: string | null }
export interface PaymentRecord { id: string; kind: 'payment' | 'refund'; amount_minor: number; method: string; paid_at: string; note: string | null; reverses_payment_id: string | null }

export async function getOrderDetail(db: SQLiteDatabase, id: string) {
  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM ${ORDERS_FIN} x WHERE x.id=?`, id);
  if (!order) return null;
  const items = await db.getAllAsync<ItemRow>(
    `SELECT i.id, i.garment_type, i.description, i.quantity, i.unit_price_minor, s.fields_json AS snapshot_json, s.unit AS snapshot_unit
     FROM order_items i LEFT JOIN order_measurement_snapshots s ON s.order_item_id = i.id WHERE i.order_id=? ORDER BY i.rowid`, id);
  const payments = await db.getAllAsync<PaymentRecord>('SELECT id,kind,amount_minor,method,paid_at,note,reverses_payment_id FROM payments WHERE order_id=? ORDER BY paid_at, created_at', id);
  return { order, items, payments };
}

/** Status changes never touch payments or mark anything paid. */
export async function changeStatus(db: SQLiteDatabase, id: string, to: OrderStatus): Promise<void> {
  const cur = await db.getFirstAsync<{ status: OrderStatus }>('SELECT status FROM orders WHERE id=?', id);
  if (!cur) throw new Error('not_found');
  if (!canTransition(cur.status, to)) throw new Error('transition_invalid');
  const now = new Date().toISOString();
  await db.runAsync('UPDATE orders SET status=?, cancelled_at=?, updated_at=? WHERE id=?', to, to === 'cancelled' ? now : null, now, id);
}

export async function updateOrder(db: SQLiteDatabase, u: { id: string; deliveryDate: string; discountMinor: number; fabricInfo?: string; styleNotes?: string; instructions?: string }): Promise<void> {
  if (!isValidDate(u.deliveryDate)) throw new Error('date_invalid');
  await db.withTransactionAsync(async () => {
    const o = await db.getFirstAsync<OrderRow>(`SELECT * FROM ${ORDERS_FIN} x WHERE x.id=?`, u.id);
    if (!o) throw new Error('not_found');
    const sub = o.total_minor + o.discount_minor;
    if (!Number.isInteger(u.discountMinor) || u.discountMinor < 0 || u.discountMinor > sub) throw new Error('discount_invalid');
    if (o.status !== 'cancelled' && sub - u.discountMinor < o.paid_minor) throw new Error('total_below_paid');
    await db.runAsync('UPDATE orders SET delivery_date=?, discount_minor=?, fabric_info=?, style_notes=?, instructions=?, updated_at=? WHERE id=?',
      u.deliveryDate, u.discountMinor, clean(u.fabricInfo), clean(u.styleNotes), clean(u.instructions), new Date().toISOString(), u.id);
  });
}
