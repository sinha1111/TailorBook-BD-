import type { Minor } from './money.ts';

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
export type PaymentKind = 'payment' | 'refund';

export interface OrderItemInput { quantity: number; unitPriceMinor: Minor }
export interface PaymentRow { kind: PaymentKind; amountMinor: Minor }

export const ORDER_NUMBER_PREFIX = 'TB';

export function formatOrderNumber(seq: number, year: number): string {
  return `${ORDER_NUMBER_PREFIX}-${year}-${String(seq).padStart(4, '0')}`;
}

export function validateItem(i: OrderItemInput): string | null {
  if (!Number.isInteger(i.quantity) || i.quantity < 1) return 'quantity_invalid';
  if (!Number.isInteger(i.unitPriceMinor) || i.unitPriceMinor < 0) return 'price_invalid';
  return null;
}

export function itemsSubtotal(items: OrderItemInput[]): Minor {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPriceMinor, 0);
}

/** Total = subtotal - discount. Discount may not be negative or exceed the subtotal. */
export function orderTotal(items: OrderItemInput[], discountMinor: Minor): Minor | null {
  const sub = itemsSubtotal(items);
  if (!Number.isInteger(discountMinor) || discountMinor < 0 || discountMinor > sub) return null;
  return sub - discountMinor;
}

export function netPaid(payments: PaymentRow[]): Minor {
  return payments.reduce((s, p) => s + (p.kind === 'payment' ? p.amountMinor : -p.amountMinor), 0);
}

export interface Financials {
  /** Value counted toward ordinary revenue/receivables. 0 for cancelled orders. */
  billableMinor: Minor;
  paidMinor: Minor;
  /** Amount the customer still owes. Never negative. */
  balanceMinor: Minor;
  /** Money held for a cancelled order that should be refunded or kept as credit. */
  refundDueMinor: Minor;
}

export function orderFinancials(status: OrderStatus, totalMinor: Minor, payments: PaymentRow[]): Financials {
  const paid = netPaid(payments);
  if (status === 'cancelled') {
    return { billableMinor: 0, paidMinor: paid, balanceMinor: 0, refundDueMinor: Math.max(paid, 0) };
  }
  return { billableMinor: totalMinor, paidMinor: paid, balanceMinor: Math.max(totalMinor - paid, 0), refundDueMinor: 0 };
}

/** Overpayment is blocked: returns an error code or null if the payment is acceptable. */
export function validatePayment(status: OrderStatus, totalMinor: Minor, existing: PaymentRow[], amountMinor: Minor): string | null {
  if (status === 'cancelled') return 'order_cancelled';
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) return 'amount_invalid';
  if (netPaid(existing) + amountMinor > totalMinor) return 'overpayment';
  return null;
}

/** A refund can't exceed what was actually paid. */
export function validateRefund(existing: PaymentRow[], amountMinor: Minor): string | null {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) return 'amount_invalid';
  if (amountMinor > netPaid(existing)) return 'refund_exceeds_paid';
  return null;
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['in_progress', 'ready', 'cancelled'],
  in_progress: ['pending', 'ready', 'cancelled'],
  ready: ['in_progress', 'delivered', 'cancelled'],
  delivered: ['ready'], // correction only; never changes payments automatically
  cancelled: ['pending'], // reopen
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Dates are local 'YYYY-MM-DD' strings. Overdue = active order whose delivery date is before today. */
export function isOverdue(status: OrderStatus, deliveryDate: string, today: string): boolean {
  return (status === 'pending' || status === 'in_progress' || status === 'ready') && deliveryDate < today;
}

export function localDateString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
