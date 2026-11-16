export function functionEligibility(
  original: readonly string[] | null | undefined,
  values: string[],
  edited: boolean
) {
  return original != null || values.length > 0 || edited ? values : undefined;
}
