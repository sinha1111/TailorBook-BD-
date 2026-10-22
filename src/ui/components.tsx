import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, elevation, fonts, radius, spacing, statusColors } from './theme';
import { isValidDate } from '../domain/dates';
import { formatMoney } from '../domain/money';
import { localDateString, orderFinancials } from '../domain/orders';
import { GARMENT_LABEL } from '../domain/units';
import { strings } from '../i18n/strings';
import type { ReceiptData } from '../domain/receipt';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ---------- layout ---------- */
export function Screen({ children, scroll = true, bottom = 48 }: { children: React.ReactNode; scroll?: boolean; bottom?: number }) {
  const body = scroll
    ? <ScrollView contentContainerStyle={[st.pad, { paddingBottom: bottom }]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={[st.pad, { flex: 1 }]}>{children}</View>;
  return <KeyboardAvoidingView style={st.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView>;
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (!onPress) return <View style={[st.card, style]}>{children}</View>;
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.card, style, pressed ? { opacity: 0.85 } : null]}>{children}</Pressable>;
}

export function H({ children }: { children: React.ReactNode }) { return <Text style={st.h}>{children}</Text>; }
export function T({ children, muted, bold, color }: { children: React.ReactNode; muted?: boolean; bold?: boolean; color?: string }) {
  return <Text style={{ fontSize: fonts.body, color: color ?? (muted ? colors.muted : colors.ink), fontWeight: bold ? '700' : '400' }}>{children}</Text>;
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
      <Text style={st.h}>{title}</Text>
      {actionLabel && onAction ? <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}><Text style={{ color: colors.secondary, fontWeight: '700', fontSize: fonts.small }}>{actionLabel}</Text></Pressable> : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }, style]}>{children}</View>;
}

/* ---------- buttons ---------- */
interface BtnProps { title: string; onPress: () => void; disabled?: boolean; loading?: boolean }
export function PrimaryButton({ title, onPress, disabled, loading }: BtnProps) {
  const off = !!disabled || !!loading;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" accessibilityState={{ disabled: off, busy: !!loading }}
      style={({ pressed }) => [st.btn, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: off ? 0.55 : pressed ? 0.88 : 1 }]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{title}</Text>}
    </Pressable>
  );
}
export function SecondaryButton({ title, onPress, disabled, loading, danger }: BtnProps & { danger?: boolean }) {
  const off = !!disabled || !!loading; const fg = danger ? colors.danger : colors.primary;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" accessibilityState={{ disabled: off, busy: !!loading }}
      style={({ pressed }) => [st.btn, { backgroundColor: colors.surface, borderColor: fg, opacity: off ? 0.55 : pressed ? 0.88 : 1 }]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text>}
    </Pressable>
  );
}
/** Back-compat wrapper used by older screens. */
export function Btn({ title, onPress, variant = 'primary', disabled, loading }: BtnProps & { variant?: 'primary' | 'ghost' | 'danger' }) {
  return variant === 'primary' ? <PrimaryButton title={title} onPress={onPress} disabled={disabled} loading={loading} /> : <SecondaryButton title={title} onPress={onPress} disabled={disabled} loading={loading} danger={variant === 'danger'} />;
}

/* ---------- form fields ---------- */
export function FormErrorMessage({ text }: { text?: string | null }) {
  return text ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: spacing.xs, fontSize: fonts.small }}>{text}</Text> : null;
}
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return <Text style={st.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text>;
}

export function Field({ label, error, required, ...p }: TextInputProps & { label: string; error?: string | null; required?: boolean }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <FieldLabel label={label} required={required} />
      <TextInput {...p} accessibilityLabel={label} placeholderTextColor="#9CA3AF" style={[st.input, error ? { borderColor: colors.danger } : null, p.multiline ? { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 } : null]} />
      <FormErrorMessage text={error} />
    </View>
  );
}

