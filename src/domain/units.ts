/** Measurements are stored exactly as entered, together with their unit. Conversion is display-only. */
export type Unit = 'cm' | 'in';
export const CM_PER_INCH = 2.54;

export function convert(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  const r = from === 'in' ? value * CM_PER_INCH : value / CM_PER_INCH;
  return Math.round(r * 100) / 100;
}

export interface FieldDef { key: string; bn: string; en: string }
const f = (key: string, en: string, bn: string): FieldDef => ({ key, en, bn });

export const GARMENT_TEMPLATES: Record<string, FieldDef[]> = {
  panjabi: [f('chest','Chest','বুক'), f('waist','Waist','কোমর'), f('hip','Hip','হিপ'), f('shoulder','Shoulder','কাঁধ'), f('sleeve','Sleeve','হাতা'), f('length','Full length','লম্বা'), f('neck','Neck','গলা'), f('cuff','Cuff','কাফ')],
  shirt: [f('collar','Collar','কলার'), f('chest','Chest','বুক'), f('waist','Waist','কোমর'), f('shoulder','Shoulder','কাঁধ'), f('sleeve','Sleeve','হাতা'), f('length','Shirt length','লম্বা'), f('cuff','Cuff','কাফ')],
  pants: [f('waist','Waist','কোমর'), f('hip','Hip','হিপ'), f('rise','Rise','রাইজ'), f('thigh','Thigh','রান'), f('knee','Knee','হাঁটু'), f('bottom','Bottom opening','মোহরি'), f('inseam','Inseam','ইনসিম'), f('length','Full length','লম্বা')],
  kurta: [f('chest','Chest','বুক'), f('waist','Waist','কোমর'), f('hip','Hip','হিপ'), f('shoulder','Shoulder','কাঁধ'), f('sleeve','Sleeve','হাতা'), f('length','Length','লম্বা'), f('neck','Neck','গলা')],
  pajama: [f('waist','Waist','কোমর'), f('hip','Hip','হিপ'), f('thigh','Thigh','রান'), f('bottom','Bottom opening','মোহরি'), f('length','Length','লম্বা')],
  blouse: [f('chest','Chest','বুক'), f('waist','Waist','কোমর'), f('shoulder','Shoulder','কাঁধ'), f('sleeve','Sleeve','হাতা'), f('length','Blouse length','লম্বা'), f('neck_front','Front neck depth','সামনে গলা'), f('neck_back','Back neck depth','পেছনে গলা')],
  custom: [],
};

export const GARMENT_LABEL: Record<string, [string, string]> = {
  panjabi: ['পাঞ্জাবি', 'Panjabi'], shirt: ['শার্ট', 'Shirt'], pants: ['প্যান্ট', 'Pants'], kurta: ['কুর্তা', 'Kurta'],
  pajama: ['পাজামা', 'Pajama'], blouse: ['ব্লাউজ', 'Blouse'], custom: ['কাস্টম', 'Custom'],
};

export interface MeasuredField { label: string; bn?: string; value: number }
export type FieldsMap = Record<string, MeasuredField>;

/** Parses "38.5", "৩৮.৫", "38,5". Returns null for empty/invalid. */
export function parseMeasure(input: string): number | null {
  const s = input.trim().replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function validateMeasurementFields(f: FieldsMap): string | null {
  const vals = Object.values(f);
  if (vals.length === 0) return 'measurement_empty';
  if (vals.some((v) => !Number.isFinite(v.value) || v.value <= 0 || v.value > 500)) return 'measurement_invalid';
  return null;
}
