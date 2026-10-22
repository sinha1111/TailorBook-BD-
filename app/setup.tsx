import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Field, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { saveShop, setPref } from '@/db/settings';

/** Optional shop setup shown once after the welcome screen. Everything can be skipped. */
export default function Setup() {
  const db = useSQLiteContext(); const r = useRouter(); const { L } = useLang();
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const finish = async (save: boolean) => {
    if (busy) return; setBusy(true);
    try {
      if (save && (name.trim() || phone.trim() || address.trim())) await saveShop(db, { shop_name: name, shop_phone: phone, shop_address: address });
      await setPref(db, 'intro_done', '1');
      r.replace('/');
    } catch { Alert.alert(L('সংরক্ষণ হয়নি', 'Not saved')); setBusy(false); }
  };
  return (
    <Screen>
      <T muted>{L('এটি ঐচ্ছিক। এই তথ্য রশিদে ছাপা হবে; পরে সেটিংসে বদলানো যাবে।', 'Optional. These details are printed on receipts and can be changed later in Settings.')}</T>
      <Field label={L('দোকানের নাম', 'Shop name')} value={name} onChangeText={setName} placeholder={L('যেমন: রহমান টেইলার্স', 'e.g. Rahman Tailors')} />
      <Field label={L('ফোন', 'Phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="01XXXXXXXXX" />
      <Field label={L('ঠিকানা', 'Address')} value={address} onChangeText={setAddress} multiline />
      <Btn title={L('সংরক্ষণ করে শুরু করুন', 'Save and start')} onPress={() => void finish(true)} loading={busy} />
      <Btn variant="ghost" title={L('এখন নয়, এড়িয়ে যান', 'Skip for now')} onPress={() => void finish(false)} disabled={busy} />
    </Screen>
  );
}
