import { expect, test } from '@playwright/test';
import { compareVolunteerFamilyRows } from '../src/Volunteers/volunteersGridColumns';

test('Family sorting preserves volunteer ordering and safely orders Pivot rows', () => {
  expect(
    compareVolunteerFamilyRows(
      { familyLastName: 'Adams', id: 'family-2' },
      { familyLastName: 'Baker', id: 'family-1' },
      'Adams Family',
      'Baker Family',
      'family-2',
      'family-1'
    )
  ).toBeLessThan(0);
  expect(
    compareVolunteerFamilyRows(
      { familyLastName: 'Adams', id: 'family-1' },
      { familyLastName: 'Adams', id: 'family-2' },
      'Adams Family',
      'Adams Family',
      'family-1',
      'family-2'
    )
  ).toBeLessThan(0);
  expect(() =>
    compareVolunteerFamilyRows(
      undefined,
      { familyLastName: 'Adams', id: 'family-1' },
      undefined,
      'Adams Family',
      'pivot-1',
      'family-1'
    )
  ).not.toThrow();
  expect(
    compareVolunteerFamilyRows(
      undefined,
      { familyLastName: 'Adams', id: 'family-1' },
      undefined,
      'Adams Family',
      'pivot-1',
      'family-1'
    )
  ).toBeGreaterThan(0);
  expect(
    compareVolunteerFamilyRows(
      { familyLastName: 'Adams', id: 'family-1' },
      undefined,
      'Adams Family',
      undefined,
      'family-1',
      'pivot-1'
    )
  ).toBeLessThan(0);
  expect(
    compareVolunteerFamilyRows(
      undefined,
      undefined,
      undefined,
      undefined,
      'pivot-1',
      'pivot-2'
    )
  ).toBeLessThan(0);
});
