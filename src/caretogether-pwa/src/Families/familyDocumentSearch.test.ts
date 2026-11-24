import assert from 'node:assert/strict';
import test from 'node:test';
import { filterFamilyDocumentsByFilename } from './familyDocumentSearch.ts';

const rows = Object.freeze([
  Object.freeze({
    id: 'new',
    uploadedFileName: 'Intake FORM.PDF',
    timestamp: 3,
  }),
  Object.freeze({
    id: 'duplicate',
    uploadedFileName: 'Intake FORM.PDF',
    timestamp: 2,
  }),
  Object.freeze({ id: 'old', uploadedFileName: 'photo.png', timestamp: 1 }),
  Object.freeze({ id: 'missing', uploadedFileName: undefined, timestamp: 0 }),
]);

test('document search matches partial filenames case-insensitively and trims the query', () => {
  assert.deepEqual(
    filterFamilyDocumentsByFilename(rows, '  fOrM.p  '),
    rows.slice(0, 2)
  );
});
test('empty document searches return the complete collection', () => {
  assert.equal(filterFamilyDocumentsByFilename(rows, ''), rows);
  assert.equal(filterFamilyDocumentsByFilename(rows, '   '), rows);
});
test('document search preserves duplicates, order, identity and immutable inputs', () => {
  const result = filterFamilyDocumentsByFilename(rows, 'intake');
  assert.deepEqual(
    result.map((row) => row.id),
    ['new', 'duplicate']
  );
  assert.equal(result[0], rows[0]);
  assert.equal(rows.length, 4);
});
test('missing filenames and no matches are handled safely', () => {
  assert.deepEqual(filterFamilyDocumentsByFilename(rows, 'missing'), []);
  assert.deepEqual(filterFamilyDocumentsByFilename([], 'photo'), []);
});
test('document search does not match unrelated metadata', () => {
  assert.deepEqual(
    filterFamilyDocumentsByFilename(
      [{ uploadedFileName: 'photo.png', source: 'Family' }],
      'Family'
    ),
    []
  );
});
