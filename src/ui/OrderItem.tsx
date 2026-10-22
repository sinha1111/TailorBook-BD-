import React from 'react';
import { useRouter } from 'expo-router';
import { OrderCard } from './components';
import { useLang } from './lang';
import { formatMoney } from '../domain/money';
import { isOverdue } from '../domain/orders';
import type { OrderRow } from '../db/sql';

/** Order list row: turns a DB row into display strings for OrderCard and opens the order. */
export function OrderItem({ o, today }: { o: OrderRow; today: string }) {
  const r = useRouter(); const { L, lang, s } = useLang();
  const late = isOverdue(o.status, o.delivery_date, today);
  const due = o.status === 'cancelled' ? 0 : Math.max(o.total_minor - o.paid_minor, 0);
  return (
    <OrderCard number={o.order_number} customer={o.customer_name} garments={o.garments ?? ''} total={formatMoney(o.total_minor, lang)}
      due={due > 0 ? `${L('বাকি ', 'due ')}${formatMoney(due, lang)}` : null} status={o.status} statusLabel={s.status[o.status]}
      date={o.delivery_date} overdueLabel={late ? L('মেয়াদোত্তীর্ণ', 'Overdue') : null}
      onPress={() => r.push({ pathname: '/order/[id]', params: { id: o.id } })} />
  );
}
