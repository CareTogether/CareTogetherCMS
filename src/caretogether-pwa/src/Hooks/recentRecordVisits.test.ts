import assert from 'node:assert/strict';
import test from 'node:test';
import { nextRecordVisit } from './recentRecordVisits.ts';

const scope = { organizationId: 'org', locationId: 'location' };
const family = 'family';

test('tracks loaded detail visits once and records later returns', () => {
  assert.equal(nextRecordVisit(null, scope, 'user', family, undefined), null);
  const visit = nextRecordVisit(null, scope, 'user', family, 'family');
  assert.ok(visit);
  assert.equal(nextRecordVisit(visit, scope, 'user', family, 'family'), null);
  const another = nextRecordVisit(visit, scope, 'user', family, 'another');
  assert.ok(another);
  assert.equal(
    nextRecordVisit(another, scope, 'user', family, 'family'),
    visit
  );
});

test('deduplicates only within the same authenticated scope and entity type', () => {
  const visit = nextRecordVisit(null, scope, 'user', family, 'id');
  assert.ok(visit);
  assert.equal(nextRecordVisit(visit, scope, undefined, family, 'id'), null);
  assert.ok(nextRecordVisit(visit, scope, 'another', family, 'id'));
  assert.ok(
    nextRecordVisit(
      visit,
      { ...scope, organizationId: 'another' },
      'user',
      family,
      'id'
    )
  );
  assert.ok(
    nextRecordVisit(
      visit,
      { ...scope, locationId: 'another' },
      'user',
      family,
      'id'
    )
  );
  assert.ok(nextRecordVisit(visit, scope, 'user', 'referral', 'id'));
});
