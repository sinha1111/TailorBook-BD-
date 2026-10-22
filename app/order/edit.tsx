import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, CurrencyInput, DatePickerField, Field, FormErrorMessage, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useUnsavedGuard } from '@/ui/useUnsavedGuard';
import { getOrderDetail, updateOrder } from '@/db/orders';
import { parseMoney } from '@/domain/money';
import { syncReminders } from '@/services/reminders';

export default function EditOrder() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, err } = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [date, setDate] = useState(''); const [disc, setDisc] = useState(''); const [fabric, setFabric] = useState(''); const [style, setStyle] = useState(''); const [instr, setInstr] = useState('');
  const [ready, setReady] = useState(false); const [saving, setSaving] = useState(false); const [dirty, setDirty] = useState(false); const [formError, setFormError] = useState<string | null>(null);
  const busy = useRef(false);
  const guard = useUnsavedGuard(dirty, { title: L('পরিবর্তন সংরক্ষিত নয়', 'Unsaved changes'), message: L('বের হলে পরিবর্তন হারাবে।', 'If you leave, your changes will be lost.'), stay: L('থাকুন', 'Stay'), discard: L('বাদ দিন', 'Discard') });
  useEffect(() => {
    void getOrderDetail(db, id).then((d) => {
      if (!d) return;
      setDate(d.order.delivery_date); setDisc(d.order.discount_minor ? String(d.order.discount_minor / 100) : ''); setFabric(d.order.fabric_info ?? ''); setStyle(d.order.style_notes ?? ''); setInstr(d.order.instructions ?? ''); setReady(true);
    });
  }, [db, id]);
  const m = (set: (v: string) => void) => (v: string) => { set(v); setDirty(true); };
  const save = async () => {
    const amount = disc.trim() ? parseMoney(disc) : 0;
    if (amount === null) return setFormError(err('amount_invalid'));
    if (busy.current) return; busy.current = true; setSaving(true); setFormError(null);
    try { await updateOrder(db, { id, deliveryDate: date.trim(), discountMinor: amount, fabricInfo: fabric, styleNotes: style, instructions: instr }); guard.allow(); void syncReminders(db); r.back(); }
    catch (e) { setFormError(err(e)); } finally { busy.current = false; setSaving(false); }
  };
  if (!ready) return <Screen><T muted>{L('লোড হচ্ছে…', 'Loading…')}</T></Screen>;
  return (
    <Screen>
      <DatePickerField label={L('ডেলিভারির তারিখ', 'Delivery date')} required value={date} onChange={(v) => { setDate(v); setDirty(true); }} />
      <CurrencyInput label={L('ছাড়', 'Discount')} value={disc} onChangeText={m(setDisc)} />
      <Field label={L('কাপড়ের তথ্য', 'Fabric info')} value={fabric} onChangeText={m(setFabric)} />
      <Field label={L('স্টাইল নোট', 'Style notes')} value={style} onChangeText={m(setStyle)} multiline />
      <Field label={L('বিশেষ নির্দেশনা', 'Special instructions')} value={instr} onChangeText={m(setInstr)} multiline />
      <FormErrorMessage text={formError} />
      <Btn title={L('সংরক্ষণ করুন', 'Save')} onPress={save} loading={saving} />
    </Screen>
  );
}
