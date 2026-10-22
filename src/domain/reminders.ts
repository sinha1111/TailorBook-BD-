import { addDays } from './dates.ts';
import { localDateString } from './orders.ts';
import type { Lang } from '../i18n/strings.ts';

export interface ReminderOrder { id: string; orderNumber: string; customerName: string; deliveryDate: string; active: boolean }
export interface PlannedReminder { identifier: string; date: Date; title: string; body: string }

const at = (day: string, hour: number): Date => {
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hour, 0, 0);
};

/** Pure plan of which local notifications should exist. Identifiers are stable, so re-syncing never duplicates. */
export function planReminders(orders: ReminderOrder[], now: Date, opts: { dayBefore: boolean; lang: Lang }): PlannedReminder[] {
  const L = (bn: string, en: string) => (opts.lang === 'bn' ? bn : en);
  const out: PlannedReminder[] = [];
  const today = localDateString(now);
  let overdue = 0;
  for (const o of orders) {
    if (!o.active) continue;
    if (o.deliveryDate < today) { overdue++; continue; }
    const due = at(o.deliveryDate, 9);
    if (due > now) out.push({ identifier: `due-${o.id}`, date: due, title: L('আজ ডেলিভারি', 'Delivery due today'), body: `${o.orderNumber} · ${o.customerName}` });
    if (opts.dayBefore) {
      const pre = at(addDays(o.deliveryDate, -1), 17);
      if (pre > now) out.push({ identifier: `pre-${o.id}`, date: pre, title: L('কাল ডেলিভারি', 'Delivery due tomorrow'), body: `${o.orderNumber} · ${o.customerName}` });
    }
  }
  if (overdue > 0) {
    const next = at(today, 9) > now ? at(today, 9) : at(addDays(today, 1), 9);
    out.push({ identifier: 'overdue-summary', date: next, title: L('মেয়াদোত্তীর্ণ অর্ডার', 'Overdue orders'), body: L(`${overdue}টি অর্ডারের ডেলিভারি দেরি হয়েছে`, `${overdue} order(s) are past their delivery date`) });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 60);
}
