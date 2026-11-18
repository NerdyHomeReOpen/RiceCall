import assert from 'node:assert/strict';
import { test } from 'node:test';

const { sorter, getNextSortDirection, getSortIndicator } = await import('@/utils/sorter');

test('sorter orders numbers, strings and dates in either direction', () => {
  assert.deepEqual([{ v: 2 }, { v: 1 }, { v: 3 }].sort(sorter('v')).map((x) => x.v), [1, 2, 3]);
  assert.deepEqual([{ v: 'b' }, { v: 'a' }].sort(sorter('v', -1)).map((x) => x.v), ['b', 'a']);
  const early = new Date(0);
  const late = new Date(1000);
  assert.deepEqual([{ v: late }, { v: early }].sort(sorter('v')).map((x) => x.v), [early, late]);
});

test('sorter keeps mixed or missing values in place', () => {
  assert.equal(sorter('v')({ v: 1 }, { v: 'a' }), 0);
  assert.equal(sorter('v')({}, {}), 0);
});

test('clicking the sorted column again flips the direction, a new column starts descending', () => {
  assert.equal(getNextSortDirection(true, -1), 1);
  assert.equal(getNextSortDirection(true, 1), -1);
  assert.equal(getNextSortDirection(false, 1), -1);
  assert.notEqual(getSortIndicator(true, 1), getSortIndicator(true, -1));
  assert.equal(getSortIndicator(false, 1), getSortIndicator(false, -1));
});
