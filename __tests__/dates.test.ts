import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, isValidDate, dayBounds, monthBounds } from '../src/domain/dates.ts';

test('date validation and arithmetic', () => {
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2026-10-12'), true);
  assert.equal(isValidDate('12/10/2026'), false);
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

test('day and month bounds are half-open local ranges', () => {
  const [s, e] = dayBounds(new Date(2026, 9, 12, 15, 30));
  assert.equal(s, new Date(2026, 9, 12).toISOString());
  assert.equal(e, new Date(2026, 9, 13).toISOString());
  const [ms, me] = monthBounds(new Date(2026, 11, 20));
  assert.equal(ms, new Date(2026, 11, 1).toISOString());
  assert.equal(me, new Date(2027, 0, 1).toISOString());
});
