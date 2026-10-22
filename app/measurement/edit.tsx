import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Card, Chip, Field, H, Row, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { getLatestMeasurement, getMeasurement, saveMeasurement } from '@/db/measurements';
import { getPref } from '@/db/settings';
import { GARMENT_LABEL, GARMENT_TEMPLATES, convert, parseMeasure, type FieldsMap, type Unit } from '@/domain/units';

interface Custom { label: string; value: string }

export default function EditMeasurement() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang, err } = useLang();
  const p = useLocalSearchParams<{ customerId: string; garment?: string; fromId?: string }>();
  const [garment, setGarment] = useState(p.garment ?? 'panjabi');
  const [unit, setUnit] = useState<Unit>('in');
  const [vals, setVals] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<Custom[]>([]);
  const [notes, setNotes] = useState('');
  const busy = useRef(false);

  // Prefill from a chosen version, or from the latest saved one, or use the default unit preference.
  useEffect(() => {
    void (async () => {
      const src = p.fromId && garment === p.garment ? await getMeasurement(db, p.fromId) : await getLatestMeasurement(db, p.customerId, garment);
      if (!src) {
        setVals({}); setCustom([]); setNotes('');
        setUnit(((await getPref(db, 'unit')) as Unit | null) ?? 'in');
        return;
      }
      const f = JSON.parse(src.fields_json) as FieldsMap;
      const tpl = new Set(GARMENT_TEMPLATES[garment]?.map((x) => x.key));
      setUnit(src.unit); setNotes(src.notes ?? '');
      setVals(Object.fromEntries(Object.entries(f).filter(([k]) => tpl.has(k)).map(([k, v]) => [k, String(v.value)])));
      setCustom(Object.entries(f).filter(([k]) => !tpl.has(k)).map(([, v]) => ({ label: v.label, value: String(v.value) })));
    })();
  }, [db, p.customerId, p.fromId, p.garment, garment]);

  /** Switching unit converts what is on screen (still a draft). Saved versions are never rewritten. */
  const switchUnit = (to: Unit) => {
    if (to === unit) return;
    const conv = (s: string) => { const n = parseMeasure(s); return n === null ? s : String(convert(n, unit, to)); };
    setVals((v) => Object.fromEntries(Object.entries(v).map(([k, s]) => [k, conv(s)])));
    setCustom((c) => c.map((x) => ({ ...x, value: conv(x.value) })));
    setUnit(to);
  };

  const save = async () => {
    if (busy.current) return;
    const fields: FieldsMap = {};
    for (const d of GARMENT_TEMPLATES[garment] ?? []) {
      const raw = vals[d.key]?.trim();
      if (!raw) continue;
      const n = parseMeasure(raw);
      if (n === null) return Alert.alert(L('ভুল মাপ', 'Invalid value'), `${lang === 'bn' ? d.bn : d.en}: ${raw}`);
      fields[d.key] = { label: d.en, bn: d.bn, value: n };
    }
    for (const [i, c] of custom.entries()) {
      if (!c.label.trim() && !c.value.trim()) continue;
      const n = parseMeasure(c.value);
      if (!c.label.trim() || n === null) return Alert.alert(L('ভুল কাস্টম মাপ', 'Invalid custom field'), c.label || c.value);
      fields[`custom_${i}`] = { label: c.label.trim(), value: n };
    }
    busy.current = true;
    try { await saveMeasurement(db, { customerId: p.customerId, garmentType: garment, unit, fields, notes }); r.back(); }
    catch (e) { Alert.alert(L('সংরক্ষণ হয়নি', 'Not saved'), err(e)); } finally { busy.current = false; }
  };

  return (
    <Screen>
      <H>{L('পোশাক', 'Garment')}</H>
      <Row>{Object.keys(GARMENT_TEMPLATES).map((g) => <Chip key={g} label={GARMENT_LABEL[g]?.[lang === 'bn' ? 0 : 1] ?? g} selected={garment === g} onPress={() => setGarment(g)} />)}</Row>
      <H>{L('একক', 'Unit')}</H>
      <Row><Chip label={L('ইঞ্চি', 'Inches')} selected={unit === 'in'} onPress={() => switchUnit('in')} /><Chip label={L('সেন্টিমিটার', 'Centimeters')} selected={unit === 'cm'} onPress={() => switchUnit('cm')} /></Row>
      <T muted>{L('একক বদলালে স্ক্রিনের মানগুলো রূপান্তর হয়; আগের সংরক্ষিত সংস্করণ বদলায় না।', 'Changing the unit converts the values on screen; saved versions are never changed.')}</T>
      {(GARMENT_TEMPLATES[garment] ?? []).map((d) => (
        <Field key={d.key} label={`${lang === 'bn' ? d.bn : d.en} (${unit})`} value={vals[d.key] ?? ''} onChangeText={(v) => setVals((x) => ({ ...x, [d.key]: v }))} keyboardType="decimal-pad" />
      ))}
      <H>{L('কাস্টম মাপ', 'Custom fields')}</H>
      {custom.map((c, i) => (
        <Card key={i}>
          <Field label={L('নাম', 'Label')} value={c.label} onChangeText={(v) => setCustom((a) => a.map((x, k) => (k === i ? { ...x, label: v } : x)))} />
          <Field label={`${L('মাপ', 'Value')} (${unit})`} value={c.value} onChangeText={(v) => setCustom((a) => a.map((x, k) => (k === i ? { ...x, value: v } : x)))} keyboardType="decimal-pad" />
          <Btn variant="danger" title={L('সরান', 'Remove')} onPress={() => setCustom((a) => a.filter((_, k) => k !== i))} />
        </Card>
      ))}
      <Btn variant="ghost" title={L('+ কাস্টম মাপ যোগ করুন', '+ Add custom field')} onPress={() => setCustom((a) => [...a, { label: '', value: '' }])} />
      <Field label={L('নোট', 'Notes')} value={notes} onChangeText={setNotes} multiline />
      <Btn title={L('নতুন সংস্করণ হিসেবে সংরক্ষণ', 'Save as new version')} onPress={save} />
    </Screen>
  );
}
