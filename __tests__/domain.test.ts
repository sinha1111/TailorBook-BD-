import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, formatMoney } from '../src/domain/money.ts';
import * as o from '../src/domain/orders.ts';
import { convert, parseMeasure, validateMeasurementFields } from '../src/domain/units.ts';
import { MIGRATIONS, runMigrations } from '../src/db/migrations.ts';

test('money parsing is exact and accepts Bengali digits', () => {
  assert.equal(parseMoney('1,250.50'), 125050);
  assert.equal(parseMoney('১২৫০'), 125000);
  assert.equal(parseMoney('0.1'), 10);
  assert.equal(parseMoney('-5'), null);
  assert.equal(parseMoney('1.234'), null);
  assert.equal(formatMoney(125050, 'en'), '৳1,250.50');
  assert.equal(formatMoney(125000, 'bn'), '৳১,২৫০');
});

test('order total, discount and balance', () => {
  const items = [{ quantity: 2, unitPriceMinor: 120000 }, { quantity: 1, unitPriceMinor: 50000 }];
  assert.equal(o.orderTotal(items, 10000), 280000);
  assert.equal(o.orderTotal(items, 999999999), null);
  assert.equal(o.orderTotal(items, -1), null);
  const f = o.orderFinancials('pending', 280000, [{ kind: 'payment', amountMinor: 100000 }]);
  assert.equal(f.balanceMinor, 180000);
});

test('partial payments, overpayment block, refund reversal', () => {
  const pay = [{ kind: 'payment' as const, amountMinor: 100000 }];
  assert.equal(o.validatePayment('pending', 150000, pay, 50000), null);
  assert.equal(o.validatePayment('pending', 150000, pay, 50001), 'overpayment');
  assert.equal(o.validatePayment('pending', 150000, pay, 0), 'amount_invalid');
  assert.equal(o.validatePayment('cancelled', 150000, pay, 1), 'order_cancelled');
  const reversed = [...pay, { kind: 'refund' as const, amountMinor: 100000 }];
  assert.equal(o.netPaid(reversed), 0);
  assert.equal(o.validateRefund(pay, 100001), 'refund_exceeds_paid');
});

test('cancelled orders are not billable and expose refund due', () => {
  const f = o.orderFinancials('cancelled', 200000, [{ kind: 'payment', amountMinor: 50000 }]);
  assert.deepEqual(f, { billableMinor: 0, paidMinor: 50000, balanceMinor: 0, refundDueMinor: 50000 });
});

test('status transitions', () => {
  assert.ok(o.canTransition('pending', 'in_progress'));
  assert.ok(!o.canTransition('pending', 'delivered'));
  assert.ok(!o.canTransition('delivered', 'cancelled'));
  assert.ok(o.canTransition('cancelled', 'pending'));
});

test('item validation, order numbers, overdue', () => {
  assert.equal(o.validateItem({ quantity: 0, unitPriceMinor: 1 }), 'quantity_invalid');
  assert.equal(o.validateItem({ quantity: 1, unitPriceMinor: -1 }), 'price_invalid');
  assert.equal(o.formatOrderNumber(7, 2026), 'TB-2026-0007');
  assert.ok(o.isOverdue('pending', '2026-10-11', '2026-10-12'));
  assert.ok(!o.isOverdue('delivered', '2026-10-11', '2026-10-12'));
  assert.ok(!o.isOverdue('pending', '2026-10-12', '2026-10-12'));
});

test('unit conversion is display-only and rounded', () => {
  assert.equal(convert(10, 'in', 'cm'), 25.4);
  assert.equal(convert(25.4, 'cm', 'in'), 10);
});

test('migrations are ordered and run once', async () => {
  assert.deepEqual(MIGRATIONS.map((m) => m.version), [1]);
  const log: string[] = [];
  let applied = 0;
  const db = {
    async execAsync(sql: string) { log.push(sql); if (sql.startsWith('BEGIN')) applied = 1; },
    async getFirstAsync<T>() { return { v: applied || null } as T; },
  };
  assert.equal(await runMigrations(db), 1);
  await runMigrations(db);
  assert.equal(log.filter((s) => s.startsWith('BEGIN')).length, 1);
});

test('measurement parsing and validation', () => {
  assert.equal(parseMeasure('38.5'), 38.5);
  assert.equal(parseMeasure('৩৮'), 38);
  assert.equal(parseMeasure('38,5'), 38.5);
  assert.equal(parseMeasure('abc'), null);
  assert.equal(validateMeasurementFields({}), 'measurement_empty');
  assert.equal(validateMeasurementFields({ chest: { label: 'Chest', value: 0 } }), 'measurement_invalid');
  assert.equal(validateMeasurementFields({ chest: { label: 'Chest', value: 38 } }), null);
});
