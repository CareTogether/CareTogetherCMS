import { expect, test } from '@playwright/test';
import { Arrangement, ArrangementPhase } from '../src/GeneratedClient';
import { clientPersonArrangements } from '../src/V1Cases/clientPersonArrangements';

test('individual rows receive only arrangements for that person', () => {
  const adultArrangement = new Arrangement();
  adultArrangement.id = 'adult-arrangement';
  adultArrangement.partneringFamilyPersonId = 'adult-id';
  adultArrangement.phase = ArrangementPhase.Started;

  const childArrangement = new Arrangement();
  childArrangement.id = 'child-arrangement';
  childArrangement.partneringFamilyPersonId = 'child-id';
  childArrangement.phase = ArrangementPhase.SettingUp;

  const arrangements = [adultArrangement, childArrangement];

  expect(clientPersonArrangements(arrangements, 'adult-id')).toEqual([
    adultArrangement,
  ]);
  expect(clientPersonArrangements(arrangements, 'child-id')).toEqual([
    childArrangement,
  ]);
  expect(clientPersonArrangements(arrangements, 'unrelated-id')).toEqual([]);
});
