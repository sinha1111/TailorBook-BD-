import type { SQLiteDatabase } from 'expo-sqlite';
import { newId } from './ids';
import { ORDERS_FIN } from './sql';

export interface Customer { id: string; name: string; phone: string | null; address: string | null; notes: string | null; created_at: string; updated_at: string }
export interface CustomerListRow extends Customer { order_count: number; balance_minor: number }
export interface CustomerInput { id?: string; name: string; phone?: string; address?: string; notes?: string }

const clean = (s?: string): string | null => (s && s.trim() ? s.trim() : null);

export async function saveCustomer(db: SQLiteDatabase, i: CustomerInput): Promise<string> {
  if (!i.name.trim()) throw new Error('name_required');
  const now = new Date().toISOString();
  if (i.id) {
    await db.runAsync('UPDATE customers SET name=?, phone=?, address=?, notes=?, updated_at=? WHERE id=?',
      i.name.trim(), clean(i.phone), clean(i.address), clean(i.notes), now, i.id);
    return i.id;
  }
  const id = newId();
  await db.runAsync('INSERT INTO customers(id,name,phone,address,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',
    id, i.name.trim(), clean(i.phone), clean(i.address), clean(i.notes), now, now);
  return id;
}

export function getCustomer(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id=?', id);
}

export function listCustomers(db: SQLiteDatabase, q = '') {
  const like = `%${q.trim()}%`;
  return db.getAllAsync<CustomerListRow>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) AS order_count,
       COALESCE((SELECT SUM(MAX(total_minor - paid_minor, 0)) FROM ${ORDERS_FIN} x WHERE x.customer_id = c.id AND x.status != 'cancelled'), 0) AS balance_minor
     FROM customers c WHERE c.name LIKE ? OR IFNULL(c.phone,'') LIKE ? ORDER BY c.name COLLATE NOCASE`, like, like);
}

export async function customerSummary(db: SQLiteDatabase, id: string) {
  const r = await db.getFirstAsync<{ n: number; total: number; paid: number; balance: number }>(
    `SELECT COUNT(*) AS n,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_minor END), 0) AS total,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN paid_minor END), 0) AS paid,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN MAX(total_minor - paid_minor, 0) END), 0) AS balance
     FROM ${ORDERS_FIN} x WHERE x.customer_id = ?`, id);
  return r ?? { n: 0, total: 0, paid: 0, balance: 0 };
}

/** Customers that have orders are never deleted, so financial history stays intact. */
export async function deleteCustomer(db: SQLiteDatabase, id: string): Promise<void> {
  const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM orders WHERE customer_id=?', id);
  if ((r?.n ?? 0) > 0) throw new Error('customer_has_orders');
  await db.runAsync('DELETE FROM customers WHERE id=?', id);
}
