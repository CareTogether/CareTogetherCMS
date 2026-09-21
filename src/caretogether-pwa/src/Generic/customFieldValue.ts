import { format, isValid } from 'date-fns';
import { CustomFieldType, type CustomField } from '../GeneratedClient';

export type CustomFieldValue =
  | boolean
  | number
  | string
  | string[]
  | null
  | undefined;

export type CustomFieldGridValue = boolean | string | string[] | Date | null;

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnlyApiValue(value: unknown): Date | null {
  if (typeof value !== 'string') return null;

  const match = dateOnlyPattern.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const localDate = new Date(year, month - 1, day);

  return localDate.getFullYear() === year &&
    localDate.getMonth() === month - 1 &&
    localDate.getDate() === day
    ? localDate
    : null;
}

export function formatDateOnlyForApi(value: Date): string | null {
  if (!isValid(value)) return null;

  return [
    value.getFullYear().toString().padStart(4, '0'),
    (value.getMonth() + 1).toString().padStart(2, '0'),
    value.getDate().toString().padStart(2, '0'),
  ].join('-');
}

export function formatDateOnlyForDisplay(value: unknown): string {
  const date = parseDateOnlyApiValue(value);
  return date ? format(date, 'M/d/yyyy') : '';
}

export function parseDateTimeApiValue(value: unknown): Date | null {
  if (typeof value !== 'string') return null;

  const date = new Date(value);
  return isValid(date) ? date : null;
}

export function formatDateTimeForApi(value: Date): string | null {
  return isValid(value) ? value.toISOString() : null;
}

export function formatDateTimeForDisplay(value: unknown): string {
  const date = parseDateTimeApiValue(value);
  return date ? format(date, 'M/d/yyyy h:mm a') : '';
}

export function toCustomFieldGridValue(
  value: unknown,
  type: CustomFieldType
): CustomFieldGridValue {
  if (type === CustomFieldType.Boolean)
    return typeof value === 'boolean' ? value : null;
  if (type === CustomFieldType.StringArray)
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : null;
  if (type === CustomFieldType.DateOnly) return parseDateOnlyApiValue(value);
  if (type === CustomFieldType.DateTime) return parseDateTimeApiValue(value);
  return typeof value === 'string' ? value : null;
}

export function customFieldGridValues(
  fields: CustomField[],
  valueForField: (field: CustomField) => unknown
): Record<string, CustomFieldGridValue> {
  return Object.fromEntries(
    fields.flatMap((field) =>
      field.name
        ? [
            [
              field.name,
              toCustomFieldGridValue(valueForField(field), field.type),
            ],
          ]
        : []
    )
  );
}

export function formatCustomFieldGridValue(
  type: CustomFieldType,
  value: CustomFieldGridValue
): string {
  if (value == null) return '';
  if (type === CustomFieldType.DateOnly)
    return value instanceof Date && isValid(value)
      ? format(value, 'M/d/yyyy')
      : '';
  if (type === CustomFieldType.DateTime)
    return value instanceof Date && isValid(value)
      ? format(value, 'M/d/yyyy h:mm a')
      : '';
  if (value instanceof Date) return '';
  return formatCustomFieldValue(type, value);
}

export function formatCustomFieldValue(
  type: CustomFieldType | undefined,
  value: unknown
): string {
  if (value == null) return '';

  if (type === undefined) {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (Array.isArray(value))
      return value
        .filter((item): item is string => typeof item === 'string')
        .join(', ');
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  }

  if (type === CustomFieldType.Boolean)
    return value === true ? 'Yes' : value === false ? 'No' : '';
  if (type === CustomFieldType.StringArray)
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string')
          .join(', ')
      : '';
  if (type === CustomFieldType.DateOnly) return formatDateOnlyForDisplay(value);
  if (type === CustomFieldType.DateTime) return formatDateTimeForDisplay(value);

  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

export function supportsCustomFieldSuggestions(type: CustomFieldType): boolean {
  return (
    type === CustomFieldType.String || type === CustomFieldType.StringArray
  );
}
