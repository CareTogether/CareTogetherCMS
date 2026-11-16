// Identical timeline entries are valid data (e.g. one requirement completed for two children
// at once), so repeated keys get an occurrence suffix instead of colliding in React.
export function uniqueKeys(keys: string[]): string[] {
  const occurrences = new Map<string, number>();

  return keys.map((key) => {
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    return occurrence === 0 ? key : `${key}:${occurrence}`;
  });
}
