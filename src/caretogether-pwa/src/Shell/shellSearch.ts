export function normalizeShellSearchText(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

export interface ShellSearchHighlightRange {
  start: number;
  end: number;
}

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findShellSearchHighlightRange(
  value: string,
  inputValue: string,
  phoneDigits?: string
): ShellSearchHighlightRange | undefined {
  const query = normalizeShellSearchText(inputValue);
  if (!query) return undefined;

  const textPattern = query
    .split(' ')
    .map(escapeRegularExpression)
    .join('\\s+');
  const textMatch = new RegExp(textPattern, 'i').exec(value);
  if (textMatch?.index != null) {
    return {
      start: textMatch.index,
      end: textMatch.index + textMatch[0].length,
    };
  }

  const queryDigits = query.replace(/[^0-9]/g, '');
  if (!phoneDigits || !queryDigits) return undefined;

  const digitStart = phoneDigits.indexOf(queryDigits);
  if (digitStart < 0) return undefined;

  const digitPositions = [...value]
    .map((character, index) => (/\d/.test(character) ? index : -1))
    .filter((index) => index >= 0);
  const firstPosition = digitPositions[digitStart];
  const lastPosition = digitPositions[digitStart + queryDigits.length - 1];
  if (firstPosition == null || lastPosition == null) return undefined;

  return { start: firstPosition, end: lastPosition + 1 };
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
