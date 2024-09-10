export function alphabetically(a: string, b: string) {
  if (a < b) return -1;
  if (a > b) return 1;

  return 0;
}

export function alphabeticallyBy<T>(selector: (value: T) => string) {
  return (a: T, b: T) => {
    const valueA = selector(a);
    const valueB = selector(b);

    return alphabetically(valueA, valueB);
  };
}
