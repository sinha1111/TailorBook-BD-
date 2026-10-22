import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Card, H, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { useLoad } from '@/ui/useLoad';
import { getCustomer } from '@/db/customers';
import { shareMeasurementSheet } from '@/services/receipt';
import { Alert } from 'react-native';
import { listCustomerMeasurements } from '@/db/measurements';
import { GARMENT_LABEL, GARMENT_TEMPLATES, type FieldsMap } from '@/domain/units';

export default function CustomerMeasurements() {
  const db = useSQLiteContext(); const r = useRouter(); const { L, lang, err } = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useLoad(async () => ({ c: await getCustomer(db, id), m: await listCustomerMeasurements(db, id) }), [db, id]);
  if (!data?.c) return <Screen><T muted>{L('লোড হচ্ছে…', 'Loading…')}</T></Screen>;
  const name = (g: string) => GARMENT_LABEL[g]?.[lang === 'bn' ? 0 : 1] ?? g;
  return (
    <Screen>
      <H>{data.c.name}</H>
      <Btn title={L('+ নতুন মাপ নিন', '+ Record new measurements')} onPress={() => r.push({ pathname: '/measurement/edit', params: { customerId: id } })} />
      {data.m.length > 0 ? <Btn variant="ghost" title={L('মাপের শীট শেয়ার (PDF)', 'Share measurement sheet (PDF)')} onPress={() => shareMeasurementSheet(db, id, lang).catch((e: unknown) => Alert.alert(L('সম্ভব হয়নি', 'Not possible'), err(e)))} /> : null}
      {data.m.length === 0 ? <T muted>{L('এখনও কোনো মাপ সংরক্ষিত নেই', 'No measurements saved yet')}</T> : null}
      {Object.keys(GARMENT_TEMPLATES).filter((g) => data.m.some((x) => x.garment_type === g)).map((g) => (
        <React.Fragment key={g}>
          <H>{name(g)}</H>
          {data.m.filter((x) => x.garment_type === g).map((x, idx) => (
            <Card key={x.id}>
              <T bold>{L('সংস্করণ ', 'Version ')}{x.version}{idx === 0 ? L(' (সর্বশেষ)', ' (latest)') : ''} · {new Date(x.recorded_at).toLocaleDateString()}</T>
              <T>{Object.values(JSON.parse(x.fields_json) as FieldsMap).map((f) => `${lang === 'bn' && f.bn ? f.bn : f.label} ${f.value}`).join(', ')} {x.unit}</T>
              {x.notes ? <T muted>{x.notes}</T> : null}
              <Btn variant="ghost" title={idx === 0 ? L('সম্পাদনা (নতুন সংস্করণ)', 'Edit (saves new version)') : L('এটি থেকে নতুন সংস্করণ', 'Reuse as new version')}
                onPress={() => r.push({ pathname: '/measurement/edit', params: { customerId: id, garment: g, fromId: x.id } })} />
            </Card>
          ))}
        </React.Fragment>
      ))}
    </Screen>
  );
}
