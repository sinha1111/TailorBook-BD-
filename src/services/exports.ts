import type { SQLiteDatabase } from 'expo-sqlite';
import { listOrders } from '../db/orders';
import { localDateString } from '../domain/orders';
import { minorToDecimal, toCsv } from '../domain/csv';
import { shareTextFile } from './files';

export async function shareOrdersCsv(db: SQLiteDatabase): Promise<void> {
  const today = localDateString(new Date());
  const rows = await listOrders(db, { filter: 'all', sort: 'latest', today });
  const csv = toCsv([
    ['order_number', 'customer', 'phone', 'status', 'order_date', 'delivery_date', 'garments', 'discount_bdt', 'total_bdt', 'paid_bdt', 'balance_bdt'],
    ...rows.map((o) => [o.order_number, o.customer_name, o.customer_phone, o.status, o.order_date, o.delivery_date, o.garments, minorToDecimal(o.discount_minor), minorToDecimal(o.total_minor), minorToDecimal(o.paid_minor),
      minorToDecimal(o.status === 'cancelled' ? 0 : Math.max(o.total_minor - o.paid_minor, 0))]),
  ]);
  await shareTextFile(`orders-${today}.csv`, 'text/csv', csv);
}
