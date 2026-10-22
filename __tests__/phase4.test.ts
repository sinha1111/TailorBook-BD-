import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TABLES, TABLE_COLUMNS, validateBackup, maxOrderSeq, BACKUP_APP, type Backup, type Row } from '../src/domain/backup.ts';
import { buildReceiptHtml, buildMeasurementSheetHtml, type ReceiptData } from '../src/domain/receipt.ts';
import { toCsv, minorToDecimal } from '../src/domain/csv.ts';
import { planReminders } from '../src/domain/reminders.ts';

const row = (t: keyof typeof TABLE_COLUMNS, v: Row): Row => Object.fromEntries(TABLE_COLUMNS[t].map((c) => [c, v[c] ?? null]));
function sample(): Backup {
  const tables = Object.fromEntries(TABLES.map((t) => [t, [] as Row[]])) as Backup['tables'];
  tables.customers = [row('customers', { id: 'c1', name: 'রহিম', created_at: 'x', updated_at: 'x' })];
  tables.orders = [row('orders', { id: 'o1', order_number: 'TB-2026-0042', client_request_id: 'r1', customer_id: 'c1', status: 'pending', order_date: '2026-10-01', delivery_date: '2026-10-09', discount_minor: 0, created_at: 'x', updated_at: 'x' })];
  tables.order_items = [row('order_items', { id: 'i1', order_id: 'o1', garment_type: 'panjabi', quantity: 1, unit_price_minor: 100000 })];
  tables.payments = [
    row('payments', { id: 'p1', order_id: 'o1', customer_id: 'c1', kind: 'payment', amount_minor: 50000, method: 'cash', paid_at: 'x', created_at: 'x' }),
    row('payments', { id: 'p2', order_id: 'o1', customer_id: 'c1', kind: 'refund', amount_minor: 50000, method: 'cash', paid_at: 'x', reverses_payment_id: 'p1', created_at: 'x' }),
  ];
  return { app: BACKUP_APP, schemaVersion: 1, exportedAt: '2026-10-13T00:00:00Z', tables };
}

test('valid backup passes and survives JSON round-trip', () => {
  assert.equal(validateBackup(sample()), null);
  assert.equal(validateBackup(JSON.parse(JSON.stringify(sample()))), null);
});

test('corrupted, foreign and newer backups are rejected', () => {
  assert.equal(validateBackup(null), 'backup_corrupted');
  assert.equal(validateBackup('{}'), 'backup_corrupted');
  assert.equal(validateBackup({ ...sample(), app: 'other' }), 'backup_wrong_app');
  assert.equal(validateBackup({ ...sample(), schemaVersion: 99 }), 'backup_unsupported_version');
  const missing = sample(); delete (missing.tables as Partial<Backup['tables']>).payments;
  assert.equal(validateBackup(missing), 'backup_missing_table');
  const bad = sample(); delete bad.tables.customers[0]!.name;
  assert.equal(validateBackup(bad), 'backup_bad_row');
});

test('duplicate ids and broken references are rejected', () => {
  const dup = sample(); dup.tables.customers.push({ ...dup.tables.customers[0]! });
  assert.equal(validateBackup(dup), 'backup_duplicate_id');
  const dupNo = sample(); dupNo.tables.orders.push({ ...dupNo.tables.orders[0]!, id: 'o2', client_request_id: 'r2' });
  assert.equal(validateBackup(dupNo), 'backup_duplicate_id');
  const ref = sample(); ref.tables.orders[0]!.customer_id = 'nope';
  assert.equal(validateBackup(ref), 'backup_broken_reference');
  const rev = sample(); rev.tables.payments[1]!.reverses_payment_id = 'ghost';
  assert.equal(validateBackup(rev), 'backup_broken_reference');
});

test('order counter is derived from restored order numbers', () => {
  assert.equal(maxOrderSeq(sample().tables.orders), 42);
  assert.equal(maxOrderSeq([]), 0);
});

const data = (lang: 'bn' | 'en'): ReceiptData => ({
  lang, shop: { name: 'রহমান টেইলার্স', address: 'মিরপুর, ঢাকা', phone: '' }, customerName: 'করিম <script>',
  order: { number: 'TB-2026-0001', status: 'pending', orderDate: '2026-10-13', deliveryDate: '2026-10-20', discountMinor: 10000, totalMinor: 240000 },
  items: [{ garment: 'panjabi', qty: 2, unitPriceMinor: 125000 }],
  payments: [{ kind: 'payment', amountMinor: 100000, method: 'mfs', date: '2026-10-13' }],
});

test('Bengali receipt uses real data, escapes input and is not a tax invoice', () => {
  const h = buildReceiptHtml(data('bn'));
  assert.ok(h.includes('রহমান টেইলার্স') && h.includes('পাঞ্জাবি') && h.includes('TB-2026-0001'));
  assert.ok(h.includes('৳২,৪০০') && h.includes('৳১,০০০') && h.includes('৳১,৪০০'));   // total, paid, balance
  assert.ok(h.includes('রশিদ') && h.includes('ট্যাক্স ইনভয়েস নয়'));
  assert.ok(!h.includes('<script>') && h.includes('&lt;script&gt;'));
  assert.ok(!h.includes('মিরপুর, ঢাকা</div><div class="muted"></div>'));          // empty phone omitted
  const en = buildReceiptHtml(data('en'));
  assert.ok(en.includes('Receipt / Order Confirmation') && en.includes('not a tax invoice') && en.includes('৳1,400'));
});

test('measurement sheet renders labels and units', () => {
  const h = buildMeasurementSheetHtml({ lang: 'bn', shop: { name: '', address: '', phone: '' }, customerName: 'করিম',
    entries: [{ garment: 'shirt', version: 2, unit: 'in', recordedAt: '2026-10-13', fields: { chest: { label: 'Chest', bn: 'বুক', value: 38.5 } }, notes: null }] });
  assert.ok(h.includes('বুক') && h.includes('৩৮.৫') && h.includes('ইঞ্চি') && h.includes('টেইলরবুক বিডি'));
});

test('CSV quoting, formula guard and decimals', () => {
  const csv = toCsv([['a', 'b,c', 'say "hi"', '=SUM(1)', null, 5]]);
  assert.ok(csv.endsWith('a,"b,c","say ""hi""",\'=SUM(1),,5'));
  assert.equal(minorToDecimal(125050), '1250.50');
  assert.equal(minorToDecimal(5), '0.05');
});

test('reminder plan: stable ids, skips past/inactive, aggregates overdue', () => {
  const now = new Date(2026, 9, 13, 10, 0); // 13 Oct 10:00 local
  const o = (id: string, d: string, active = true) => ({ id, orderNumber: `TB-${id}`, customerName: 'X', deliveryDate: d, active });
  const plan = planReminders([o('a', '2026-10-13'), o('b', '2026-10-14'), o('c', '2026-10-10'), o('d', '2026-10-09'), o('e', '2026-10-20', false)], now, { dayBefore: true, lang: 'en' });
  const ids = plan.map((p) => p.identifier);
  assert.ok(!ids.includes('due-a'));                 // 09:00 today already passed
  assert.ok(ids.includes('pre-b') && ids.includes('due-b'));
  assert.ok(!ids.some((i) => i.endsWith('-e')));     // inactive
  const ov = plan.find((p) => p.identifier === 'overdue-summary')!;
  assert.ok(ov.body.startsWith('2 order') && ov.date.getDate() === 14 && ov.date.getHours() === 9);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(planReminders([o('b', '2026-10-14')], now, { dayBefore: false, lang: 'bn' }).length, 1);
});
