import type { OrderStatus } from '../domain/orders';

/** Orders joined with derived totals. Totals/paid are always computed, never stored. */
export const ORDERS_FIN = `(SELECT o.*, c.name AS customer_name, c.phone AS customer_phone,
  COALESCE((SELECT SUM(quantity * unit_price_minor) FROM order_items WHERE order_id = o.id), 0) - o.discount_minor AS total_minor,
  COALESCE((SELECT SUM(CASE kind WHEN 'payment' THEN amount_minor ELSE -amount_minor END) FROM payments WHERE order_id = o.id), 0) AS paid_minor,
  (SELECT group_concat(garment_type, ', ') FROM order_items WHERE order_id = o.id) AS garments
  FROM orders o JOIN customers c ON c.id = o.customer_id)`;

export const ACTIVE_SQL = `status IN ('pending','in_progress','ready')`;

export interface OrderRow {
  id: string; order_number: string; customer_id: string; customer_name: string; customer_phone: string | null;
  status: OrderStatus; order_date: string; delivery_date: string; discount_minor: number;
  fabric_info: string | null; style_notes: string | null; instructions: string | null;
  total_minor: number; paid_minor: number; garments: string | null; created_at: string;
}
