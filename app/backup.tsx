import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Card, H, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { getPref, setPref } from '@/db/settings';
import { deleteAllData, exportBackup, restoreBackup } from '@/db/backup';
import { summarizeBackup, validateBackup, type Backup } from '@/domain/backup';
import { latestSafetyCopy, pickTextFile, saveTextToFolder, shareFileUri, shareTextFile, writeSafetyCopy } from '@/services/files';
import { syncReminders } from '@/services/reminders';

const stamp = () => new Date().toISOString().slice(0, 10);

export default function BackupScreen() {
  const db = useSQLiteContext(); const { L, err } = useLang();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [safety, setSafety] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void getPref(db, 'last_backup_at').then(setLastBackup); void latestSafetyCopy().then(setSafety).catch(() => setSafety(null)); }, [db]);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return; setBusy(true);
    try { await fn(); } catch (e) { Alert.alert(L('সম্ভব হয়নি', 'Not possible'), err(e)); } finally { setBusy(false); }
  };
  const markBackup = async () => { const t = new Date().toISOString(); await setPref(db, 'last_backup_at', t); setLastBackup(t); };
  const toFolder = () => run(async () => {
    if (await saveTextToFolder(`tailorbook-backup-${stamp()}`, 'application/json', JSON.stringify(await exportBackup(db)))) { await markBackup(); Alert.alert(L('ব্যাকআপ সংরক্ষিত', 'Backup saved')); }
  });
  const share = () => run(async () => { await shareTextFile(`tailorbook-backup-${stamp()}.json`, 'application/json', JSON.stringify(await exportBackup(db))); await markBackup(); });
  const restore = () => run(async () => {
    const text = await pickTextFile();
    if (text === null) return;
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new Error('backup_corrupted'); }
    const bad = validateBackup(parsed);
    if (bad) throw new Error(bad);
    const b = parsed as Backup; const s = summarizeBackup(b);
    Alert.alert(L('রিস্টোর নিশ্চিত করুন', 'Confirm restore'),
      L(`বর্তমান সব তথ্য এই ব্যাকআপ দিয়ে প্রতিস্থাপিত হবে।\n\nব্যাকআপ: ${s.exportedAt.slice(0, 10)}\nগ্রাহক ${s.customers}, অর্ডার ${s.orders}, পেমেন্ট ${s.payments}, মাপ ${s.measurements}`,
        `ALL current data will be replaced by this backup.\n\nBackup from ${s.exportedAt.slice(0, 10)}\n${s.customers} customers, ${s.orders} orders, ${s.payments} payments, ${s.measurements} measurements`),
      [{ text: L('বাতিল', 'Cancel'), style: 'cancel' },
       { text: L('রিস্টোর করুন', 'Restore'), style: 'destructive', onPress: () => void run(async () => {
          setSafety(await writeSafetyCopy(JSON.stringify(await exportBackup(db))));
          await restoreBackup(db, b); await syncReminders(db);
          Alert.alert(L('রিস্টোর সম্পন্ন', 'Restore complete'), L('ভাষা/সেটিংস পুরো প্রয়োগ হতে অ্যাপ আবার খুলুন।', 'Reopen the app to fully apply language and settings.'));
        }) }]);
  });
  const deleteAll = () => Alert.alert(L('সব তথ্য মুছবেন?', 'Delete ALL data?'),
    L('সব গ্রাহক, অর্ডার, পেমেন্ট ও মাপ স্থায়ীভাবে মুছে যাবে। আগে ব্যাকআপ নিন।', 'All customers, orders, payments and measurements will be permanently deleted. Back up first.'),
    [{ text: L('বাতিল', 'Cancel'), style: 'cancel' },
     { text: L('চালিয়ে যান', 'Continue'), style: 'destructive', onPress: () => Alert.alert(L('নিশ্চিত?', 'Are you sure?'), L('এটি ফেরানো যাবে না।', 'This cannot be undone.'),
        [{ text: L('না', 'No'), style: 'cancel' }, { text: L('হ্যাঁ, সব মুছুন', 'Yes, delete everything'), style: 'destructive', onPress: () => void run(async () => { await deleteAllData(db); await syncReminders(db); Alert.alert(L('মুছে ফেলা হয়েছে', 'Deleted')); }) }]) }]);

  return (
    <Screen>
      <Card>
        <T bold>{lastBackup ? `${L('সর্বশেষ ব্যাকআপ: ', 'Last backup: ')}${new Date(lastBackup).toLocaleString()}` : L('এখনও কোনো ব্যাকআপ নেওয়া হয়নি', 'No backup made yet')}</T>
        <T muted>{L('ফোন হারালে বা অ্যাপ আনইনস্টল করলে তথ্য হারাবে — ব্যাকআপ ফাইল অন্য জায়গায় (গুগল ড্রাইভ/পিসি) রাখুন।', 'Losing the phone or uninstalling loses your data — keep backup files somewhere else (Drive/PC).')}</T>
      </Card>
      <H>{L('ব্যাকআপ', 'Backup')}</H>
      <Btn title={L('ফোল্ডারে ব্যাকআপ সংরক্ষণ', 'Save backup to a folder')} onPress={toFolder} loading={busy} />
      <Btn variant="ghost" title={L('ব্যাকআপ শেয়ার করুন', 'Share backup file')} onPress={share} disabled={busy} />
      <H>{L('রিস্টোর', 'Restore')}</H>
      <Btn variant="ghost" title={L('ব্যাকআপ ফাইল থেকে রিস্টোর', 'Restore from backup file')} onPress={restore} disabled={busy} />
      {safety ? <Btn variant="ghost" title={L('রিস্টোরের আগের নিরাপত্তা কপি শেয়ার', 'Share pre-restore safety copy')} onPress={() => void run(() => shareFileUri(safety, 'application/json'))} disabled={busy} /> : null}
      <H>{L('বিপজ্জনক অংশ', 'Danger zone')}</H>
      <Btn variant="danger" title={L('সব তথ্য মুছুন', 'Delete all data')} onPress={deleteAll} disabled={busy} />
    </Screen>
  );
}
