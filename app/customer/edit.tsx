import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Field, FormErrorMessage, Screen } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useUnsavedGuard } from '@/ui/useUnsavedGuard';
import { getCustomer, saveCustomer } from '@/db/customers';

export default function CustomerEdit() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, err } = useLang();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [address, setAddress] = useState(''); const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null); const [formError, setFormError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const guard = useUnsavedGuard(dirty, { title: L('পরিবর্তন সংরক্ষিত নয়', 'Unsaved changes'), message: L('বের হলে আপনার লেখা মুছে যাবে।', 'If you leave, what you typed will be lost.'), stay: L('থাকুন', 'Stay'), discard: L('বাদ দিন', 'Discard') });
  useEffect(() => {
    if (!id) return;
    void getCustomer(db, id).then((c) => { if (c) { setName(c.name); setPhone(c.phone ?? ''); setAddress(c.address ?? ''); setNotes(c.notes ?? ''); } });
  }, [db, id]);
  const m = (set: (v: string) => void) => (v: string) => { set(v); setDirty(true); };
  const save = async () => {
    if (busy.current) return;
    setNameError(null); setFormError(null);
    if (!name.trim()) { setNameError(err('name_required')); return; }
    busy.current = true; setSaving(true);
    try {
      const cid = await saveCustomer(db, { id, name, phone, address, notes });
      guard.allow();
      if (id) r.back(); else r.replace({ pathname: '/customer/[id]', params: { id: cid } });
    } catch (e) { setFormError(err(e)); } finally { busy.current = false; setSaving(false); }
  };
  return (
    <Screen>
      <Field label={L('গ্রাহকের নাম', 'Customer name')} required value={name} onChangeText={m(setName)} placeholder={L('গ্রাহকের নাম লিখুন', 'Enter customer name')} error={nameError} />
      <Field label={L('ফোন নম্বর', 'Phone number')} value={phone} onChangeText={m(setPhone)} keyboardType="phone-pad" placeholder={L('ফোন নম্বর লিখুন (ঐচ্ছিক)', 'Phone number (optional)')} />
      <Field label={L('ঠিকানা', 'Address')} value={address} onChangeText={m(setAddress)} placeholder={L('ঠিকানা লিখুন (ঐচ্ছিক)', 'Address (optional)')} />
      <Field label={L('নোট', 'Notes')} value={notes} onChangeText={m(setNotes)} multiline placeholder={L('নোট লিখুন (ঐচ্ছিক)', 'Notes (optional)')} />
      <FormErrorMessage text={formError} />
      <Btn title={L('সংরক্ষণ করুন', 'Save')} onPress={save} loading={saving} />
      <Btn variant="ghost" title={L('বাতিল', 'Cancel')} onPress={() => r.back()} disabled={saving} />
    </Screen>
  );
}
