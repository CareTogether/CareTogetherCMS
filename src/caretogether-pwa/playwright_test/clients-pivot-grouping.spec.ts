import { expect, test } from '@playwright/test';
import type {
  GridPivotModel,
  GridRenderCellParams,
} from '@mui/x-data-grid-premium';
import { CustomField, CustomFieldType } from '../src/GeneratedClient';
import {
  buildClientCustomFieldColumns,
  buildClientsColumns,
} from '../src/V1Cases/clientsGridColumns';
import {
  clientsPivotRows,
  clientsPivotScope,
} from '../src/V1Cases/clientsPivotScope';
import type { ClientBrowserRowV2 } from '../src/V1Cases/useClientsBrowserViewModel';

function pivotModel(...fields: string[]): GridPivotModel {
  return {
    rows: fields.map((field) => ({ field })),
    columns: [],
    values: [{ field: 'reportCount', aggFunc: 'sum' }],
  };
}

test('pivot field scope chooses one record per entity being counted', () => {
  const rows = [
    { id: 'family', rowKind: 'family', reportCount: 1 },
    { id: 'adult', rowKind: 'adult', reportCount: 1 },
    { id: 'child', rowKind: 'child', reportCount: 1 },
  ] as ClientBrowserRowV2[];

  expect(
    clientsPivotRows(rows, clientsPivotScope(pivotModel('caseStatus')))
  ).toEqual([rows[0]]);
  expect(
    clientsPivotRows(
      rows,
      clientsPivotScope(
        pivotModel('county', 'adultCustomField:Interested in Deliveries')
      )
    )
  ).toEqual([rows[1]]);
  expect(
    clientsPivotRows(
      rows,
      clientsPivotScope(pivotModel('childCustomField:Needs Car Seat'))
    )
  ).toEqual([rows[2]]);
  expect(
    clientsPivotRows(rows, clientsPivotScope(pivotModel('memberType')))
  ).toEqual([rows[1], rows[2]]);
  expect(
    clientsPivotRows(
      rows,
      clientsPivotScope(pivotModel('county'), [
        'adultCustomField:Interested in Deliveries',
      ])
    )
  ).toEqual([rows[1]]);
  expect(
    clientsPivotRows(
      rows,
      clientsPivotScope(
        pivotModel(
          'adultCustomField:Interested in Deliveries',
          'childCustomField:Needs Car Seat'
        )
      )
    )
  ).toEqual([]);
});

test('organization is the final client grid column and supports empty filtering', () => {
  const rows = [
    { organizationNames: ['Downtown Church'] },
    { organizationNames: [] },
  ] as ClientBrowserRowV2[];
  const columns = buildClientsColumns(rows, [], [], [], [], [], []);
  const organizationColumn = columns.find(
    (column) => column.field === 'organizationNames'
  );

  expect(columns.at(-1)?.field).toBe('organizationNames');
  expect(organizationColumn?.valueOptions).toEqual([
    { value: '', label: 'Unassigned' },
    { value: 'Downtown Church', label: 'Downtown Church' },
  ]);
  expect(
    organizationColumn?.filterOperators?.map((operator) => operator.value)
  ).toEqual(expect.arrayContaining(['isEmpty', 'isNotEmpty']));
});

test('family custom fields remain available when counting adults', () => {
  const field = new CustomField({
    name: 'Region',
    type: CustomFieldType.String,
    validValues: ['North'],
  });
  const column = buildClientCustomFieldColumns([field], 'family', []).find(
    (candidate) => candidate.field === 'customField:Region'
  );
  const adult = {
    rowKind: 'adult',
    customFieldValues: { Region: 'North' },
  } as ClientBrowserRowV2;

  expect(column?.groupingValueGetter?.(undefined, adult, column, null!)).toBe(
    'North'
  );
});

test('individual rows show their own values without repeating family cells', () => {
  const family = {
    id: 'family',
    rowKind: 'family',
    family: 'Smith',
    customFieldValues: { Region: 'North' },
  } as ClientBrowserRowV2;
  const adult = {
    id: 'adult',
    rowKind: 'adult',
    family: 'Smith',
    customFieldValues: { Region: 'North' },
    adultCustomFieldValues: { Interest: true },
    arrangementRows: [
      {
        id: 'adult-arrangement',
        arrangementType: 'Hosting',
        statusLabel: 'Started',
      },
    ],
  } as ClientBrowserRowV2;
  const columns = buildClientsColumns(
    [family, adult],
    [],
    [
      new CustomField({
        name: 'Region',
        type: CustomFieldType.String,
        validValues: ['North'],
      }),
    ],
    [],
    [new CustomField({ name: 'Interest', type: CustomFieldType.Boolean })],
    [],
    []
  );
  const render = (field: string, row: ClientBrowserRowV2) => {
    const column = columns.find((candidate) => candidate.field === field);
    expect(column?.renderCell).toBeDefined();
    return column?.renderCell?.({
      row,
      field,
      value: row.family,
      formattedValue: row.family,
    } as GridRenderCellParams<ClientBrowserRowV2>);
  };

  for (const field of [
    'family',
    'county',
    'caseStatus',
    'dateOpened',
    'customField:Region',
  ]) {
    expect(render(field, adult)).toBeNull();
  }
  expect(render('family', family)).not.toBeNull();
  expect(render('adultCustomField:Interest', adult)).not.toBeNull();
  expect(render('arrangements', adult)).not.toBeNull();
});

test('individual custom fields group missing values instead of leaving people ungrouped', () => {
  const field = new CustomField({
    name: 'Interested in Deliveries',
    type: CustomFieldType.Boolean,
  });
  const column = buildClientCustomFieldColumns([field], 'adult', []).find(
    (candidate) =>
      candidate.field === 'adultCustomField:Interested in Deliveries'
  );
  expect(column).toBeDefined();

  const adult = {
    rowKind: 'adult',
    adultCustomFieldValues: { 'Interested in Deliveries': true },
  } as ClientBrowserRowV2;
  const child = {
    rowKind: 'child',
    adultCustomFieldValues: {},
  } as ClientBrowserRowV2;
  const missingAdult = {
    rowKind: 'adult',
    adultCustomFieldValues: { 'Interested in Deliveries': null },
  } as ClientBrowserRowV2;
  const uninterestedAdult = {
    rowKind: 'adult',
    adultCustomFieldValues: { 'Interested in Deliveries': false },
  } as ClientBrowserRowV2;

  expect(column!.groupingValueGetter?.(undefined, adult, column!, null!)).toBe(
    true
  );
  expect(column!.groupingValueGetter?.(undefined, child, column!, null!)).toBe(
    '(No value)'
  );
  expect(
    column!.groupingValueGetter?.(undefined, uninterestedAdult, column!, null!)
  ).toBe(false);
  expect(
    column!.groupingValueGetter?.(undefined, missingAdult, column!, null!)
  ).toBe('(No value)');
});
