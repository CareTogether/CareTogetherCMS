import { expect, test } from '@playwright/test';
import {
  formatCustomFieldValue,
  formatDateOnlyForApi,
  formatDateTimeForApi,
  parseDateOnlyApiValue,
  parseDateTimeApiValue,
} from '../src/Generic/customFieldValue';
import { CustomFieldType } from '../src/GeneratedClient';

function requireDate(value: Date | null): Date {
  if (value) return value;
  throw new Error('Expected a valid date.');
}

test('DateOnly round-trips through a picker date without a timezone shift', () => {
  const apiValue = '2026-09-18';
  const pickerValue = parseDateOnlyApiValue(apiValue);

  expect(pickerValue).not.toBeNull();
  expect(formatDateOnlyForApi(requireDate(pickerValue))).toBe(apiValue);
});

test('DateOnly rejects malformed and impossible calendar dates', () => {
  expect(parseDateOnlyApiValue('2024-02-29')).not.toBeNull();
  expect(parseDateOnlyApiValue('2025-02-29')).toBeNull();
  expect(parseDateOnlyApiValue('2026-02-30')).toBeNull();
  expect(parseDateOnlyApiValue('09/18/2026')).toBeNull();
});

test('custom field formatters always return display strings for semantic dates', () => {
  const dateOnly = formatCustomFieldValue(
    CustomFieldType.DateOnly,
    '2026-09-18'
  );
  const dateTime = formatCustomFieldValue(
    CustomFieldType.DateTime,
    '2026-09-18T17:30:00.000Z'
  );

  expect(dateOnly).toBe('9/18/2026');
  expect(dateTime).not.toBe('2026-09-18T17:30:00.000Z');
  expect(typeof dateOnly).toBe('string');
  expect(typeof dateTime).toBe('string');
});

test('DateTime values preserve the established UTC serialization convention', () => {
  const pickerValue = parseDateTimeApiValue('2026-09-18T17:30:00.000Z');

  expect(pickerValue).not.toBeNull();
  expect(formatDateTimeForApi(requireDate(pickerValue))).toBe(
    '2026-09-18T17:30:00.000Z'
  );
});
