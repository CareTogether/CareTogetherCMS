import type { GridPivotModel } from '@mui/x-data-grid-premium';
import type { ClientBrowserRowV2 } from './useClientsBrowserViewModel';

export type ClientsPivotScope =
  | 'family'
  | 'individual'
  | 'adult'
  | 'child'
  | 'mixed';

export function clientsPivotScope(
  model: GridPivotModel,
  filterFields: string[] = []
): ClientsPivotScope {
  const fields = [
    ...[...model.rows, ...model.columns]
      .filter((item) => !item.hidden)
      .map((item) => item.field),
    ...filterFields,
  ];
  const hasAdultField = fields.some((field) =>
    field.startsWith('adultCustomField:')
  );
  const hasChildField = fields.some((field) =>
    field.startsWith('childCustomField:')
  );

  if (hasAdultField && hasChildField) return 'mixed';
  if (hasAdultField) return 'adult';
  if (hasChildField) return 'child';
  if (fields.includes('memberType')) return 'individual';
  return 'family';
}

export function clientsPivotRows(
  rows: ClientBrowserRowV2[],
  scope: ClientsPivotScope
) {
  return rows.filter((row) => {
    if (scope === 'mixed') return false;
    if (scope === 'individual') return row.rowKind !== 'family';
    return row.rowKind === scope;
  });
}
