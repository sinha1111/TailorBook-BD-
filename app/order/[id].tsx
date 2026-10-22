import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomSheet, Btn, Card, Chip, ConfirmationDialog, CurrencyInput, Field, FormErrorMessage, H, PaymentHistoryItem, Row, Screen, SecondaryButton, StatusChip, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { changeStatus, getOrderDetail } from '@/db/orders';
import { recordPayment, reversePayment, type Method } from '@/db/payments';
import { formatMoney, parseMoney } from '@/domain/money';
import { canTransition, orderFinancials, type OrderStatus } from '@/domain/orders';
import { syncReminders } from '@/services/reminders';
import { colors } from '@/ui/theme';

const STATUSES: OrderStatus[] = ['pending', 'in_progress', 'ready', 'delivered', 'cancelled'];
type Confirm = { kind: 'cancel' } | { kind: 'reverse'; id: string } | null;

export default function OrderDetail() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang, s, err } = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, reload } = useLoad(() => getOrderDetail(db, id), [db, id]);
  const [amount, setAmount] = useState(''); const [method, setMethod] = useState<Method>('cash'); const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false); const [sheet, setSheet] = useState(false); const [confirm, setConfirm] = useState<Confirm>(null); const [payError, setPayError] = useState<string | null>(null);
  if (!data) return <Screen><T muted>{L('লোড হচ্ছে…', 'Loading…')}</T></Screen>;
  const { order: o, items, payments } = data;
  const fin = orderFinancials(o.status, o.total_minor, payments.map((p) => ({ kind: p.kind, amountMinor: p.amount_minor })));
  const methods: [Method, string][] = [['cash', L('নগদ', 'Cash')], ['mfs', L('মোবাইল ব্যাংকিং', 'Mobile banking')], ['bank', L('ব্যাংক', 'Bank')], ['other', L('অন্যান্য', 'Other')]];
  const methodLabel = (k: string) => methods.find((x) => x[0] === k)?.[1] ?? k;
  const guard = async (fn: () => Promise<void>) => {
    if (busy) return; setBusy(true);
    try { await fn(); reload(); void syncReminders(db); } catch (e) { Alert.alert(L('সম্ভব হয়নি', 'Not possible'), err(e)); } finally { setBusy(false); }
  };
  const pickStatus = (to: OrderStatus) => { setSheet(false); if (to === 'cancelled') setConfirm({ kind: 'cancel' }); else void guard(() => changeStatus(db, id, to)); };
  const pay = async () => {
    const m = parseMoney(amount);
    if (m === null) return setPayError(err('amount_invalid'));
    setPayError(null);
    if (busy) return; setBusy(true);
    try { await recordPayment(db, { orderId: id, amountMinor: m, method, note }); setAmount(''); setNote(''); reload(); void syncReminders(db); } catch (e) { setPayError(err(e)); } finally { setBusy(false); }
  };
  const doConfirm = () => {
    const c = confirm; setConfirm(null);
    if (c?.kind === 'cancel') void guard(() => changeStatus(db, id, 'cancelled'));
    if (c?.kind === 'reverse') void guard(() => reversePayment(db, c.id));
  };
  const allowed = STATUSES.filter((x) => canTransition(o.status, x));

  return (
    <Screen>
      <Card>
        <H>#{o.order_number}</H>
        <T>{o.customer_name}{o.customer_phone ? ` · ${o.customer_phone}` : ''}</T>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}><StatusChip status={o.status} label={s.status[o.status]} /></View>
        <T muted>{L('অর্ডার: ', 'Ordered: ')}{o.order_date} · {L('ডেলিভারি: ', 'Delivery: ')}{o.delivery_date}</T>
      </Card>
      <Row>
        <View style={{ flex: 1 }}><SecondaryButton title={L('এডিট', 'Edit')} onPress={() => r.push({ pathname: '/order/edit', params: { id } })} /></View>
        <View style={{ flex: 1 }}><SecondaryButton title={L('রশিদ', 'Receipt')} onPress={() => r.push({ pathname: '/order/receipt', params: { id } })} /></View>
      </Row>
      {allowed.length > 0 ? <Btn title={L('স্ট্যাটাস পরিবর্তন', 'Update status')} onPress={() => setSheet(true)} disabled={busy} /> : null}

      <H>{L('পোশাক', 'Garments')}</H>
      {items.map((i) => (
        <Card key={i.id}>
          <T bold>{i.garment_type} × {i.quantity} @ {formatMoney(i.unit_price_minor, lang)}</T>
          {i.description ? <T muted>{i.description}</T> : null}
          {i.snapshot_json ? <T muted>{L('মাপ (অর্ডারের সময়): ', 'Measurements (at order time): ')}{Object.values(JSON.parse(i.snapshot_json) as Record<string, { label: string; bn?: string; value: number }>).map((f) => `${lang === 'bn' && f.bn ? f.bn : f.label} ${f.value}`).join(', ')} {i.snapshot_unit}</T> : <T muted>{L('কোনো মাপ সংরক্ষিত ছিল না', 'No saved measurements')}</T>}
        </Card>
      ))}
      {o.fabric_info ? <T muted>{L('কাপড়: ', 'Fabric: ')}{o.fabric_info}</T> : null}
      {o.style_notes ? <T muted>{L('স্টাইল: ', 'Style: ')}{o.style_notes}</T> : null}
      {o.instructions ? <T muted>{L('নির্দেশনা: ', 'Instructions: ')}{o.instructions}</T> : null}
      <Card>
        {o.discount_minor > 0 ? <T>{L('ছাড়: ', 'Discount: ')}{formatMoney(o.discount_minor, lang)}</T> : null}
        <T>{L('মোট: ', 'Total: ')}{formatMoney(o.total_minor, lang)}</T>
        <T>{L('পরিশোধিত: ', 'Paid: ')}{formatMoney(fin.paidMinor, lang)}</T>
        <T bold color={fin.balanceMinor > 0 ? colors.danger : colors.success}>{L('বাকি: ', 'Balance: ')}{formatMoney(fin.balanceMinor, lang)}</T>
        {fin.refundDueMinor > 0 ? <T color={colors.warn}>{L('ফেরতযোগ্য: ', 'Refund due: ')}{formatMoney(fin.refundDueMinor, lang)}</T> : null}
      </Card>

      <H>{L('পেমেন্টের ইতিহাস', 'Payment history')}</H>
      {payments.length === 0 ? <T muted>{L('কোনো পেমেন্ট নেই', 'No payments yet')}</T> : payments.map((p) => (
        <PaymentHistoryItem key={p.id} refund={p.kind === 'refund'} amount={formatMoney(p.amount_minor, lang)} method={methodLabel(p.method)} date={new Date(p.paid_at).toLocaleDateString()} note={p.note}
          reverseLabel={L('ফেরত/বাতিল', 'Reverse')} onReverse={p.kind === 'payment' && !payments.some((x) => x.reverses_payment_id === p.id) ? () => setConfirm({ kind: 'reverse', id: p.id }) : undefined} />
      ))}
      {o.status !== 'cancelled' ? (
        <Card>
          <H>{L('পেমেন্ট নিন', 'Record payment')}</H>
          <CurrencyInput label={L('পরিমাণ', 'Amount')} required value={amount} onChangeText={setAmount} />
          <Row>{methods.map(([k, label]) => <Chip key={k} label={label} selected={method === k} onPress={() => setMethod(k)} />)}</Row>
          <Field label={L('নোট', 'Note')} value={note} onChangeText={setNote} />
          <FormErrorMessage text={payError} />
          <Btn title={L('পেমেন্ট সংরক্ষণ', 'Save payment')} onPress={() => void pay()} loading={busy} />
        </Card>
      ) : null}

      <BottomSheet visible={sheet} title={L('স্ট্যাটাস পরিবর্তন', 'Update status')} onClose={() => setSheet(false)}>
        <T muted>{L('স্ট্যাটাস বদলালে পেমেন্ট অপরিবর্তিত থাকে।', 'Changing status never changes payments.')}</T>
        {allowed.map((x) => <Btn key={x} variant={x === 'cancelled' ? 'danger' : 'ghost'} title={s.status[x]} onPress={() => pickStatus(x)} />)}
      </BottomSheet>
      <ConfirmationDialog visible={confirm !== null} destructive cancelLabel={L('না', 'No')}
        title={confirm?.kind === 'cancel' ? L('অর্ডার বাতিল করবেন?', 'Cancel this order?') : L('পেমেন্ট ফেরত/বাতিল?', 'Reverse this payment?')}
        message={confirm?.kind === 'cancel' ? L('পেমেন্টের রেকর্ড থাকবে, কিন্তু অর্ডারটি আয়ে গণ্য হবে না।', 'Payment records are kept, but the order no longer counts as revenue.') : L('একটি ফেরত এন্ট্রি যোগ হবে; আগের রেকর্ড মুছবে না।', 'A reversal entry is added; the original record is kept.')}
        confirmLabel={confirm?.kind === 'cancel' ? L('বাতিল করুন', 'Cancel order') : L('হ্যাঁ, ফেরত', 'Yes, reverse')} onConfirm={doConfirm} onCancel={() => setConfirm(null)} />
    </Screen>
  );
}
