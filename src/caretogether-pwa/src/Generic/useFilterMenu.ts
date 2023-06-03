import { ChangeEvent, useState } from "react";
import { IFilterOption } from "./IFilterOption";

export function useFilterMenu(options: string[], initialSelections: string[]) {
  const [filterOptions, setSelectedOptions] = useState<IFilterOption[]>(
    options.map(option => {
      return {
        key: option,
        text: option,
        selected: initialSelections.includes(option)
      }
    }));

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>, _checked: boolean) => {
    setSelectedOptions(filterOptions.map(o => {
      if (o.text === event.target.name) {
        o.selected = !o.selected;
      }
      return o;
    }));
  }

  return {
    filterOptions,
    handleFilterChange
  }
}
