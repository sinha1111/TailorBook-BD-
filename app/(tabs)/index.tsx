import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, Fab, OfflineStatusIndicator, Screen, SecondaryButton, SectionHeader, SummaryCard, T, type IconName } from '@/ui/components';
import { OrderItem } from '@/ui/OrderItem';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { dashboardStats, incomeLast7Days } from '@/db/dashboard';
import { listOrders } from '@/db/orders';
import { formatMoney } from '@/domain/money';
import { localDateString } from '@/domain/orders';
import { colors, fonts, spacing, statusColors } from '@/ui/theme';

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={24} color={colors.primary} /></View>
      <Text numberOfLines={2} style={{ fontSize: fonts.tiny, color: colors.ink, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

export default function Dashboard() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang } = useLang();
  const today = localDateString(new Date());
  const { data: d, error } = useLoad(async () => {
    const [s, week, recent, active, c] = await Promise.all([
      dashboardStats(db), incomeLast7Days(db),
      listOrders(db, { filter: 'all', sort: 'latest', today }),
      listOrders(db, { filter: 'active', sort: 'delivery', today }),
      db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM customers'),
    ]);
    return { s, week, recent: recent.slice(0, 4), upcoming: active.filter((o) => o.delivery_date >= today).slice(0, 4), customers: c?.n ?? 0 };
  }, [db, today]);
  const n = (x: number) => (lang === 'bn' ? String(x).replace(/\d/g, (ch) => '০১২৩৪৫৬৭৮৯'[Number(ch)] ?? ch) : String(x));
  const h = new Date().getHours();
  const hello = h < 12 ? L('শুভ সকাল!', 'Good morning!') : h < 17 ? L('শুভ বিকেল!', 'Good afternoon!') : L('শুভ সন্ধ্যা!', 'Good evening!');
  const s = d?.s; const max = Math.max(1, ...(d?.week ?? [0]));
  const go = (filter: string) => r.push({ pathname: '/orders', params: { filter } });
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen bottom={100}>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink }}>{hello}</Text>
          <OfflineStatusIndicator label={L('অফলাইনেও কাজ করে · তথ্য এই ফোনে', 'Works offline · data stays on this phone')} />
        </View>
        {error ? <T color={colors.danger}>{L('ডেটা লোড হয়নি', 'Could not load data')}</T> : null}
        {s && d && s.total === 0 ? (
          <Card>
            <EmptyState icon="cut-outline" title={d.customers === 0 ? L('শুরু করুন: প্রথম গ্রাহক যোগ করুন', 'Get started: add your first customer') : L('প্রথম অর্ডার তৈরি করুন', 'Create your first order')}
              text={L('গ্রাহক, মাপ, অর্ডার ও পেমেন্ট — সব এক জায়গায়, ইন্টারনেট ছাড়াই।', 'Customers, measurements, orders and payments in one place, without internet.')}
              actionLabel={d.customers === 0 ? L('গ্রাহক যোগ করুন', 'Add customer') : L('আপনার প্রথম অর্ডার তৈরি করুন', 'Create Your First Order')}
              onAction={() => r.push(d.customers === 0 ? '/customer/edit' : '/order/new')} />
            {d.customers === 0 ? <SecondaryButton title={L('সরাসরি নতুন অর্ডার', 'Go to new order')} onPress={() => r.push('/order/new')} /> : null}
          </Card>
        ) : null}
        {s ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <SummaryCard label={L('সক্রিয় অর্ডার', 'Active orders')} value={n(s.active)} color={colors.secondary} onPress={() => go('active')} />
              <SummaryCard label={L('অপেক্ষমাণ', 'Pending')} value={n(s.pending)} color="#D97706" onPress={() => go('pending')} />
              <SummaryCard label={L('চলছে', 'In progress')} value={n(s.in_progress)} color={statusColors.in_progress?.fg ?? colors.blue} onPress={() => go('in_progress')} />
              <SummaryCard label={L('ডেলিভারির জন্য প্রস্তুত', 'Ready for delivery')} value={n(s.ready)} color={colors.success} onPress={() => go('ready')} />
              <SummaryCard label={L('আজকের ডেলিভারি', "Today's deliveries")} value={n(s.due_today)} color={colors.primary} onPress={() => go('due_today')} />
              <SummaryCard label={L('মেয়াদোত্তীর্ণ', 'Overdue')} value={n(s.overdue)} color={s.overdue > 0 ? colors.danger : colors.muted} onPress={() => go('overdue')} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Card style={{ flex: 1 }}><T muted>{L('মোট বকেয়া', 'Outstanding')}</T><Text style={{ fontSize: 20, fontWeight: '800', color: colors.warn }}>{formatMoney(s.outstanding, lang)}</Text></Card>
              <Card style={{ flex: 1 }}><T muted>{L('আজ প্রাপ্ত', 'Received today')}</T><Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>{formatMoney(s.receivedToday, lang)}</Text></Card>
            </View>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View><T muted>{L('এই মাসে প্রাপ্ত', 'Received this month')}</T><Text style={{ fontSize: 24, fontWeight: '800', color: colors.ink }}>{formatMoney(s.receivedMonth, lang)}</Text><T muted>{L('শেষ ৭ দিন', 'Last 7 days')}</T></View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 48 }} accessibilityLabel={L('শেষ ৭ দিনের প্রাপ্তির চার্ট', 'Last 7 days received chart')}>
                  {(d?.week ?? []).map((v, i) => <View key={i} style={{ width: 9, height: Math.max(4, Math.round((Math.max(v, 0) / max) * 48)), borderRadius: 3, backgroundColor: i === 6 ? colors.primary : colors.secondary }} />)}
                </View>
              </View>
            </Card>
          </>
        ) : null}
        <SectionHeader title={L('দ্রুত অ্যাকশন', 'Quick actions')} />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <QuickAction icon="person-add" label={L('নতুন গ্রাহক', 'New customer')} onPress={() => r.push('/customer/edit')} />
          <QuickAction icon="add-circle" label={L('নতুন অর্ডার', 'New order')} onPress={() => r.push('/order/new')} />
          <QuickAction icon="cut" label={L('মাপ', 'Measurement')} onPress={() => r.push('/measurements')} />
          <QuickAction icon="cash" label={L('পেমেন্ট', 'Payment')} onPress={() => r.push('/payments')} />
          <QuickAction icon="bar-chart" label={L('রিপোর্ট', 'Reports')} onPress={() => r.push('/reports')} />
        </View>
        {d && d.upcoming.length > 0 ? (<><SectionHeader title={L('আসন্ন ডেলিভারি', 'Upcoming deliveries')} actionLabel={L('সব দেখুন', 'See all')} onAction={() => r.push('/schedule')} />{d.upcoming.map((o) => <OrderItem key={o.id} o={o} today={today} />)}</>) : null}
        {d && d.recent.length > 0 ? (<><SectionHeader title={L('সাম্প্রতিক অর্ডার', 'Recent orders')} actionLabel={L('সব দেখুন', 'See all')} onAction={() => go('all')} />{d.recent.map((o) => <OrderItem key={o.id} o={o} today={today} />)}</>) : null}
      </Screen>
      <Fab onPress={() => r.push('/order/new')} label={L('নতুন অর্ডার', 'New order')} />
    </View>
  );
}
