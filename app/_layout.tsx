import React, { Suspense, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from '@/db/migrations';
import { getPref } from '@/db/settings';
import { syncReminders } from '@/services/reminders';
import { LangProvider, useLang } from '@/ui/lang';
import { colors } from '@/ui/theme';

function Screens() {
  const { L } = useLang();
  const db = useSQLiteContext();
  const router = useRouter();
  const nav = useRootNavigationState();
  useEffect(() => { void syncReminders(db); }, [db]);
  useEffect(() => {
    if (!nav?.key) return;
    void getPref(db, 'intro_done').then((v) => { if (v !== '1') router.replace('/intro'); });
  }, [db, nav?.key, router]);
  const t = (bn: string, en: string) => ({ title: L(bn, en) });
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' }, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="intro" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="setup" options={t('দোকান সেটআপ', 'Shop setup')} />
        <Stack.Screen name="customer/edit" options={t('গ্রাহক', 'Customer')} />
        <Stack.Screen name="customer/[id]" options={t('গ্রাহকের প্রোফাইল', 'Customer Profile')} />
        <Stack.Screen name="order/new" options={t('নতুন অর্ডার', 'New Order')} />
        <Stack.Screen name="order/[id]" options={t('অর্ডারের বিবরণ', 'Order Details')} />
        <Stack.Screen name="order/edit" options={t('অর্ডার সম্পাদনা', 'Edit Order')} />
        <Stack.Screen name="order/receipt" options={t('পেমেন্ট রশিদ', 'Payment Receipt')} />
        <Stack.Screen name="measurement/customer" options={t('গ্রাহকের মাপ', 'Customer Measurements')} />
        <Stack.Screen name="measurement/edit" options={t('মাপ নিন', 'Record Measurements')} />
        <Stack.Screen name="payments" options={t('পেমেন্ট', 'Payments')} />
        <Stack.Screen name="schedule" options={t('ডেলিভারি সূচি', 'Delivery Schedule')} />
        <Stack.Screen name="reports" options={t('রিপোর্ট', 'Reports')} />
        <Stack.Screen name="settings" options={t('সেটিংস', 'Settings')} />
        <Stack.Screen name="backup" options={t('ব্যাকআপ ও রিস্টোর', 'Backup & Restore')} />
        <Stack.Screen name="privacy" options={t('এক্সপোর্ট ও গোপনীয়তা', 'Export & Privacy')} />
        <Stack.Screen name="pro" options={t('প্রো', 'Pro')} />
        <Stack.Screen name="about" options={t('অ্যাপ সম্পর্কে', 'About')} />
      </Stack>
    </>
  );
}

/** SQLiteProvider expects Promise<void>; runMigrations returns the schema version. */
async function initDb(db: SQLiteDatabase): Promise<void> {
  await runMigrations(db);
}

export default function Root() {
  return (
    <Suspense fallback={<ActivityIndicator style={{ flex: 1 }} color={colors.primary} />}>
      <SQLiteProvider databaseName="tailorbook.db" onInit={initDb} useSuspense>
        <LangProvider><Screens /></LangProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
