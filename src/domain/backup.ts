export const BACKUP_APP = 'tailorbook-bd';
export const BACKUP_SCHEMA_VERSION = 1;

/** Insert order = parents before children. Delete order = reverse. */
export const TABLES = ['customers', 'measurements', 'orders', 'order_items', 'order_measurement_snapshots', 'payments', 'shop_settings', 'app_preferences', 'counters'] as const;
export type Table = (typeof TABLES)[number];

export const TABLE_COLUMNS: Record<Table, string[]> = {
  customers: ['id', 'name', 'phone', 'address', 'notes', 'created_at', 'updated_at'],
  measurements: ['id', 'customer_id', 'garment_type', 'version', 'unit', 'fields_json', 'notes', 'recorded_at'],
  orders: ['id', 'order_number', 'client_request_id', 'customer_id', 'status', 'order_date', 'delivery_date', 'discount_minor', 'fabric_info', 'style_notes', 'instructions', 'cancelled_at', 'created_at', 'updated_at'],
  order_items: ['id', 'order_id', 'garment_type', 'description', 'quantity', 'unit_price_minor'],
  order_measurement_snapshots: ['id', 'order_item_id', 'unit', 'fields_json', 'notes', 'source_measurement_id'],
  payments: ['id', 'order_id', 'customer_id', 'kind', 'amount_minor', 'method', 'paid_at', 'reverses_payment_id', 'note', 'created_at'],
  shop_settings: ['key', 'value'],
  app_preferences: ['key', 'value'],
  counters: ['name', 'value'],
};

const PK: Record<Table, string> = {
  customers: 'id', measurements: 'id', orders: 'id', order_items: 'id', order_measurement_snapshots: 'id', payments: 'id',
  shop_settings: 'key', app_preferences: 'key', counters: 'name',
};

export type Row = Record<string, string | number | null>;
export interface Backup { app: string; schemaVersion: number; exportedAt: string; tables: Record<Table, Row[]> }

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Returns an error code, or null when the backup is structurally safe to restore. */
export function validateBackup(x: unknown): string | null {
  if (!isObj(x)) return 'backup_corrupted';
  if (x.app !== BACKUP_APP) return 'backup_wrong_app';
  if (typeof x.schemaVersion !== 'number' || !Number.isInteger(x.schemaVersion) || x.schemaVersion < 1) return 'backup_corrupted';
  if (x.schemaVersion > BACKUP_SCHEMA_VERSION) return 'backup_unsupported_version';
  if (!isObj(x.tables)) return 'backup_corrupted';
  const t = x.tables;
  const ids: Record<string, Set<unknown>> = {};
  for (const name of TABLES) {
    const rows = t[name];
    if (!Array.isArray(rows)) return 'backup_missing_table';
    const seen = new Set<unknown>();
    const uniq: Record<string, Set<unknown>> = name === 'orders' ? { order_number: new Set(), client_request_id: new Set() } : {};
    for (const r of rows) {
      if (!isObj(r)) return 'backup_bad_row';
      for (const col of TABLE_COLUMNS[name]) {
        if (!(col in r)) return 'backup_bad_row';
        const v = r[col];
        if (v !== null && typeof v !== 'string' && typeof v !== 'number') return 'backup_bad_row';
      }
      const k = r[PK[name]];
      if (k === null || seen.has(k)) return 'backup_duplicate_id';
      seen.add(k);
      for (const [c, set] of Object.entries(uniq)) { if (set.has(r[c])) return 'backup_duplicate_id'; set.add(r[c]); }
    }
    ids[name] = seen;
  }
  const refs = (table: Table, col: string, target: Table, nullable = false): string | null => {
    for (const r of t[table] as Row[]) {
      const v = r[col];
      if (v === null && nullable) continue;
      if (!ids[target]?.has(v)) return 'backup_broken_reference';
    }
    return null;
  };
  return refs('measurements', 'customer_id', 'customers') ?? refs('orders', 'customer_id', 'customers') ?? refs('order_items', 'order_id', 'orders')
    ?? refs('order_measurement_snapshots', 'order_item_id', 'order_items') ?? refs('payments', 'order_id', 'orders')
    ?? refs('payments', 'customer_id', 'customers') ?? refs('payments', 'reverses_payment_id', 'payments', true);
}

export function summarizeBackup(b: Backup) {
  return { customers: b.tables.customers.length, orders: b.tables.orders.length, payments: b.tables.payments.length, measurements: b.tables.measurements.length, exportedAt: b.exportedAt };
}

/** Highest sequence number used in order numbers like TB-2026-0042, so new orders never collide after a restore. */
export function maxOrderSeq(orders: Row[]): number {
  let max = 0;
  for (const o of orders) {
    const m = /-(\d+)$/.exec(String(o.order_number));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}
