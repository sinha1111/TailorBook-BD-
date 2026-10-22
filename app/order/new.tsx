import React, { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Card, Chip, CurrencyInput, DatePickerField, EmptyState, Field, FormErrorMessage, H, Row, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { useUnsavedGuard } from '@/ui/useUnsavedGuard';
import { listCustomers } from '@/db/customers';
import { createOrder } from '@/db/orders';
import { newId } from '@/db/ids';
import { syncReminders } from '@/services/reminders';
import { parseMoney, formatMoney } from '@/domain/money';
import { addDays } from '@/domain/dates';
import { localDateString, itemsSubtotal, orderTotal } from '@/domain/orders';
import { GARMENT_LABEL, GARMENT_TEMPLATES } from '@/domain/units';

interface Draft { garment: string; qty: string; price: string; desc: string }
const blank = (): Draft => ({ garment: 'panjabi', qty: '1', price: '', desc: '' });

export default function NewOrder() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang, err } = useLang();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const today = localDateString(new Date());
  const [cid, setCid] = useState<string | undefined>(customerId); const [q, setQ] = useState('');
  const [items, setItems] = useState<Draft[]>([blank()]);
  const [discount, setDiscount] = useState(''); const [advance, setAdvance] = useState('');
  const [date, setDate] = useState(addDays(today, 7));
  const [fabric, setFabric] = useState(''); const [style, setStyle] = useState(''); const [instr, setInstr] = useState('');
  const [formError, setFormError] = useState<string | null>(null); const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false);
  const requestId = useRef(newId());   // one key per form => repeated taps can never create two orders
  const busy = useRef(false);
  const guard = useUnsavedGuard(dirty, { title: L('অর্ডার সংরক্ষিত নয়', 'Order not saved'), message: L('বের হলে আপনার লেখা মুছে যাবে।', 'If you leave, what you entered will be lost.'), stay: L('থাকুন', 'Stay'), discard: L('বাদ দিন', 'Discard') });
  const { data: customers } = useLoad(() => listCustomers(db, q), [db, q]);
  const touch = () => setDirty(true);
  const m = (set: (v: string) => void) => (v: string) => { set(v); touch(); };
  const setItem = (i: number, p: Partial<Draft>) => { setItems((a) => a.map((x, k) => (k === i ? { ...x, ...p } : x))); touch(); };

  const parsed = items.map((x) => ({ garmentType: x.garment, description: x.desc, quantity: Number(x.qty), unitPriceMinor: parseMoney(x.price) ?? -1 }));
  const valid = parsed.filter((p) => p.unitPriceMinor >= 0 && p.quantity >= 1);
  const disc = discount.trim() ? parseMoney(discount) : 0; const adv = advance.trim() ? parseMoney(advance) : 0;
  const total = disc !== null ? orderTotal(valid, disc) : null;

  const save = async () => {
    if (busy.current) return;
    setFormError(null);
    if (!cid) return setFormError(err('customer_required'));
    if (disc === null || adv === null) return setFormError(err('amount_invalid'));
    busy.current = true; setSaving(true);
    try {
      const id = await createOrder(db, { clientRequestId: requestId.current, customerId: cid, deliveryDate: date.trim(), discountMinor: disc, advanceMinor: adv, items: parsed, fabricInfo: fabric, styleNotes: style, instructions: instr });
      guard.allow(); void syncReminders(db);
      r.replace({ pathname: '/order/[id]', params: { id } });
    } catch (e) { setFormError(err(e)); } finally { busy.current = false; setSaving(false); }
  };

  return (
    <Screen>
      <H>{L('১. গ্রাহক', '1. Customer')} *</H>
      <Field label={L('খুঁজুন', 'Search')} value={q} onChangeText={setQ} placeholder={L('নাম বা ফোন', 'Name or phone')} />
      {customers && customers.length === 0 && !q ? (
        <EmptyState icon="people-outline" title={L('আগে একজন গ্রাহক যোগ করুন', 'Add a customer first')} actionLabel={L('গ্রাহক যোগ করুন', 'Add customer')} onAction={() => r.push('/customer/edit')} />
      ) : (
        <Row>{customers?.slice(0, 12).map((c) => <Chip key={c.id} label={c.name} selected={cid === c.id} onPress={() => { setCid(c.id); touch(); }} />)}</Row>
      )}

      <H>{L('২. পোশাক', '2. Garments')}</H>
      {items.map((it, i) => (
        <Card key={i}>
          <Row>{Object.keys(GARMENT_TEMPLATES).map((g) => <Chip key={g} label={GARMENT_LABEL[g]?.[lang === 'bn' ? 0 : 1] ?? g} selected={it.garment === g} onPress={() => setItem(i, { garment: g })} />)}</Row>
          <Field label={L('পরিমাণ', 'Quantity')} required value={it.qty} onChangeText={(v) => setItem(i, { qty: v })} keyboardType="number-pad" />
          <CurrencyInput label={L('প্রতিটির দাম', 'Price each')} required value={it.price} onChangeText={(v) => setItem(i, { price: v })} />
          <Field label={L('বিবরণ', 'Description')} value={it.desc} onChangeText={(v) => setItem(i, { desc: v })} placeholder={L('যেমন: কলার স্টাইল', 'e.g. collar style')} />
          {items.length > 1 ? <Btn variant="danger" title={L('এই পোশাক সরান', 'Remove')} onPress={() => { setItems((a) => a.filter((_, k) => k !== i)); touch(); }} /> : null}
        </Card>
      ))}
      <Btn variant="ghost" title={L('+ আরেকটি পোশাক', '+ Add garment')} onPress={() => { setItems((a) => [...a, blank()]); touch(); }} />
      <T muted>{L('এই গ্রাহকের সংরক্ষিত মাপ থাকলে অর্ডারে স্বয়ংক্রিয়ভাবে কপি হবে।', 'If the customer has saved measurements for a garment, they are copied into the order.')}</T>

      <H>{L('৩. ডেলিভারি ও পেমেন্ট', '3. Delivery & payment')}</H>
      <DatePickerField label={L('ডেলিভারির তারিখ', 'Delivery date')} required value={date} onChange={(v) => { setDate(v); touch(); }} minimumDate={new Date()} />
      <Row>{[3, 7, 14].map((n) => <Chip key={n} label={`+${n} ${L('দিন', 'days')}`} onPress={() => { setDate(addDays(today, n)); touch(); }} />)}</Row>
      <CurrencyInput label={L('ছাড়', 'Discount')} value={discount} onChangeText={m(setDiscount)} />
      <CurrencyInput label={L('অগ্রিম', 'Advance')} value={advance} onChangeText={m(setAdvance)} />
      <Field label={L('কাপড়ের তথ্য', 'Fabric info')} value={fabric} onChangeText={m(setFabric)} />
      <Field label={L('ডিজাইন / স্টাইল নোট', 'Style notes')} value={style} onChangeText={m(setStyle)} multiline />
      <Field label={L('বিশেষ নির্দেশনা', 'Special instructions')} value={instr} onChangeText={m(setInstr)} multiline />
      <Card>
        <T>{L('সাবটোটাল: ', 'Subtotal: ')}{formatMoney(itemsSubtotal(valid), lang)}</T>
        <T bold>{L('মোট: ', 'Total: ')}{total === null ? '—' : formatMoney(total, lang)}</T>
      </Card>
      <FormErrorMessage text={formError} />
      <Btn title={L('অর্ডার সংরক্ষণ করুন', 'Save order')} onPress={save} loading={saving} />
    </Screen>
  );
}
