import type { SQLiteDatabase } from 'expo-sqlite';
import { BACKUP_APP, BACKUP_SCHEMA_VERSION, TABLES, TABLE_COLUMNS, maxOrderSeq, validateBackup, type Backup, type Row, type Table } from '../domain/backup';

export async function exportBackup(db: SQLiteDatabase): Promise<Backup> {
  const tables = {} as Record<Table, Row[]>;
  for (const t of TABLES) tables[t] = await db.getAllAsync<Row>(`SELECT ${TABLE_COLUMNS[t].join(',')} FROM ${t} ORDER BY rowid`);
  return { app: BACKUP_APP, schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables };
}

/** Replaces ALL current business data with the backup, atomically. On any failure nothing changes. */
export async function restoreBackup(db: SQLiteDatabase, b: Backup): Promise<void> {
  const err = validateBackup(b);
  if (err) throw new Error(err);
  try {
    await db.withTransactionAsync(async () => {
      for (const t of [...TABLES].reverse()) await db.runAsync(`DELETE FROM ${t}`);
      for (const t of TABLES) {
        const cols = TABLE_COLUMNS[t];
        let rows = b.tables[t];
        if (t === 'payments') rows = [...rows.filter((r) => r.reverses_payment_id === null), ...rows.filter((r) => r.reverses_payment_id !== null)];
        for (const r of rows) {
          await db.runAsync(`INSERT INTO ${t}(${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, ...cols.map((c) => r[c] ?? null));
        }
      }
      const cur = (await db.getFirstAsync<{ value: number }>("SELECT value FROM counters WHERE name='order_seq'"))?.value ?? 0;
      const seq = Math.max(cur, maxOrderSeq(b.tables.orders));
      await db.runAsync("INSERT INTO counters(name,value) VALUES ('order_seq',?) ON CONFLICT(name) DO UPDATE SET value=excluded.value", seq);
    });
  } catch {
    throw new Error('restore_failed');
  }
}

/** Deletes every customer, order, payment, measurement and the shop details. Preferences are kept. */
export async function deleteAllData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const t of [...TABLES].reverse()) { if (t !== 'app_preferences') await db.runAsync(`DELETE FROM ${t}`); }
    await db.runAsync("INSERT INTO counters(name,value) VALUES ('order_seq',0)");
  });
}
