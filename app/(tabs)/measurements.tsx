import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, Empty, Field, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { listCustomers } from '@/db/customers';

export default function MeasurementCustomers() {
  const db = useSQLiteContext(); const r = useRouter(); const { L } = useLang();
  const [q, setQ] = useState('');
  const { data } = useLoad(() => listCustomers(db, q), [db, q]);
  return (
    <Screen>
      <T muted>{L('গ্রাহক নির্বাচন করে তার মাপ দেখুন বা নতুন মাপ নিন।', "Pick a customer to view or record measurements.")}</T>
      <Field label={L('নাম বা ফোন', 'Name or phone')} value={q} onChangeText={setQ} />
      {data && data.length === 0 ? <Empty text={L('কোনো গ্রাহক নেই — আগে গ্রাহক যোগ করুন', 'No customers — add a customer first')} /> : null}
      {data?.map((c) => (
        <Card key={c.id} onPress={() => r.push({ pathname: '/measurement/customer', params: { id: c.id } })}>
          <T bold>{c.name}</T><T muted>{c.phone ?? ''}</T>
        </Card>
      ))}
    </Screen>
  );
}
