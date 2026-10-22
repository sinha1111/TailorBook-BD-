import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn } from '@/ui/components';
import { shareOrdersCsv } from '@/services/exports';
import { Card, Chip, H, Row, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { buildReport, type Period } from '@/db/reports';
import { formatMoney } from '@/domain/money';
import { GARMENT_LABEL } from '@/domain/units';

export default function Reports() {
  const db = useSQLiteContext(); const { L, lang, s, err } = useLang();
  const [period, setPeriod] = useState<Period>('month');
  const { data: d } = useLoad(() => buildReport(db, period), [db, period]);
  const m = (x: number) => formatMoney(x, lang);
  return (
    <Screen>
      <Row>
        <Chip label={L('আজ', 'Today')} selected={period === 'today'} onPress={() => setPeriod('today')} />
        <Chip label={L('এই মাস', 'This month')} selected={period === 'month'} onPress={() => setPeriod('month')} />
        <Chip label={L('সব সময়', 'All time')} selected={period === 'all'} onPress={() => setPeriod('all')} />
      </Row>
      <Btn variant="ghost" title={L('অর্ডার CSV এক্সপোর্ট', 'Export orders (CSV)')} onPress={() => shareOrdersCsv(db).catch((e: unknown) => Alert.alert(L('সম্ভব হয়নি', 'Not possible'), err(e)))} />
      {d ? (
        <>
          <Card>
            <T bold>{L('অর্ডার মূল্য (বাতিল বাদে): ', 'Order value (excl. cancelled): ')}{m(d.orders.value)}</T>
            <T muted>{d.orders.n} {L('টি অর্ডার', 'orders')} · {L('ছাড়: ', 'Discounts: ')}{m(d.orders.discounts)}</T>
            <T bold>{L('প্রাপ্ত নগদ (নিট): ', 'Cash received (net): ')}{m(d.received - d.refunds)}</T>
            <T muted>{L('মোট গ্রহণ ', 'Received ')}{m(d.received)} · {L('ফেরত ', 'Refunds ')}{m(d.refunds)}</T>
            <T muted>{L('এটি আয়ের হিসাব, মুনাফা নয় — খরচ ট্র্যাক করা হয় না।', 'This is revenue, not profit — expenses are not tracked.')}</T>
          </Card>
          <H>{L('দৈনিক প্রাপ্তি', 'Daily payments received')}</H>
          {d.daily.length === 0 ? <T muted>{L('কোনো পেমেন্ট নেই', 'No payments')}</T> : d.daily.map(([day, v]) => <T key={day}>{day}: {m(v)}</T>)}
          <H>{L('স্ট্যাটাস অনুযায়ী অর্ডার', 'Orders by status')}</H>
          {d.byStatus.length === 0 ? <T muted>—</T> : d.byStatus.map((x) => <T key={x.status}>{s.status[x.status as keyof typeof s.status] ?? x.status}: {x.n}</T>)}
          <H>{L('পোশাকভিত্তিক সংখ্যা', 'Garment counts')}</H>
          {d.garments.length === 0 ? <T muted>—</T> : d.garments.map((x) => <T key={x.garment_type}>{GARMENT_LABEL[x.garment_type]?.[lang === 'bn' ? 0 : 1] ?? x.garment_type}: {x.q}</T>)}
          <H>{L('গ্রাহকের বাকি (সব সময়)', 'Customer balances (all time)')}</H>
          {d.outstanding.length === 0 ? <T muted>{L('কোনো বাকি নেই', 'Nothing outstanding')}</T> : d.outstanding.map((x, i) => <T key={i}>{x.customer_name}: {m(x.bal)}</T>)}
        </>
      ) : null}
    </Screen>
  );
}
