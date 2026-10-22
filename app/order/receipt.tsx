import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, ReceiptPreview, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { loadReceiptData, printReceipt, shareReceiptPdf } from '@/services/receipt';

export default function ReceiptScreen() {
  const db = useSQLiteContext(); const { L, lang, err } = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useLoad(() => loadReceiptData(db, id, lang), [db, id, lang]);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    if (busy) return; setBusy(true);
    try { await fn(); } catch (e) { Alert.alert(L('সম্ভব হয়নি', 'Not possible'), err(e)); } finally { setBusy(false); }
  };
  if (!data) return <Screen><T muted>{L('লোড হচ্ছে…', 'Loading…')}</T></Screen>;
  return (
    <Screen>
      <ReceiptPreview data={data} />
      <Btn title={L('PDF শেয়ার করুন', 'Share PDF')} onPress={() => void run(() => shareReceiptPdf(db, id, lang))} loading={busy} />
      <Btn variant="ghost" title={L('প্রিন্ট', 'Print')} onPress={() => void run(() => printReceipt(db, id, lang))} disabled={busy} />
    </Screen>
  );
}
