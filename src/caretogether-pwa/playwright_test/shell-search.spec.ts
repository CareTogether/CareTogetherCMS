import { expect, test } from '@playwright/test';
import { normalizeShellSearchText } from '../src/Shell/shellSearch';

test('normalizes repeated whitespace when matching full names', () => {
  expect(normalizeShellSearchText('Alex  Smith')).toBe(
    normalizeShellSearchText('Alex Smith')
  );
});
