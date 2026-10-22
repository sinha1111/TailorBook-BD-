import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Chip, EmptyState, Fab, Row, Screen, SearchBar } from '@/ui/components';
import { OrderItem } from '@/ui/OrderItem';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { listOrders, type OrderQuery } from '@/db/orders';
import { localDateString } from '@/domain/orders';
import { colors } from '@/ui/theme';

type F = NonNullable<OrderQuery['filter']>;
type S = NonNullable<OrderQuery['sort']>;

export default function Orders() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, s } = useLang();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [q, setQ] = useState(''); const [filter, setFilter] = useState<F>('active'); const [sort, setSort] = useState<S>('latest');
  const today = localDateString(new Date());
  React.useEffect(() => { if (params.filter) setFilter(params.filter as F); }, [params.filter]);
  const { data } = useLoad(() => listOrders(db, { q, filter, sort, today }), [db, q, filter, sort, today]);
  const filters: [F, string][] = [['active', L('সক্রিয়', 'Active')], ['due_today', L('আজ', 'Due today')], ['overdue', L('মেয়াদোত্তীর্ণ', 'Overdue')],
    ['pending', s.status.pending], ['in_progress', s.status.in_progress], ['ready', s.status.ready], ['delivered', s.status.delivered], ['cancelled', s.status.cancelled], ['all', L('সব', 'All')]];
  const sorts: [S, string][] = [['latest', L('সর্বশেষ', 'Latest')], ['earliest', L('পুরনো', 'Earliest')], ['delivery', L('ডেলিভারি তারিখ', 'Delivery date')]];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen bottom={100}>
        <SearchBar value={q} onChangeText={setQ} placeholder={L('অর্ডার নম্বর, গ্রাহক বা পোশাক খুঁজুন...', 'Search order no., customer or garment...')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><Row>{filters.map(([k, label]) => <Chip key={k} label={label} selected={filter === k} onPress={() => setFilter(k)} />)}</Row></ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><Row>{sorts.map(([k, label]) => <Chip key={k} label={label} selected={sort === k} onPress={() => setSort(k)} />)}</Row></ScrollView>
        {data && data.length === 0 ? <EmptyState icon="receipt-outline" title={L('কোনো অর্ডার পাওয়া যায়নি', 'No orders found')} actionLabel={L('নতুন অর্ডার', 'New order')} onAction={() => r.push('/order/new')} /> : null}
        {data?.map((o) => <OrderItem key={o.id} o={o} today={today} />)}
      </Screen>
      <Fab onPress={() => r.push('/order/new')} label={L('নতুন অর্ডার', 'New order')} />
    </View>
  );
}
