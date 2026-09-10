import {
  GridLogicOperator,
  type GridFilterModel,
} from '@mui/x-data-grid-premium';
import {
  defaultVolunteerStatusFilterOperator,
  type VolunteerStatusFilterOperator,
} from './volunteerStatusFilterOperator';

export const VOLUNTEER_ROLES_FILTER_FIELD = 'roles';
export const VOLUNTEER_STATUS_FILTER_FIELD = 'status';
export const VOLUNTEER_REQUIREMENTS_FILTER_FIELD = 'missingRequirements';

export type VolunteersGridFilterLogicOperator = 'and' | 'or';

export type VolunteersGridFilters = {
  logicOperator: VolunteersGridFilterLogicOperator;
  requirementFilter: string | undefined;
  roleFilters: string[];
  statusFilterOperator: VolunteerStatusFilterOperator;
  statusFilters: string[];
};

const MULTI_VALUE_FILTER_OPERATOR = 'isAnyOf';
const SINGLE_VALUE_FILTER_OPERATOR = 'is';

function stringValuesFromFilterValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  return typeof value === 'string' && value ? [value] : [];
}

function stringValueFromFilterValue(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function filterValueForField(
  filterModel: GridFilterModel,
  field: string
): unknown {
  return filterModel.items.find((item) => item.field === field)?.value;
}

function statusFilterOperatorFromGridFilterModel(
  filterModel: GridFilterModel
): VolunteerStatusFilterOperator {
  const operator = filterModel.items.find(
    (item) => item.field === VOLUNTEER_STATUS_FILTER_FIELD
  )?.operator;

  switch (operator) {
    case 'is':
      return 'is';
    case 'not':
      return 'not';
    case 'isAnyOf':
      return 'isAnyOf';
    default:
      return defaultVolunteerStatusFilterOperator;
  }
}

function logicOperatorFromGridFilterModel(
  filterModel: GridFilterModel
): VolunteersGridFilterLogicOperator {
  return filterModel.logicOperator === GridLogicOperator.Or ? 'or' : 'and';
}

function gridLogicOperatorFromVolunteerFilters(
  logicOperator: VolunteersGridFilterLogicOperator
) {
  return logicOperator === 'or' ? GridLogicOperator.Or : GridLogicOperator.And;
}

export function volunteerFiltersFromGridFilterModel(
  filterModel: GridFilterModel
): VolunteersGridFilters {
  return {
    logicOperator: logicOperatorFromGridFilterModel(filterModel),
    requirementFilter: stringValueFromFilterValue(
      filterValueForField(filterModel, VOLUNTEER_REQUIREMENTS_FILTER_FIELD)
    ),
    roleFilters: stringValuesFromFilterValue(
      filterValueForField(filterModel, VOLUNTEER_ROLES_FILTER_FIELD)
    ),
    statusFilterOperator: statusFilterOperatorFromGridFilterModel(filterModel),
    statusFilters: stringValuesFromFilterValue(
      filterValueForField(filterModel, VOLUNTEER_STATUS_FILTER_FIELD)
    ),
  };
}

export function gridFilterModelFromVolunteerFilters({
  logicOperator,
  requirementFilter,
  roleFilters,
  statusFilterOperator,
  statusFilters,
}: VolunteersGridFilters): GridFilterModel {
  const items: GridFilterModel['items'] = [];

  if (roleFilters.length > 0) {
    items.push({
      field: VOLUNTEER_ROLES_FILTER_FIELD,
      id: VOLUNTEER_ROLES_FILTER_FIELD,
      operator: MULTI_VALUE_FILTER_OPERATOR,
      value: roleFilters,
    });
  }

  if (statusFilters.length > 0) {
    items.push({
      field: VOLUNTEER_STATUS_FILTER_FIELD,
      id: VOLUNTEER_STATUS_FILTER_FIELD,
      operator: statusFilterOperator,
      value:
        statusFilterOperator === MULTI_VALUE_FILTER_OPERATOR
          ? statusFilters
          : statusFilters[0],
    });
  }

  if (requirementFilter) {
    items.push({
      field: VOLUNTEER_REQUIREMENTS_FILTER_FIELD,
      id: VOLUNTEER_REQUIREMENTS_FILTER_FIELD,
      operator: SINGLE_VALUE_FILTER_OPERATOR,
      value: requirementFilter,
    });
  }

  return {
    items,
    logicOperator: gridLogicOperatorFromVolunteerFilters(logicOperator),
  };
}
