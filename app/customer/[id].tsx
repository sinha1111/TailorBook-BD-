import React from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Avatar, Btn, Card, H, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { customerSummary, deleteCustomer, getCustomer } from '@/db/customers';
import { formatMoney } from '@/domain/money';
import { ORDERS_FIN } from '@/db/sql';
import type { OrderRow } from '@/db/sql';

export default function CustomerProfile() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang, s, err } = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useLoad(async () => {
    const c = await getCustomer(db, id);
    const sum = await customerSummary(db, id);
    const orders = await db.getAllAsync<OrderRow>(`SELECT * FROM ${ORDERS_FIN} x WHERE x.customer_id=? ORDER BY x.created_at DESC`, id);
    return { c, sum, orders };
  }, [db, id]);
  if (!data?.c) return <Screen><T muted>{L('লোড হচ্ছে…', 'Loading…')}</T></Screen>;
  const { c, sum, orders } = data;
  const remove = () => Alert.alert(L('গ্রাহক মুছবেন?', 'Delete customer?'), c.name, [
    { text: L('বাতিল', 'Cancel'), style: 'cancel' },
    { text: L('মুছুন', 'Delete'), style: 'destructive', onPress: async () => { try { await deleteCustomer(db, id); r.back(); } catch (e) { Alert.alert(L('মোছা যায়নি', 'Cannot delete'), err(e)); } } },
  ]);
  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Avatar name={c.name} size={52} /><H>{c.name}</H></View>
        <T muted>{c.phone ?? L('ফোন নেই', 'No phone')}</T>
        {c.address ? <T>{c.address}</T> : null}
        {c.notes ? <T muted>{c.notes}</T> : null}
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}><T muted>{L('মোট অর্ডার', 'Total orders')}</T><T bold>{sum.n}</T></Card>
        <Card style={{ flex: 1 }}><T muted>{L('মোট মূল্য', 'Total value')}</T><T bold>{formatMoney(sum.total, lang)}</T></Card>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}><T muted>{L('পরিশোধিত', 'Paid')}</T><T bold>{formatMoney(sum.paid, lang)}</T></Card>
        <Card style={{ flex: 1 }}><T muted>{L('বকেয়া', 'Outstanding')}</T><T bold color="#B45309">{formatMoney(sum.balance, lang)}</T></Card>
      </View>
      <Btn title={L('এই গ্রাহকের নতুন অর্ডার', 'New order for this customer')} onPress={() => r.push({ pathname: '/order/new', params: { customerId: id } })} />
      <Btn variant="ghost" title={L('মাপ ও ইতিহাস', 'Measurements & history')} onPress={() => r.push({ pathname: '/measurement/customer', params: { id } })} />
      <Btn variant="ghost" title={L('সম্পাদনা', 'Edit')} onPress={() => r.push({ pathname: '/customer/edit', params: { id } })} />
      <H>{L('অর্ডারসমূহ', 'Orders')}</H>
      {orders.length === 0 ? <T muted>{L('কোনো অর্ডার নেই', 'No orders yet')}</T> : orders.map((o) => (
        <Card key={o.id} onPress={() => r.push({ pathname: '/order/[id]', params: { id: o.id } })}>
          <T bold>{o.order_number} · {s.status[o.status]}</T>
          <T muted>{o.garments} · {formatMoney(o.total_minor, lang)}</T>
        </Card>
      ))}
      <Btn variant="danger" title={L('গ্রাহক মুছুন', 'Delete customer')} onPress={remove} />
    </Screen>
  );
}
