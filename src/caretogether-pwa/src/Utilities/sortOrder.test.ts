import { alphabeticallyBy } from './sortOrder';

class CustomClass {
  constructor(public customName: string) {}
}

type T = CustomClass | string;

function wrapperHelper(input: T[]) {
  return input.sort(
    alphabeticallyBy((value) => {
      if (value instanceof CustomClass) {
        return value.customName;
      }

      return value;
    })
  );
}

const customFieldA = new CustomClass('A');
const customFieldB = new CustomClass('B');

it('input should equal output if valueA is less than valueB', () => {
  expect(wrapperHelper(['1', '2'])).toStrictEqual(['1', '2']);

  expect(wrapperHelper(['1', '2'])).toStrictEqual(['1', '2']);

  expect(wrapperHelper([customFieldA, customFieldB])).toStrictEqual([
    customFieldA,
    customFieldB,
  ]);

  expect(wrapperHelper([customFieldA, 'B'])).toStrictEqual([customFieldA, 'B']);
});

it('input should be sorted if valueA is greater than valueB', () => {
  expect(wrapperHelper(['3', '2'])).toStrictEqual(['2', '3']);

  expect(wrapperHelper([customFieldB, customFieldA])).toStrictEqual([
    customFieldA,
    customFieldB,
  ]);

  expect(wrapperHelper(['C', customFieldB])).toStrictEqual([customFieldB, 'C']);
});

it('input should equal output if valueA is equal to valueB', () => {
  expect(wrapperHelper(['2', '2'])).toStrictEqual(['2', '2']);

  expect(wrapperHelper([customFieldA, customFieldA])).toStrictEqual([
    customFieldA,
    customFieldA,
  ]);

  expect(wrapperHelper(['B', 'B'])).toStrictEqual(['B', 'B']);
});
