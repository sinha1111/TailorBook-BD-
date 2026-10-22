import React from 'react';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, Empty, H, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { recentPayments } from '@/db/payments';
import { listOrders } from '@/db/orders';
import { formatMoney } from '@/domain/money';
import { localDateString } from '@/domain/orders';
import { colors } from '@/ui/theme';

export default function Payments() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang } = useLang();
  const { data } = useLoad(async () => {
    const today = localDateString(new Date());
    const due = (await listOrders(db, { filter: 'active', sort: 'delivery', today })).filter((o) => o.total_minor > o.paid_minor);
    const delivered = (await listOrders(db, { filter: 'delivered', today })).filter((o) => o.total_minor > o.paid_minor);
    return { due: [...due, ...delivered], recent: await recentPayments(db) };
  }, [db]);
  const go = (id: string) => r.push({ pathname: '/order/[id]', params: { id } });
  return (
    <Screen>
      <H>{L('বাকি আছে এমন অর্ডার', 'Orders with balance due')}</H>
      {data && data.due.length === 0 ? <Empty text={L('কোনো বাকি নেই', 'Nothing outstanding')} /> : null}
      {data?.due.map((o) => (
        <Card key={o.id} onPress={() => go(o.id)}>
          <T bold>{o.order_number} · {o.customer_name}</T>
          <T color={colors.warn}>{L('বাকি: ', 'Due: ')}{formatMoney(o.total_minor - o.paid_minor, lang)}</T>
          <T muted>{L('পেমেন্ট নিতে ট্যাপ করুন', 'Tap to record a payment')}</T>
        </Card>
      ))}
      <H>{L('সাম্প্রতিক পেমেন্ট', 'Recent payments')}</H>
      {data && data.recent.length === 0 ? <Empty text={L('এখনও কোনো পেমেন্ট নেই', 'No payments yet')} /> : null}
      {data?.recent.map((p) => (
        <Card key={p.id} onPress={() => go(p.order_id)}>
          <T bold color={p.kind === 'refund' ? colors.danger : undefined}>{p.kind === 'refund' ? '− ' : '+ '}{formatMoney(p.amount_minor, lang)}</T>
          <T muted>{p.order_number} · {p.customer_name} · {new Date(p.paid_at).toLocaleDateString()}</T>
        </Card>
      ))}
    </Screen>
  );
}
