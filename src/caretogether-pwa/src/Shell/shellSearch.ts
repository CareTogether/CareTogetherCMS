export function normalizeShellSearchText(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

export interface ShellSearchableResult {
  normalizedPrimaryContactFirstName: string;
  normalizedPrimaryContactLastName: string;
  normalizedPrimaryContactName: string;
  normalizedOtherNameTexts: string[];
  normalizedSearchText: string;
  phones: string[];
}

export function filterAndRankShellSearchResults<
  T extends ShellSearchableResult,
>(results: T[], inputValue: string, maximumResults: number): T[] {
  if (maximumResults <= 0) return [];

  const query = normalizeShellSearchText(inputValue);
  if (!query) return results.slice(0, maximumResults);

  const queryDigits = query.replace(/[^0-9]/g, '');
  const primaryContactFirstNameMatches: T[] = [];
  const otherPrimaryContactNameMatches: T[] = [];
  const otherNameMatches: T[] = [];
  const otherMatches: T[] = [];

  for (const result of results) {
    if (result.normalizedPrimaryContactFirstName.includes(query)) {
      primaryContactFirstNameMatches.push(result);
      if (primaryContactFirstNameMatches.length >= maximumResults) break;
      continue;
    }

    if (
      result.normalizedPrimaryContactLastName.includes(query) ||
      result.normalizedPrimaryContactName.includes(query)
    ) {
      if (otherPrimaryContactNameMatches.length < maximumResults) {
        otherPrimaryContactNameMatches.push(result);
      }
      continue;
    }

    if (
      result.normalizedOtherNameTexts.some((name) => name.includes(query))
    ) {
      if (otherNameMatches.length < maximumResults) {
        otherNameMatches.push(result);
      }
      continue;
    }

    if (
      result.normalizedSearchText.includes(query) ||
      (queryDigits.length > 0 &&
        result.phones.some((phone) => phone.includes(queryDigits)))
    ) {
      if (otherMatches.length < maximumResults) otherMatches.push(result);
    }
  }

  const primaryContactMatches = primaryContactFirstNameMatches.concat(
    otherPrimaryContactNameMatches.slice(
      0,
      maximumResults - primaryContactFirstNameMatches.length
    )
  );
  const prioritizedNameMatches = primaryContactMatches.concat(
    otherNameMatches.slice(0, maximumResults - primaryContactMatches.length)
  );

  return prioritizedNameMatches.concat(
    otherMatches.slice(0, maximumResults - prioritizedNameMatches.length)
  );
}
