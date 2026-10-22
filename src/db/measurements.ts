import type { SQLiteDatabase } from 'expo-sqlite';
import { newId } from './ids';
import { validateMeasurementFields, type FieldsMap, type Unit } from '../domain/units';

export interface MeasurementRow { id: string; customer_id: string; garment_type: string; version: number; unit: Unit; fields_json: string; notes: string | null; recorded_at: string }

export function listCustomerMeasurements(db: SQLiteDatabase, customerId: string) {
  return db.getAllAsync<MeasurementRow>('SELECT * FROM measurements WHERE customer_id=? ORDER BY garment_type, version DESC', customerId);
}

export function getMeasurement(db: SQLiteDatabase, id: string) {
  return db.getFirstAsync<MeasurementRow>('SELECT * FROM measurements WHERE id=?', id);
}

export function getLatestMeasurement(db: SQLiteDatabase, customerId: string, garment: string) {
  return db.getFirstAsync<MeasurementRow>('SELECT * FROM measurements WHERE customer_id=? AND garment_type=? ORDER BY version DESC LIMIT 1', customerId, garment);
}

/** Append-only: every save creates a new version. Old versions and order snapshots are never modified. */
export async function saveMeasurement(db: SQLiteDatabase, m: { customerId: string; garmentType: string; unit: Unit; fields: FieldsMap; notes?: string }): Promise<string> {
  const e = validateMeasurementFields(m.fields);
  if (e) throw new Error(e);
  const id = newId();
  await db.withTransactionAsync(async () => {
    const v = await db.getFirstAsync<{ v: number | null }>('SELECT MAX(version) AS v FROM measurements WHERE customer_id=? AND garment_type=?', m.customerId, m.garmentType);
    await db.runAsync('INSERT INTO measurements(id,customer_id,garment_type,version,unit,fields_json,notes,recorded_at) VALUES (?,?,?,?,?,?,?,?)',
      id, m.customerId, m.garmentType, (v?.v ?? 0) + 1, m.unit, JSON.stringify(m.fields), m.notes?.trim() || null, new Date().toISOString());
  });
  return id;
}
