import React from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { EmptyState, Screen, SectionHeader } from '@/ui/components';
import { OrderItem } from '@/ui/OrderItem';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { listOrders } from '@/db/orders';
import { groupSchedule } from '@/domain/schedule';
import { localDateString } from '@/domain/orders';

export default function Schedule() {
  const db = useSQLiteContext(); const { L } = useLang();
  const today = localDateString(new Date());
  const { data } = useLoad(async () => groupSchedule(await listOrders(db, { filter: 'active', sort: 'delivery', today }), today, 14), [db, today]);
  const empty = data && data.overdue.length + data.today.length + data.upcoming.length === 0;
  return (
    <Screen>
      {empty ? <EmptyState icon="calendar-outline" title={L('কোনো ডেলিভারি বাকি নেই', 'No pending deliveries')} text={L('সক্রিয় অর্ডার তৈরি হলে এখানে দেখা যাবে।', 'Active orders will appear here.')} /> : null}
      {data && data.overdue.length > 0 ? (<><SectionHeader title={`${L('মেয়াদোত্তীর্ণ', 'Overdue')} (${data.overdue.length})`} />{data.overdue.map((o) => <OrderItem key={o.id} o={o} today={today} />)}</>) : null}
      {data && data.today.length > 0 ? (<><SectionHeader title={`${L('আজকের ডেলিভারি', "Today's deliveries")} (${data.today.length})`} />{data.today.map((o) => <OrderItem key={o.id} o={o} today={today} />)}</>) : null}
      {data && data.upcoming.length > 0 ? (<><SectionHeader title={`${L('আগামী ১৪ দিন', 'Next 14 days')} (${data.upcoming.length})`} />{data.upcoming.map((o) => <OrderItem key={o.id} o={o} today={today} />)}</>) : null}
    </Screen>
  );
}
