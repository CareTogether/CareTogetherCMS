import assert from 'node:assert/strict';
import test from 'node:test';
import { uniqueKeys } from './uniqueKeys.ts';

test('keeps keys that are already unique', () => {
  assert.deepEqual(uniqueKeys(['a', 'b']), ['a', 'b']);
});

test('gives repeated keys a unique suffix', () => {
  const keys = uniqueKeys(['a', 'b', 'a', 'a']);

  assert.deepEqual(keys, ['a', 'b', 'a:1', 'a:2']);
  assert.equal(new Set(keys).size, keys.length);
});

test('handles an empty list', () => {
  assert.deepEqual(uniqueKeys([]), []);
});
