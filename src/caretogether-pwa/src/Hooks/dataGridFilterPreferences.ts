import {
  getGridBooleanOperators,
  getGridDateOperators,
  getGridNumericOperators,
  getGridSingleSelectOperators,
  getGridStringOperators,
  GridLogicOperator,
  type GridColDef,
  type GridFilterItem,
  type GridFilterModel,
  type GridFilterOperator,
} from '@mui/x-data-grid';

export type JsonSafeValue =
  | boolean
  | number
  | string
  | null
  | JsonSafeValue[]
  | { [key: string]: JsonSafeValue };

export type PersistedGridFilterItem = {
  field: string;
  operator: string;
  value?: JsonSafeValue;
};

export type PersistedDataGridFilters = {
  items: PersistedGridFilterItem[];
  logicOperator: GridLogicOperator;
};

export type PersistedDataGridFilterPreferencesV1 =
  PersistedDataGridFilters & {
    version: 1;
  };

type NormalizeGridFilterModelOptions = {
  isFilterItemValueAllowed?: (
    item: PersistedGridFilterItem,
    column: GridColDef
  ) => boolean;
};

export const dataGridFilterPreferencesVersion = 1 as const;
export const emptyGridFilterModel: GridFilterModel = {
  items: [],
  logicOperator: GridLogicOperator.And,
  quickFilterValues: [],
};
export const emptyPersistedDataGridFilters: PersistedDataGridFilters = {
  items: [],
  logicOperator: GridLogicOperator.And,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonSafeValue(value: unknown): value is JsonSafeValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonSafeValue);
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(isJsonSafeValue);
}

function defaultFilterOperators(column: GridColDef): GridFilterOperator[] {
  switch (column.type) {
    case 'boolean':
      return getGridBooleanOperators();
    case 'date':
      return getGridDateOperators();
    case 'dateTime':
      return getGridDateOperators(true);
    case 'number':
      return getGridNumericOperators();
    case 'singleSelect':
      return getGridSingleSelectOperators();
    default:
      return getGridStringOperators();
  }
}

function filterOperators(column: GridColDef) {
  return column.filterOperators ?? defaultFilterOperators(column);
}

function columnByField(columns: GridColDef[]) {
  return new Map(
    columns
      .filter((column) => column.filterable !== false)
      .map((column) => [column.field, column])
  );
}

function filterItemValueIsPresent(value: unknown) {
  return !(
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function persistedGridFilterItemsFromUnknown(value: unknown) {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        if (
          !isRecord(item) ||
          typeof item.field !== 'string' ||
          typeof item.operator !== 'string'
        ) {
          return [];
        }

        const filterItem: PersistedGridFilterItem = {
          field: item.field,
          operator: item.operator,
        };

        return 'value' in item && isJsonSafeValue(item.value)
          ? [{ ...filterItem, value: item.value }]
          : [filterItem];
      })
    : [];
}

export function persistedDataGridFiltersFromUnknown(
  value: unknown
): PersistedDataGridFilters {
  if (!isRecord(value)) {
    return emptyPersistedDataGridFilters;
  }

  return {
    items: persistedGridFilterItemsFromUnknown(value.items),
    logicOperator:
      value.logicOperator === GridLogicOperator.Or
        ? GridLogicOperator.Or
        : GridLogicOperator.And,
  };
}

export function dataGridFilterPreferencesFromUnknown(
  value: unknown
): PersistedDataGridFilterPreferencesV1 | null {
  if (!isRecord(value) || value.version !== dataGridFilterPreferencesVersion) {
    return null;
  }

  return {
    version: dataGridFilterPreferencesVersion,
    ...persistedDataGridFiltersFromUnknown(value),
  };
}

function normalizeGridFilterItem(
  item: GridFilterItem,
  columnsByField: Map<string, GridColDef>,
  { isFilterItemValueAllowed }: NormalizeGridFilterModelOptions
): PersistedGridFilterItem | null {
  const column = columnsByField.get(item.field);
  if (!column) return null;

  const operator = filterOperators(column).find(
    (filterOperator) => filterOperator.value === item.operator
  );
  if (!operator) return null;

  const requiresFilterValue = operator.requiresFilterValue !== false;
  if (requiresFilterValue && !filterItemValueIsPresent(item.value)) {
    return null;
  }

  const normalizedItem: PersistedGridFilterItem =
    'value' in item && item.value !== undefined
      ? {
          field: item.field,
          operator: item.operator,
          value: item.value,
        }
      : {
          field: item.field,
          operator: item.operator,
        };

  if (
    'value' in normalizedItem &&
    !isJsonSafeValue(normalizedItem.value)
  ) {
    return null;
  }

  if (
    isFilterItemValueAllowed &&
    !isFilterItemValueAllowed(normalizedItem, column)
  ) {
    return null;
  }

  return normalizedItem;
}

export function normalizeGridFilterModel(
  filterModel: GridFilterModel,
  columns: GridColDef[],
  options: NormalizeGridFilterModelOptions = {}
): PersistedDataGridFilters {
  const columnsByField = columnByField(columns);
  const items = filterModel.items.flatMap((item) => {
    const normalizedItem = normalizeGridFilterItem(
      item,
      columnsByField,
      options
    );
    return normalizedItem ? [normalizedItem] : [];
  });

  return {
    items,
    logicOperator:
      filterModel.logicOperator === GridLogicOperator.Or
        ? GridLogicOperator.Or
        : GridLogicOperator.And,
  };
}

export function filterModelHasIncompleteItems(
  filterModel: GridFilterModel,
  columns: GridColDef[]
) {
  const columnsByField = columnByField(columns);

  return filterModel.items.some((item) => {
    const column = columnsByField.get(item.field);
    if (!column) return false;

    const operator = filterOperators(column).find(
      (filterOperator) => filterOperator.value === item.operator
    );
    if (!operator || operator.requiresFilterValue === false) return false;

    return !filterItemValueIsPresent(item.value);
  });
}

export function isSameJsonValue<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function filterModelFromPersistedDataGridFilters(
  preferences: PersistedDataGridFilters
): GridFilterModel {
  return {
    items: preferences.items.map((item, index) => ({
      ...item,
      id: `${item.field}:${item.operator}:${index}`,
    })),
    logicOperator: preferences.logicOperator,
    quickFilterValues: [],
  };
}

export function hasQuickFilterValues(filterModel: GridFilterModel) {
  return (
    filterModel.quickFilterValues?.some(
      (value) => String(value ?? '').trim().length > 0
    ) ?? false
  );
}
