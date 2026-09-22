import { expect, test } from '@playwright/test';
import { CustomField, CustomFieldType } from '../src/GeneratedClient';
import {
  customFieldGridValues,
  formatCustomFieldGridValue,
  toCustomFieldGridValue,
} from '../src/Generic/customFieldValue';
import { buildClientCustomFieldColumns } from '../src/V1Cases/clientsGridColumns';
import { buildReferralCustomFieldColumns } from '../src/V1Referrals/referralsGridColumns';
import { buildVolunteerCustomColumns } from '../src/Volunteers/volunteersGridColumns';

const dateOnlyField = new CustomField({
  name: 'Date only',
  type: CustomFieldType.DateOnly,
});
const dateTimeField = new CustomField({
  name: 'Date and time',
  type: CustomFieldType.DateTime,
});

function requireColumn<T extends { field: string }>(
  columns: T[],
  field: string
): T {
  const column = columns.find((candidate) => candidate.field === field);
  if (column) return column;
  throw new Error(`Missing ${field} column.`);
}

function requireDate(value: unknown): Date {
  if (value instanceof Date) return value;
  throw new Error('Expected a Date grid value.');
}

test('custom field grid values use Date objects and keep DateOnly calendar dates', () => {
  const dateOnly = toCustomFieldGridValue(
    '2026-09-18',
    CustomFieldType.DateOnly
  );
  const dateTime = toCustomFieldGridValue(
    '2026-09-18T17:30:00.000Z',
    CustomFieldType.DateTime
  );

  expect(dateOnly).toBeInstanceOf(Date);
  expect(dateTime).toBeInstanceOf(Date);
  expect(formatCustomFieldGridValue(CustomFieldType.DateOnly, dateOnly)).toBe(
    '9/18/2026'
  );
  expect(requireDate(dateTime).getTime()).toBe(
    new Date('2026-09-18T17:30:00.000Z').getTime()
  );
});

test('malformed custom field dates become null grid values', () => {
  expect(
    toCustomFieldGridValue('2026-02-30', CustomFieldType.DateOnly)
  ).toBeNull();
  expect(
    toCustomFieldGridValue('not-a-timestamp', CustomFieldType.DateTime)
  ).toBeNull();
});

test('browser row adapters preserve semantic custom-field grid values', () => {
  const fields = [dateOnlyField, dateTimeField];
  const result = customFieldGridValues(fields, (field) =>
    field.name === 'Date only' ? '2026-09-18' : '2026-09-18T17:30:00.000Z'
  );

  expect(result['Date only']).toBeInstanceOf(Date);
  expect(result['Date and time']).toBeInstanceOf(Date);

  expect(
    customFieldGridValues(fields, (field) =>
      field.name === 'Date only' ? '2026-02-30' : null
    )['Date only']
  ).toBeNull();
});

test('existing Boolean, String, and StringArray grid values remain unchanged', () => {
  expect(toCustomFieldGridValue(true, CustomFieldType.Boolean)).toBe(true);
  expect(toCustomFieldGridValue('Text', CustomFieldType.String)).toBe('Text');
  expect(
    toCustomFieldGridValue(['First', 'Second'], CustomFieldType.StringArray)
  ).toEqual(['First', 'Second']);
});

test('Clients custom date columns use native date types without reporting or Quick Filter', () => {
  const columns = buildClientCustomFieldColumns(
    [dateOnlyField, dateTimeField],
    'family',
    []
  );
  const dateOnly = requireColumn(columns, 'customField:Date only');
  const dateTime = requireColumn(columns, 'customField:Date and time');

  expect(dateOnly.type).toBe('date');
  expect(dateTime.type).toBe('dateTime');
  expect(dateOnly.pivotable).toBe(false);
  expect(dateOnly.chartable).toBe(false);
  expect(dateOnly.getApplyQuickFilterFn).toBeDefined();
});

test('Referrals custom date columns use native date types without reporting', () => {
  const columns = buildReferralCustomFieldColumns(
    [dateOnlyField, dateTimeField],
    []
  );

  expect(requireColumn(columns, 'referralCustomField:Date only').type).toBe(
    'date'
  );
  expect(requireColumn(columns, 'referralCustomField:Date and time').type).toBe(
    'dateTime'
  );
  expect(
    requireColumn(columns, 'referralCustomField:Date only').chartable
  ).toBe(false);
});

test('Volunteer custom date columns preserve one-family rows and use native date types', () => {
  const columns = buildVolunteerCustomColumns(
    'Volunteer',
    [dateOnlyField, dateTimeField],
    []
  );

  expect(requireColumn(columns, 'volunteerCustomField:Date only').type).toBe(
    'date'
  );
  expect(
    requireColumn(columns, 'volunteerCustomField:Date and time').type
  ).toBe('dateTime');
  expect(columns).toHaveLength(2);
});
