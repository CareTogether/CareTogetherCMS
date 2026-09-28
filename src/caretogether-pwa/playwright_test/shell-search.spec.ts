import { expect, test } from '@playwright/test';
import {
  filterAndRankShellSearchResults,
  findShellSearchHighlightRange,
  normalizeShellSearchText,
} from '../src/Shell/shellSearch';

test('normalizes repeated whitespace when matching full names', () => {
  expect(normalizeShellSearchText('Alex  Smith')).toBe(
    normalizeShellSearchText('Alex Smith')
  );
});

test('finds a case-insensitive text range to highlight', () => {
  expect(findShellSearchHighlightRange('Ashley Johnson', 'John')).toEqual({
    start: 7,
    end: 11,
  });
});

test('finds a digit range across formatted phone punctuation', () => {
  expect(
    findShellSearchHighlightRange('(515) 304-8087', '515304', '5153048087')
  ).toEqual({ start: 1, end: 9 });
});

test('ranks primary-contact matches before household and address matches', () => {
  const addressMatch = {
    id: 'address-match',
    normalizedPrimaryContactFirstName: 'katie',
    normalizedPrimaryContactLastName: 'hommer',
    normalizedPrimaryContactName: 'katie hommer',
    normalizedOtherNameTexts: [],
    normalizedSearchText: 'johnston ia',
    phones: [],
  };
  const householdNameMatch = {
    id: 'household-name-match',
    normalizedPrimaryContactFirstName: 'deborah',
    normalizedPrimaryContactLastName: 'dunn',
    normalizedPrimaryContactName: 'deborah dunn',
    normalizedOtherNameTexts: ['john dunn'],
    normalizedSearchText: 'pella ia',
    phones: [],
  };
  const primaryContactMatch = {
    id: 'primary-contact-match',
    normalizedPrimaryContactFirstName: 'john',
    normalizedPrimaryContactLastName: 'rudd',
    normalizedPrimaryContactName: 'john rudd',
    normalizedOtherNameTexts: [],
    normalizedSearchText: 'ames ia',
    phones: [],
  };

  expect(
    filterAndRankShellSearchResults(
      [addressMatch, householdNameMatch, primaryContactMatch],
      'John',
      100
    )
  ).toEqual([primaryContactMatch, householdNameMatch, addressMatch]);
});

test('ranks primary-contact first-name matches before last-name matches', () => {
  const lastNameMatch = {
    id: 'last-name-match',
    normalizedPrimaryContactFirstName: 'ashley',
    normalizedPrimaryContactLastName: 'johnson',
    normalizedPrimaryContactName: 'ashley johnson',
    normalizedOtherNameTexts: [],
    normalizedSearchText: '',
    phones: [],
  };
  const firstNameMatch = {
    id: 'first-name-match',
    normalizedPrimaryContactFirstName: 'john',
    normalizedPrimaryContactLastName: 'rudd',
    normalizedPrimaryContactName: 'john rudd',
    normalizedOtherNameTexts: [],
    normalizedSearchText: '',
    phones: [],
  };

  expect(
    filterAndRankShellSearchResults(
      [lastNameMatch, firstNameMatch],
      'John',
      100
    )
  ).toEqual([firstNameMatch, lastNameMatch]);
});

test('preserves source order within each shell-search priority group', () => {
  const firstAddressMatch = {
    id: 'first-address-match',
    normalizedPrimaryContactFirstName: 'katie',
    normalizedPrimaryContactLastName: 'hommer',
    normalizedPrimaryContactName: 'katie hommer',
    normalizedOtherNameTexts: [],
    normalizedSearchText: 'johnston ia',
    phones: [],
  };
  const secondAddressMatch = {
    id: 'second-address-match',
    normalizedPrimaryContactFirstName: 'tom',
    normalizedPrimaryContactLastName: 'noteboom',
    normalizedPrimaryContactName: 'tom noteboom',
    normalizedOtherNameTexts: [],
    normalizedSearchText: 'johnston ia',
    phones: [],
  };
  const firstNameMatch = {
    id: 'first-name-match',
    normalizedPrimaryContactFirstName: 'deborah',
    normalizedPrimaryContactLastName: 'dunn',
    normalizedPrimaryContactName: 'deborah dunn',
    normalizedOtherNameTexts: ['john dunn'],
    normalizedSearchText: 'pella ia',
    phones: [],
  };
  const secondNameMatch = {
    id: 'second-name-match',
    normalizedPrimaryContactFirstName: 'catherine',
    normalizedPrimaryContactLastName: 'bierman',
    normalizedPrimaryContactName: 'catherine bierman',
    normalizedOtherNameTexts: ['dominic johnson'],
    normalizedSearchText: 'west des moines ia',
    phones: [],
  };

  expect(
    filterAndRankShellSearchResults(
      [
        firstAddressMatch,
        firstNameMatch,
        secondAddressMatch,
        secondNameMatch,
      ],
      'John',
      100
    )
  ).toEqual([
    firstNameMatch,
    secondNameMatch,
    firstAddressMatch,
    secondAddressMatch,
  ]);
});
