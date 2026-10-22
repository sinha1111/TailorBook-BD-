import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CustomerListItem, EmptyState, Fab, Screen, SearchBar } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { listCustomers } from '@/db/customers';
import { formatMoney } from '@/domain/money';
import { colors } from '@/ui/theme';

export default function Customers() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang } = useLang();
  const [q, setQ] = useState('');
  const { data } = useLoad(() => listCustomers(db, q), [db, q]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen bottom={100}>
        <SearchBar value={q} onChangeText={setQ} placeholder={L('নাম বা ফোন নম্বর খুঁজুন...', 'Search name or phone...')} />
        {data && data.length === 0 ? (q
          ? <EmptyState icon="search" title={L('কোনো গ্রাহক পাওয়া যায়নি', 'No matching customers')} />
          : <EmptyState icon="people-outline" title={L('এখনও কোনো গ্রাহক নেই', 'No customers yet')} text={L('প্রথম গ্রাহক যোগ করে মাপ ও অর্ডার শুরু করুন।', 'Add your first customer to start recording measurements and orders.')} actionLabel={L('গ্রাহক যোগ করুন', 'Add customer')} onAction={() => r.push('/customer/edit')} />) : null}
        {data?.map((c) => (
          <CustomerListItem key={c.id} name={c.name} subtitle={`${c.phone ?? L('ফোন নেই', 'No phone')} · ${c.order_count} ${L('অর্ডার', 'orders')}`}
            highlight={c.balance_minor > 0 ? `${L('বাকি: ', 'Due: ')}${formatMoney(c.balance_minor, lang)}` : null}
            onPress={() => r.push({ pathname: '/customer/[id]', params: { id: c.id } })} />
        ))}
      </Screen>
      <Fab onPress={() => r.push('/customer/edit')} label={L('গ্রাহক যোগ করুন', 'Add customer')} />
    </View>
  );
}
