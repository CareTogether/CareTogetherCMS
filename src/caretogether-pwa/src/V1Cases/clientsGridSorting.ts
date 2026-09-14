import type { GridColDef, GridSortModel } from '@mui/x-data-grid-premium';
import type { ClientBrowserRowV2 } from './useClientsBrowserViewModel';
import type { PartneringFamiliesSortMode } from './PartneringFamilies/sortPartneringFamilies';

export const clientsSortPresets = {
  firstNameAsc: [
    { field: 'firstName', sort: 'asc' },
    { field: 'primaryContactLastName', sort: 'asc' },
    { field: 'familyId', sort: 'asc' },
  ],
  firstNameDesc: [
    { field: 'firstName', sort: 'desc' },
    { field: 'primaryContactLastName', sort: 'desc' },
    { field: 'familyId', sort: 'desc' },
  ],
  lastNameAsc: [
    { field: 'lastName', sort: 'asc' },
    { field: 'familyId', sort: 'asc' },
  ],
  lastNameDesc: [
    { field: 'lastName', sort: 'desc' },
    { field: 'familyId', sort: 'desc' },
  ],
  dateOpenedAsc: [
    { field: 'dateOpened', sort: 'asc' },
    { field: 'primaryContactLastName', sort: 'desc' },
    { field: 'familyId', sort: 'desc' },
  ],
  dateOpenedDesc: [
    { field: 'dateOpened', sort: 'desc' },
    { field: 'primaryContactLastName', sort: 'asc' },
    { field: 'familyId', sort: 'asc' },
  ],
} satisfies Record<PartneringFamiliesSortMode, GridSortModel>;

export function clientsToolbarSortValue(model: GridSortModel) {
  if (model.length === 0) return 'unsorted';

  return (
    (Object.keys(clientsSortPresets) as PartneringFamiliesSortMode[]).find(
      (preset) => {
        const items = clientsSortPresets[preset];
        return (
          items.length === model.length &&
          items.every(
            (item, index) =>
              item.field === model[index].field &&
              item.sort === model[index].sort
          )
        );
      }
    ) ?? 'custom'
  );
}

export function normalizeClientsGridSortModel(
  model: GridSortModel
): GridSortModel {
  const active = model.filter((item) => item.sort);
  const preset = Object.values(clientsSortPresets).find(
    (items) =>
      items[0].field === active[0]?.field && items[0].sort === active[0]?.sort
  );
  if (!preset) {
    return active.filter((item) => !isClientsInternalSortField(item.field));
  }

  return [
    active[0],
    ...active
      .slice(1)
      .filter((item) => !isClientsInternalSortField(item.field)),
    ...preset.slice(1),
  ];
}

export function clientsOpenedAtTime(
  caseDate: Date | string | null | undefined,
  referralDate: Date | string | null | undefined
) {
  for (const value of [caseDate, referralDate]) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (!Number.isNaN(time)) return time;
  }
  return null;
}

function compareNames(first: string, second: string) {
  return first < second ? -1 : first > second ? 1 : 0;
}

const internalColumnOptions = {
  hideable: false,
  filterable: false,
  sortable: false,
  disableColumnMenu: true,
  disableExport: true,
  groupable: false,
  aggregable: false,
  pivotable: false,
  pinnable: false,
  chartable: false,
  getApplyQuickFilterFn: () => null,
};

export const clientsInternalSortColumns: GridColDef<ClientBrowserRowV2>[] = [
  {
    ...internalColumnOptions,
    field: 'primaryContactFirstName',
    sortComparator: compareNames,
  },
  {
    ...internalColumnOptions,
    field: 'primaryContactLastName',
    sortComparator: compareNames,
  },
  {
    ...internalColumnOptions,
    field: 'openedAtTime',
    type: 'number',
    sortComparator: (
      first: number | null | undefined,
      second: number | null | undefined
    ) => {
      if (first === second) return 0;
      if (first == null) return second == null ? 0 : -1;
      if (second == null) return 1;
      return first - second;
    },
  },
  {
    ...internalColumnOptions,
    field: 'familyId',
    sortComparator: (first: string | undefined, second: string | undefined) =>
      (first ?? '').localeCompare(second ?? ''),
  },
];

export function isClientsInternalSortField(field: string) {
  return clientsInternalSortColumns.some((column) => column.field === field);
}

export const clientsInternalSortVisibility = Object.fromEntries(
  clientsInternalSortColumns.map(({ field }) => [field, false])
);

export const clientsGridSortSlotProps = {
  columnsManagement: {
    getTogglableColumns: (columns: GridColDef[]) =>
      columns
        .filter((column) => !isClientsInternalSortField(column.field))
        .map((column) => column.field),
  },
};