function AffixInput({ label, value, onChangeText, error, required, prefix, suffix, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; error?: string | null; required?: boolean; prefix?: string; suffix?: string; placeholder?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <FieldLabel label={label} required={required} />
      <View style={[st.inputRow, error ? { borderColor: colors.danger } : null]}>
        {prefix ? <Text style={st.affix}>{prefix}</Text> : null}
        <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder={placeholder ?? '0'} placeholderTextColor="#9CA3AF" accessibilityLabel={label} style={st.inputBare} />
        {suffix ? <Text style={st.affix}>{suffix}</Text> : null}
      </View>
      <FormErrorMessage text={error} />
    </View>
  );
}
export const CurrencyInput = (p: { label: string; value: string; onChangeText: (v: string) => void; error?: string | null; required?: boolean; placeholder?: string }) => <AffixInput {...p} prefix="৳" />;
export const MeasurementField = (p: { label: string; unit: string; value: string; onChangeText: (v: string) => void; error?: string | null }) => <AffixInput label={p.label} value={p.value} onChangeText={p.onChangeText} error={p.error} suffix={p.unit} placeholder="0.0" />;

/** Native date dialog. value/onChange use local YYYY-MM-DD strings. */
export function DatePickerField({ label, value, onChange, minimumDate, required, error }: { label: string; value: string; onChange: (v: string) => void; minimumDate?: Date; required?: boolean; error?: string | null }) {
  const [show, setShow] = useState(false);
  const d = isValidDate(value) ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))) : new Date();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <FieldLabel label={label} required={required} />
      <Pressable onPress={() => setShow(true)} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={[st.inputRow, { justifyContent: 'space-between' }, error ? { borderColor: colors.danger } : null]}>
        <Text style={{ fontSize: 16, color: colors.ink }}>{value}</Text>
        <Ionicons name="calendar-outline" size={20} color={colors.muted} />
      </Pressable>
      {show ? <DateTimePicker value={d} mode="date" minimumDate={minimumDate} onChange={(e, sel) => { setShow(false); if (e.type === 'set' && sel) onChange(localDateString(sel)); }} /> : null}
      <FormErrorMessage text={error} />
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={st.search}>
      <Ionicons name="search" size={20} color={colors.muted} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9CA3AF" accessibilityLabel={placeholder} style={st.searchInput} />
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={[st.chip, selected ? { backgroundColor: colors.primary, borderColor: colors.primary } : null]}>
      <Text style={{ color: selected ? '#fff' : colors.ink, fontWeight: '600', fontSize: fonts.small }}>{label}</Text>
    </Pressable>
  );
}

/* ---------- status / summary / list items ---------- */
export function StatusChip({ status, label }: { status: string; label: string }) {
  const c = statusColors[status] ?? { bg: colors.line, fg: colors.ink };
  return <View style={{ backgroundColor: c.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}><Text style={{ color: c.fg, fontSize: 12, fontWeight: '700' }}>{label}</Text></View>;
}
export const StatusBadge = StatusChip;

export function CustomerAvatar({ name, size = 46 }: { name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.4 }}>{name.trim().charAt(0) || '?'}</Text>
    </View>
  );
}
export const Avatar = CustomerAvatar;

