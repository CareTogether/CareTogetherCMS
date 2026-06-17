export function sortByPolicyOrder(values: string[], validValues: string[]): string[] {
  return [...values].sort((a, b) => {
    const aIndex = validValues.indexOf(a);
    const bIndex = validValues.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}
