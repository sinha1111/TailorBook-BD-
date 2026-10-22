/** Minimal executor interface so migrations can run against expo-sqlite (SQLiteDatabase satisfies it). */
export interface SqlDb {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
}

export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  phone TEXT, address TEXT, notes TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_customers_name ON customers(name COLLATE NOCASE);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Versioned customer measurement history (append-only; edits create a new version).
CREATE TABLE measurements (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  garment_type TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  unit TEXT NOT NULL CHECK (unit IN ('cm','in')),
  fields_json TEXT NOT NULL,
  notes TEXT,
  recorded_at TEXT NOT NULL,
  UNIQUE (customer_id, garment_type, version)
);

-- Customers with orders can't be hard-deleted (RESTRICT) so financial history survives.
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  client_request_id TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','ready','delivered','cancelled')),
  order_date TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  discount_minor INTEGER NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  fabric_info TEXT, style_notes TEXT, instructions TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status_delivery ON orders(status, delivery_date);

-- Totals are NOT stored: always derived from items - discount and the payment ledger.
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  garment_type TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0)
);
CREATE INDEX idx_items_order ON order_items(order_id);

-- Frozen copy of measurements at order time; later customer edits never touch it.
CREATE TABLE order_measurement_snapshots (
  id TEXT PRIMARY KEY,
  order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  unit TEXT NOT NULL CHECK (unit IN ('cm','in')),
  fields_json TEXT NOT NULL,
  notes TEXT,
  source_measurement_id TEXT
);

-- Append-only ledger. Corrections are refund rows pointing at the payment they reverse.
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL DEFAULT 'payment' CHECK (kind IN ('payment','refund')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  method TEXT NOT NULL CHECK (method IN ('cash','mfs','bank','other')),
  paid_at TEXT NOT NULL,
  reverses_payment_id TEXT REFERENCES payments(id),
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

CREATE TABLE shop_settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE app_preferences (key TEXT PRIMARY KEY, value TEXT);
-- Order numbers stay unique across restarts: increment in the same transaction as the order insert.
CREATE TABLE counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
INSERT INTO counters(name, value) VALUES ('order_seq', 0);
`,
  },
];

export async function runMigrations(db: SqlDb): Promise<number> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);');
  const row = await db.getFirstAsync<{ v: number | null }>('SELECT MAX(version) AS v FROM schema_migrations');
  let current = row?.v ?? 0;
  for (const m of MIGRATIONS.filter((x) => x.version > current)) {
    await db.execAsync(`BEGIN;\n${m.sql}\nINSERT INTO schema_migrations(version, applied_at) VALUES (${m.version}, datetime('now'));\nCOMMIT;`);
    current = m.version;
  }
  return current;
}
