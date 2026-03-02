export function getOptionValueFromSelection(
  allOptionKeysPlusSelectedOptionValue: string | string[]
) {
  const optionValue = [...allOptionKeysPlusSelectedOptionValue].filter(
    (s: string) => !isNaN(Number(s))
  )[0];
  return optionValue ? optionValue : undefined;
}
