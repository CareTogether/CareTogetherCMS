import { filterOption } from './filterOption';

export function getUpdatedFilters(
  filters: filterOption[],
  optionToUpdate: filterOption
) {
  return filters.map((filter) =>
    filter.key === optionToUpdate.key
      ? { ...filter, selected: !filter.selected }
      : filter
  );
}
