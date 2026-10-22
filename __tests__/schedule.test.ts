import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupSchedule } from '../src/domain/schedule.ts';

test('schedule groups overdue, today and upcoming; ignores finished orders', () => {
  const o = (id: string, status: 'pending' | 'ready' | 'delivered' | 'cancelled', d: string) => ({ id, status, delivery_date: d });
  const g = groupSchedule([o('a', 'pending', '2026-10-10'), o('b', 'ready', '2026-10-12'), o('c', 'pending', '2026-10-15'), o('d', 'pending', '2026-10-13'),
    o('e', 'delivered', '2026-10-09'), o('f', 'cancelled', '2026-10-12'), o('g', 'pending', '2026-12-01')], '2026-10-12');
  assert.deepEqual(g.overdue.map((x) => x.id), ['a']);
  assert.deepEqual(g.today.map((x) => x.id), ['b']);
  assert.deepEqual(g.upcoming.map((x) => x.id), ['d', 'c']);   // sorted, beyond-horizon 'g' excluded
});
