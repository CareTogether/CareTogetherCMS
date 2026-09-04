import {
  GridLogicOperator,
  type GridFilterModel,
} from '@mui/x-data-grid-premium';
import type { ReferralStatusFilter } from './referralStatusFilter';

export const REFERRAL_COUNTY_BLANK_FILTER_VALUE = '__blank_county__';

export type ReferralsGridFilters = {
  assignmentFilters: ReferralAssignmentGridFilter[];
  countyFilter: (string | null)[];
  logicOperator: ReferralsGridFilterLogicOperator;
  searchText: string;
  statusFilter: ReferralStatusFilter;
};

export type ReferralsGridFilterLogicOperator = 'and' | 'or';

export type ReferralAssignmentGridFilter = {
  assignmentRole: string;
  id?: number | string;
  operator: string;
  value: unknown;
};

const REFERRAL_STATUS_FILTER_FIELD = 'status';
const REFERRAL_STATUS_FILTER_OPERATOR = 'is';
const REFERRAL_COUNTY_FILTER_FIELD = 'county';
const REFERRAL_COUNTY_FILTER_OPERATOR = 'isAnyOf';
const REFERRAL_ASSIGNMENT_FILTER_FIELD_PREFIX = 'assignmentRole:';

export function referralAssignmentFilterField(assignmentRole: string) {
  return `${REFERRAL_ASSIGNMENT_FILTER_FIELD_PREFIX}${assignmentRole}`;
}

function normalizeReferralStatusFilter(
  value: unknown
): ReferralStatusFilter {
  switch (value) {
    case 'OPEN':
    case 'ACCEPTED':
    case 'CLOSED':
      return value;

    default:
      return 'ALL';
  }
}

export function referralStatusFilterFromGridFilterModel(
  filterModel: GridFilterModel
): ReferralStatusFilter {
  const statusFilterItem = filterModel.items.find(
    (item) => item.field === REFERRAL_STATUS_FILTER_FIELD
  );

  return normalizeReferralStatusFilter(statusFilterItem?.value);
}

function countyFilterValueFromGridValue(value: unknown): string | null {
  return value === REFERRAL_COUNTY_BLANK_FILTER_VALUE ? null : String(value);
}

export function countyFilterFromGridFilterModel(
  filterModel: GridFilterModel
): (string | null)[] {
  const countyFilterItem = filterModel.items.find(
    (item) => item.field === REFERRAL_COUNTY_FILTER_FIELD
  );

  if (!Array.isArray(countyFilterItem?.value)) {
    return [];
  }

  return countyFilterItem.value.map(countyFilterValueFromGridValue);
}

function assignmentRoleFromGridFilterField(field: string) {
  return field.startsWith(REFERRAL_ASSIGNMENT_FILTER_FIELD_PREFIX)
    ? field.slice(REFERRAL_ASSIGNMENT_FILTER_FIELD_PREFIX.length)
    : null;
}

function assignmentFiltersFromGridFilterModel(
  filterModel: GridFilterModel
): ReferralAssignmentGridFilter[] {
  return filterModel.items.flatMap((item) => {
    const assignmentRole = assignmentRoleFromGridFilterField(item.field);

    return assignmentRole === null
      ? []
      : [
          {
            assignmentRole,
            id: item.id,
            operator: item.operator,
            value: item.value,
          },
        ];
  });
}

export function referralFiltersFromGridFilterModel(
  filterModel: GridFilterModel
): ReferralsGridFilters {
  return {
    assignmentFilters: assignmentFiltersFromGridFilterModel(filterModel),
    countyFilter: countyFilterFromGridFilterModel(filterModel),
    logicOperator:
      filterModel.logicOperator === GridLogicOperator.Or ? 'or' : 'and',
    searchText: filterModel.quickFilterValues?.join(' ') ?? '',
    statusFilter: referralStatusFilterFromGridFilterModel(filterModel),
  };
}

export function gridFilterModelFromReferralFilters(
  statusFilter: ReferralStatusFilter,
  countyFilter: (string | null)[],
  assignmentFilters: ReferralAssignmentGridFilter[] = [],
  logicOperator: ReferralsGridFilterLogicOperator = 'and',
  searchText = ''
): GridFilterModel {
  const items: GridFilterModel['items'] = assignmentFilters.map(
    (assignmentFilter) => ({
      field: referralAssignmentFilterField(assignmentFilter.assignmentRole),
      id: assignmentFilter.id,
      operator: assignmentFilter.operator,
      value: assignmentFilter.value,
    })
  );

  if (statusFilter !== 'ALL') {
    items.push({
      field: REFERRAL_STATUS_FILTER_FIELD,
      id: REFERRAL_STATUS_FILTER_FIELD,
      operator: REFERRAL_STATUS_FILTER_OPERATOR,
      value: statusFilter,
    });
  }

  if (countyFilter.length > 0) {
    items.push({
      field: REFERRAL_COUNTY_FILTER_FIELD,
      id: REFERRAL_COUNTY_FILTER_FIELD,
      operator: REFERRAL_COUNTY_FILTER_OPERATOR,
      value: countyFilter.map(
        (county) => county ?? REFERRAL_COUNTY_BLANK_FILTER_VALUE
      ),
    });
  }

  return {
    items,
    logicOperator:
      logicOperator === 'or' ? GridLogicOperator.Or : GridLogicOperator.And,
    quickFilterValues: searchText.trim() === '' ? [] : [searchText],
  };
}

export function gridFilterModelFromReferralStatusFilter(
  statusFilter: ReferralStatusFilter
): GridFilterModel {
  return gridFilterModelFromReferralFilters(statusFilter, []);
}
