export type CustomFieldFilterValue = string | boolean | null;

export type CustomFieldFilterOption = {
  key: string;
  value: CustomFieldFilterValue;
  selected: boolean;
};

export type CustomFieldFilterSelectionsByField = Record<
  string,
  CustomFieldFilterValue[]
>;
