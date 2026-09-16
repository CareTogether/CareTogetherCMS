import { atom } from 'jotai';
import { notAppliedLabel } from './catchAllLabel';
import { filterOption } from './filterOption';
import { roleApprovalStatusFilterOptions } from '../roleApprovalStatusPresentation';

export function buildStatusFilters() {
  const statusFilters: filterOption[] = roleApprovalStatusFilterOptions(
    notAppliedLabel
  ).map((option) => ({
    key: option.label,
    value: option.value,
    selected: false,
  }));
  return statusFilters;
}

export const statusFiltersState = atom(buildStatusFilters());
