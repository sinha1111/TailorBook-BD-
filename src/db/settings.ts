import type { SQLiteDatabase } from 'expo-sqlite';

export type ShopKey = 'shop_name' | 'shop_address' | 'shop_phone';

export async function getShop(db: SQLiteDatabase): Promise<Record<ShopKey, string>> {
  const rows = await db.getAllAsync<{ key: string; value: string | null }>('SELECT key, value FROM shop_settings');
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']));
  return { shop_name: m.shop_name ?? '', shop_address: m.shop_address ?? '', shop_phone: m.shop_phone ?? '' };
}

export async function saveShop(db: SQLiteDatabase, v: Record<ShopKey, string>): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [k, val] of Object.entries(v)) {
      await db.runAsync('INSERT INTO shop_settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, val.trim());
    }
  });
}

export async function getPref(db: SQLiteDatabase, key: string): Promise<string | null> {
  return (await db.getFirstAsync<{ value: string }>('SELECT value FROM app_preferences WHERE key=?', key))?.value ?? null;
}
export async function setPref(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT INTO app_preferences(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, value);
}