export function SummaryCard({ label, value, color, onPress }: { label: string; value: string; color: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${label}: ${value}`} style={[st.tile, { backgroundColor: color }]}>
      <Text style={{ color: '#fff', fontSize: fonts.small, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{value}</Text>
    </Pressable>
  );
}
export const StatTile = SummaryCard;

export function CustomerListItem({ name, subtitle, highlight, onPress }: { name: string; subtitle: string; highlight?: string | null; onPress: () => void }) {
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <CustomerAvatar name={name} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontWeight: '700', fontSize: fonts.body, color: colors.ink }}>{name}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: fonts.small }}>{subtitle}</Text>
          {highlight ? <Text style={{ color: colors.warn, fontSize: fonts.small, fontWeight: '600' }}>{highlight}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </View>
    </Card>
  );
}

export function OrderCard({ number, customer, garments, total, due, status, statusLabel, date, overdueLabel, onPress }: {
  number: string; customer: string; garments: string; total: string; due?: string | null; status: string; statusLabel: string; date: string; overdueLabel?: string | null; onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={1} style={{ color: colors.primary, fontWeight: '800' }}>#{number}</Text>
          <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.ink, fontSize: fonts.body }}>{customer}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: fonts.small }}>{garments}</Text>
          <Text style={{ fontWeight: '800', color: colors.ink }}>{total}{due ? <Text style={{ color: colors.warn, fontWeight: '600' }}>  · {due}</Text> : null}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <StatusChip status={status} label={statusLabel} />
          <Text style={{ fontSize: 12, color: overdueLabel ? colors.danger : colors.muted }}>{date}</Text>
          {overdueLabel ? <Text style={{ fontSize: fonts.tiny, fontWeight: '700', color: colors.danger }}>{overdueLabel}</Text> : null}
        </View>
      </View>
    </Card>
  );
}

export function PaymentHistoryItem({ refund, amount, method, date, note, reverseLabel, onReverse }: { refund?: boolean; amount: string; method: string; date: string; note?: string | null; reverseLabel?: string; onReverse?: () => void }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: refund ? '#FEE2E2' : colors.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={refund ? 'arrow-undo' : 'arrow-down'} size={18} color={refund ? colors.danger : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: refund ? colors.danger : colors.ink }}>{refund ? '− ' : '+ '}{amount} · {method}</Text>
          <Text style={{ color: colors.muted, fontSize: fonts.small }}>{date}{note ? ` · ${note}` : ''}</Text>
        </View>
        {onReverse && reverseLabel ? <Pressable onPress={onReverse} accessibilityRole="button" hitSlop={8}><Text style={{ color: colors.danger, fontWeight: '700', fontSize: fonts.small }}>{reverseLabel}</Text></Pressable> : null}
      </View>
    </Card>
  );
}

export function MenuRow({ icon, title, subtitle, onPress }: { icon: IconName; title: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [st.menu, pressed ? { opacity: 0.8 } : null]}>
      <View style={st.menuIcon}><Ionicons name={icon} size={22} color={colors.primary} /></View>
      <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: colors.ink, fontSize: fonts.body }}>{title}</Text>{subtitle ? <Text style={{ color: colors.muted, fontSize: 12 }}>{subtitle}</Text> : null}</View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={st.fab}><Ionicons name="add" size={30} color="#fff" /></Pressable>;
}

/* ---------- states, dialogs, sheets ---------- */
export function EmptyState({ icon = 'file-tray-outline', title, text, actionLabel, onAction }: { icon?: IconName; title: string; text?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: 'center', padding: spacing.xl, gap: spacing.sm }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={34} color={colors.primary} /></View>
      <Text style={{ fontSize: fonts.heading, fontWeight: '800', color: colors.ink, textAlign: 'center' }}>{title}</Text>
      {text ? <Text style={{ color: colors.muted, textAlign: 'center' }}>{text}</Text> : null}
      {actionLabel && onAction ? <View style={{ alignSelf: 'stretch', marginTop: spacing.sm }}><PrimaryButton title={actionLabel} onPress={onAction} /></View> : null}
    </View>
  );
}
export function Empty({ text }: { text: string }) { return <EmptyState title={text} />; }

export function OfflineStatusIndicator({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.tint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }} accessibilityLabel={label}>
      <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
      <Text style={{ color: colors.primary, fontSize: fonts.tiny, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function ConfirmationDialog({ visible, title, message, confirmLabel, cancelLabel, destructive, onConfirm, onCancel }: { visible: boolean; title: string; message: string; confirmLabel: string; cancelLabel: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={st.backdrop}>
        <View style={st.dialog} accessibilityViewIsModal>
          <Text style={{ fontSize: fonts.heading, fontWeight: '800', color: colors.ink }}>{title}</Text>
          <Text style={{ color: colors.muted }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <View style={{ flex: 1 }}><SecondaryButton title={cancelLabel} onPress={onCancel} /></View>
            <View style={{ flex: 1 }}>{destructive ? <Pressable onPress={onConfirm} accessibilityRole="button" style={[st.btn, { backgroundColor: colors.danger, borderColor: colors.danger }]}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{confirmLabel}</Text></Pressable> : <PrimaryButton title={confirmLabel} onPress={onConfirm} />}</View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[st.backdrop, { justifyContent: 'flex-end', padding: 0 }]} onPress={onClose} accessibilityLabel={title}>
        <Pressable style={st.sheet} onPress={() => undefined}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: spacing.sm }} />
          <Text style={{ fontSize: fonts.heading, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm }}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** On-screen receipt using the same data and money rules as the PDF. */
export function ReceiptPreview({ data }: { data: ReceiptData }) {
  const L = (bn: string, en: string) => (data.lang === 'bn' ? bn : en);
  const m = (x: number) => formatMoney(x, data.lang);
  const fin = orderFinancials(data.order.status, data.order.totalMinor, data.payments.map((p) => ({ kind: p.kind, amountMinor: p.amountMinor })));
  const line = (a: string, b: string, bold?: boolean) => <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={{ color: colors.ink, flex: 1, fontWeight: bold ? '800' : '400' }}>{a}</Text><Text style={{ color: colors.ink, fontWeight: bold ? '800' : '400' }}>{b}</Text></View>;
  return (
    <View style={[st.card, { backgroundColor: '#fff', gap: 6, padding: spacing.lg }]}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>{data.shop.name.trim() || strings[data.lang].appName}</Text>
      {data.shop.address.trim() ? <Text style={{ color: colors.muted }}>{data.shop.address}</Text> : null}
      {data.shop.phone.trim() ? <Text style={{ color: colors.muted }}>{data.shop.phone}</Text> : null}
      <Text style={{ fontWeight: '800', color: colors.ink, marginTop: 6 }}>{L('রশিদ / অর্ডার নিশ্চিতকরণ', 'Receipt / Order Confirmation')}</Text>
      <Text style={{ color: colors.ink }}>{L('অর্ডার নম্বর: ', 'Order no.: ')}{data.order.number} · {strings[data.lang].status[data.order.status]}</Text>
      <Text style={{ color: colors.ink }}>{L('গ্রাহক: ', 'Customer: ')}{data.customerName}</Text>
      <Text style={{ color: colors.muted }}>{L('ডেলিভারি: ', 'Delivery: ')}{data.order.deliveryDate}</Text>
      <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 6 }} />
      {data.items.map((i, k) => <React.Fragment key={k}>{line(`${GARMENT_LABEL[i.garment]?.[data.lang === 'bn' ? 0 : 1] ?? i.garment} × ${i.qty}`, m(i.qty * i.unitPriceMinor))}</React.Fragment>)}
      <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 6 }} />
      {data.order.discountMinor > 0 ? line(L('ছাড়', 'Discount'), m(data.order.discountMinor)) : null}
      {line(L('মোট', 'Total'), m(data.order.totalMinor), true)}
      {line(L('পরিশোধিত', 'Paid'), m(fin.paidMinor))}
      {line(L('বাকি', 'Balance due'), m(fin.balanceMinor), true)}
      {fin.refundDueMinor > 0 ? line(L('ফেরতযোগ্য', 'Refund due'), m(fin.refundDueMinor)) : null}
      <Text style={{ color: colors.muted, fontSize: fonts.tiny, marginTop: 8 }}>{L('এটি একটি রশিদ/অর্ডার নিশ্চিতকরণ, ট্যাক্স ইনভয়েস নয়।', 'This is a receipt / order confirmation, not a tax invoice.')}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 4, ...elevation.card },
  h: { fontSize: fonts.heading, fontWeight: '800', color: colors.ink },
  btn: { minHeight: 48, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  label: { fontSize: fonts.small, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, fontSize: 16, backgroundColor: '#fff', color: colors.ink },
  inputRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, backgroundColor: '#fff' },
  inputBare: { flex: 1, minHeight: 46, fontSize: 16, color: colors.ink },
  affix: { color: colors.muted, fontSize: 16, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 },
  searchInput: { flex: 1, minHeight: 46, fontSize: fonts.body, color: colors.ink },
  chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tile: { flexBasis: '47%', flexGrow: 1, borderRadius: radius.lg, padding: 14, gap: 6, minHeight: 92 },
  menu: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 18, bottom: 18, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', ...elevation.fab },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: spacing.xl },
  dialog: { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm, ...elevation.sheet },
});
