import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Card, Chip, Field, H, MenuRow, Row, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { getPref, getShop, saveShop, setPref } from '@/db/settings';
import { requestReminderPermission, syncReminders } from '@/services/reminders';

export default function Settings() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang, setLang } = useLang();
  const [name, setName] = useState(''); const [address, setAddress] = useState(''); const [phone, setPhone] = useState('');
  const [unit, setUnit] = useState<'in' | 'cm'>('in'); const [remind, setRemind] = useState(false); const [before, setBefore] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    void getShop(db).then((s) => { setName(s.shop_name); setAddress(s.shop_address); setPhone(s.shop_phone); });
    void getPref(db, 'unit').then((u) => { if (u === 'cm') setUnit('cm'); });
    void getPref(db, 'reminders').then((v) => setRemind(v === '1'));
    void getPref(db, 'remind_before').then((v) => setBefore(v === '1'));
  }, [db]);
  const saveShopInfo = async () => {
    if (saving) return; setSaving(true);
    try { await saveShop(db, { shop_name: name, shop_address: address, shop_phone: phone }); Alert.alert(L('সংরক্ষিত', 'Saved')); } finally { setSaving(false); }
  };
  const toggleReminders = async (on: boolean) => {
    if (on && !(await requestReminderPermission())) {
      Alert.alert(L('নোটিফিকেশন বন্ধ', 'Notifications blocked'), L('ফোনের সেটিংস থেকে নোটিফিকেশন চালু করুন। রিমাইন্ডার ছাড়াও অর্ডার ব্যবস্থাপনা কাজ করবে।', 'Enable notifications in phone settings. Order management works without reminders.'));
      return;
    }
    await setPref(db, 'reminders', on ? '1' : '0'); setRemind(on); await syncReminders(db);
  };
  const toggleBefore = async (on: boolean) => { await setPref(db, 'remind_before', on ? '1' : '0'); setBefore(on); await syncReminders(db); };
  return (
    <Screen>
      <H>{L('দোকানের প্রোফাইল', 'Shop profile')}</H>
      <Field label={L('দোকানের নাম', 'Shop name')} value={name} onChangeText={setName} placeholder={L('যেমন: রহমান টেইলার্স', 'e.g. Rahman Tailors')} />
      <Field label={L('ঠিকানা', 'Address')} value={address} onChangeText={setAddress} />
      <Field label={L('ফোন', 'Phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Btn title={L('সংরক্ষণ করুন', 'Save')} onPress={saveShopInfo} loading={saving} />

      <H>{L('ভাষা', 'Language')}</H>
      <Row><Chip label="বাংলা" selected={lang === 'bn'} onPress={() => setLang('bn')} /><Chip label="English" selected={lang === 'en'} onPress={() => setLang('en')} /></Row>

      <H>{L('থিম', 'Theme')}</H>
      <Row>
        <Chip label={L('হালকা', 'Light')} selected onPress={() => undefined} />
        <View pointerEvents="none" style={{ opacity: 0.45 }}><Chip label={L('গাঢ়', 'Dark')} onPress={() => undefined} /></View>
      </Row>
      <T muted>{L('গাঢ় থিম এখনও উপলব্ধ নয়।', 'Dark theme is not available yet.')}</T>

      <H>{L('মাপের ডিফল্ট একক', 'Default measurement unit')}</H>
      <Row>
        <Chip label={L('ইঞ্চি', 'Inches')} selected={unit === 'in'} onPress={() => { setUnit('in'); void setPref(db, 'unit', 'in'); }} />
        <Chip label={L('সেন্টিমিটার', 'Centimeters')} selected={unit === 'cm'} onPress={() => { setUnit('cm'); void setPref(db, 'unit', 'cm'); }} />
      </Row>

      <H>{L('নোটিফিকেশন', 'Notifications')}</H>
      <Row><Chip label={L('রিমাইন্ডার চালু', 'Reminders on')} selected={remind} onPress={() => void toggleReminders(true)} /><Chip label={L('বন্ধ', 'Off')} selected={!remind} onPress={() => void toggleReminders(false)} /></Row>
      {remind ? <Row><Chip label={L('আগের দিন সন্ধ্যায়ও', 'Also the evening before')} selected={before} onPress={() => void toggleBefore(!before)} /></Row> : null}
      <T muted>{L('ব্যাটারি অপ্টিমাইজেশন বা সিস্টেম বিধিনিষেধে নোটিফিকেশন দেরিতে আসতে পারে।', 'Android battery optimization and system restrictions can delay or block notifications.')}</T>

      <H>{L('আরও', 'More')}</H>
      <MenuRow icon="cloud-upload" title={L('ব্যাকআপ ও রিস্টোর', 'Backup & restore')} onPress={() => r.push('/backup')} />
      <MenuRow icon="shield-checkmark" title={L('এক্সপোর্ট ও গোপনীয়তা', 'Export & privacy')} onPress={() => r.push('/privacy')} />
      <MenuRow icon="information-circle" title={L('অ্যাপ সম্পর্কে', 'About')} onPress={() => r.push('/about')} />
      <Card><T muted>{L('এক ডিভাইসের সেটিংস ব্যাকআপে অন্তর্ভুক্ত থাকে।', 'Preferences are included in backups.')}</T></Card>
    </Screen>
  );
}
