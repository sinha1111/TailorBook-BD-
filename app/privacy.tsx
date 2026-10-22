import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Card, H, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { shareOrdersCsv } from '@/services/exports';

export default function Privacy() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, err } = useLang();
  const [busy, setBusy] = useState(false);
  const exportCsv = async () => {
    if (busy) return; setBusy(true);
    try { await shareOrdersCsv(db); } catch (e) { Alert.alert(L('সম্ভব হয়নি', 'Not possible'), err(e)); } finally { setBusy(false); }
  };
  return (
    <Screen>
      <H>{L('তথ্য এক্সপোর্ট', 'Data export')}</H>
      <Btn title={L('অর্ডার CSV এক্সপোর্ট', 'Export orders (CSV)')} onPress={exportCsv} loading={busy} />
      <Btn variant="ghost" title={L('সম্পূর্ণ ব্যাকআপ (ব্যাকআপ স্ক্রিন)', 'Full backup (Backup screen)')} onPress={() => r.push('/backup')} />
      <H>{L('গোপনীয়তা', 'Privacy')}</H>
      <Card>
        <T>{L('আপনার সব তথ্য শুধু এই ফোনে থাকে। কোনো সার্ভার, অ্যাকাউন্ট, বিজ্ঞাপন বা অ্যানালিটিক্স নেই।', 'All your data stays on this phone. No server, account, ads or analytics.')}</T>
        <T muted>{L('তথ্য শুধু তখনই ফোনের বাইরে যায় যখন আপনি এক্সপোর্ট বা শেয়ার করেন।', 'Data leaves the phone only when you export or share it.')}</T>
        <T muted>{L('ডেটাবেস এনক্রিপ্টেড নয় — ফোনে স্ক্রিন লক ব্যবহার করুন।', 'The database is not encrypted — use your phone screen lock.')}</T>
        <T muted>{L('আনইনস্টল করলে ব্যাকআপ ছাড়া তথ্য মুছে যেতে পারে।', 'Uninstalling can delete your data unless you have a backup.')}</T>
      </Card>
    </Screen>
  );
}
