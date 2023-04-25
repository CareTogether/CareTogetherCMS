import { ChangeEvent, useState } from "react";
import { IFilterOption } from "./IFilterOption";

export function useFilterMenu(ArrangementFilterOptionLabels: string[], defaultOptionLabels: string[] ) {
  const [arrangementFilterOptions, setArrangementFilterOptions] = useState<IFilterOption[]>(
    ArrangementFilterOptionLabels.map(label => {
    return {
      key: label,
      text: label,
      selected: defaultOptionLabels.includes(label)
    }
    })
  );

  const handleFilterArrangements = (event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setArrangementFilterOptions(arrangementFilterOptions.map(o => {
      if (o.text === event.target.name) {
        o.selected = !o.selected;
      }
      return o;
    }));
  }

  return {
    arrangementFilterOptions,
    handleFilterArrangements
  }
}
