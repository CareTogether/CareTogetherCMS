import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import {
  getGridDateOperators,
  type GridColDef,
} from '@mui/x-data-grid-premium';

const entry = fileURLToPath(
  new URL('./DataGridFilterInputDate.tsx', import.meta.url)
);
const wrapper = fileURLToPath(
  new URL('./PersistedFilterDataGridPremium.tsx', import.meta.url)
);
const result = await build({
  input: 'date-filter-conversions',
  platform: 'node',
  write: false,
  treeshake: { moduleSideEffects: false },
  plugins: [
    {
      name: 'conversion-exports',
      resolveId: (id) =>
        id === 'date-filter-conversions' ? '\0conversions' : undefined,
      load: (id) =>
        id === '\0conversions'
          ? `export { filterDateToPickerValue, pickerValueToFilterDate } from ${JSON.stringify(entry)}; export { getCalendarDayFilterFn } from ${JSON.stringify(wrapper)};`
          : id === entry
            ? `${readFileSync(entry, 'utf8')}\nexport { filterDateToPickerValue, pickerValueToFilterDate };`
            : id === wrapper
              ? `${readFileSync(wrapper, 'utf8')}\nexport { getCalendarDayFilterFn };`
              : undefined,
    },
  ],
  output: { format: 'esm' },
});
const chunk = result.output.find((item) => item.type === 'chunk');
assert.ok(chunk?.type === 'chunk');
const {
  filterDateToPickerValue,
  pickerValueToFilterDate,
  getCalendarDayFilterFn,
} = (await import(
  `data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`
)) as {
  getCalendarDayFilterFn: import('@mui/x-data-grid-premium').GridFilterOperator['getApplyFilterFn'];
  filterDateToPickerValue: (
    value: unknown,
    includeTime: boolean
  ) => Date | null;
  pickerValueToFilterDate: (
    value: Date | null,
    includeTime: boolean
  ) => Date | undefined;
};

test('date filters retain UTC calendar days and timestamp filters retain local calendar days', () => {
  const previousZone = process.env.TZ;
  try {
    for (const zone of [
      'America/Sao_Paulo',
      'America/New_York',
      'Asia/Tokyo',
      'UTC',
    ]) {
      process.env.TZ = zone;
      const selected = new Date(2026, 9, 16);
      const stored = pickerValueToFilterDate(selected, false)!;
      assert.equal(stored.toISOString(), '2026-10-16T00:00:00.000Z');
      for (const input of [
        stored,
        stored.toISOString(),
        '2026-10-16T23:45:00.000Z',
      ]) {
        const restored = filterDateToPickerValue(input, false)!;
        assert.deepEqual(
          [restored.getFullYear(), restored.getMonth(), restored.getDate()],
          [2026, 9, 16]
        );
      }
      const instant = new Date('2026-10-16T23:45:12.000Z');
      assert.equal(
        pickerValueToFilterDate(
          filterDateToPickerValue(instant.toISOString(), true),
          true
        )!.getTime(),
        new Date(instant).setHours(0, 0, 0, 0)
      );
    }
  } finally {
    if (previousZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousZone;
  }
});

test('empty and invalid filters never become invalid Date values', () => {
  for (const input of [null, undefined, '', 'invalid', new Date(NaN), {}]) {
    assert.equal(filterDateToPickerValue(input, false), null);
  }
  assert.equal(pickerValueToFilterDate(null, false), undefined);
  assert.equal(pickerValueToFilterDate(new Date(NaN), true), undefined);
  const historical = filterDateToPickerValue('1800-01-02T00:00:00Z', false)!;
  assert.equal(
    pickerValueToFilterDate(historical, false)!.toISOString(),
    '1800-01-02T00:00:00.000Z'
  );
});

test('converted date-only values preserve every built-in operator boundary', () => {
  for (const includeTime of [false]) {
    const column: GridColDef = {
      field: 'date',
      type: includeTime ? 'dateTime' : 'date',
    };
    const nativeValue = new Date(
      includeTime ? '2026-10-16T13:30' : '2026-10-16'
    );
    const converted = pickerValueToFilterDate(
      filterDateToPickerValue(nativeValue, includeTime),
      includeTime
    );
    for (const operator of getGridDateOperators(includeTime)) {
      const nativeFilter: ReturnType<typeof operator.getApplyFilterFn> =
        operator.getApplyFilterFn(
          { field: 'date', operator: operator.value, value: nativeValue },
          column
        )!;
      const pickerFilter: ReturnType<typeof operator.getApplyFilterFn> =
        operator.getApplyFilterFn(
          { field: 'date', operator: operator.value, value: converted },
          column
        )!;
      for (const value of [
        null,
        new Date(2026, 9, 15),
        new Date(2026, 9, 16),
        new Date(2026, 9, 16, 13, 30),
        new Date(2026, 9, 16, 13, 30, 30),
        new Date(2026, 9, 17),
      ]) {
        assert.equal(
          pickerFilter(value!, {}, column, { current: undefined! }),
          nativeFilter(value!, {}, column, { current: undefined! }),
          operator.value
        );
      }
    }
  }
});

test('timestamp calendar-day operators include correct boundaries in local zones and DST', () => {
  const previousZone = process.env.TZ;
  try {
    for (const zone of [
      'America/Sao_Paulo',
      'America/New_York',
      'Asia/Tokyo',
      'UTC',
    ]) {
      process.env.TZ = zone;
      for (const [month, day] of [
        [9, 21],
        [2, 8],
        [10, 1],
      ]) {
        const start = new Date(2026, month, day);
        const next = new Date(2026, month, day + 1);
        if (zone === 'America/New_York' && month !== 9) {
          assert.equal(
            (next.getTime() - start.getTime()) / 3600000,
            month === 2 ? 23 : 25
          );
        }
        const expected: Record<string, boolean[]> = {
          is: [false, true, true, true, false],
          not: [true, false, false, false, true],
          before: [true, false, false, false, false],
          after: [false, false, false, false, true],
          onOrBefore: [true, true, true, true, false],
          onOrAfter: [false, true, true, true, true],
        };
        for (const [operator, matches] of Object.entries(expected)) {
          for (const restored of [
            new Date(2026, month, day, 17, 30),
            new Date(2026, month, day, 17, 30).toISOString(),
          ]) {
            const column: GridColDef = { field: 'date', type: 'dateTime' };
            const predicate = getCalendarDayFilterFn(
              { field: 'date', operator, value: restored },
              column
            )!;
            const rows = [
              new Date(start.getTime() - 1),
              start,
              new Date(2026, month, day, 12),
              new Date(next.getTime() - 1),
              next,
            ];
            assert.deepEqual(
              rows.map((value) =>
                predicate(value, {}, column, { current: undefined! })
              ),
              matches,
              zone + ' ' + operator
            );
            for (const invalid of [null, undefined, new Date(NaN)]) {
              assert.equal(
                predicate(invalid, {}, column, { current: undefined! }),
                false
              );
            }
          }
        }
      }
    }
  } finally {
    if (previousZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousZone;
  }
});

test('cleared, invalid, and input-free timestamp filters do not create predicates', () => {
  for (const value of [null, undefined, '', 'invalid', new Date(NaN)]) {
    assert.equal(
      getCalendarDayFilterFn(
        { field: 'date', operator: 'is', value },
        { field: 'date' }
      ),
      null
    );
  }
  for (const operator of ['isEmpty', 'isNotEmpty', 'custom']) {
    assert.equal(
      getCalendarDayFilterFn(
        { field: 'date', operator, value: new Date() },
        { field: 'date' }
      ),
      null
    );
  }
});
