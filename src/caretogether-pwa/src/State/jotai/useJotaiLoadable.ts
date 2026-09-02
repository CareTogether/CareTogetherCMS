import { atom, type Atom, useAtomValue } from 'jotai';
import { unwrap } from 'jotai/utils';
import { useMemo } from 'react';

export type LoadableState<T> = {
  state: 'loading' | 'hasValue' | 'hasError';
  contents: T;
};

const PENDING = Symbol('pending');
const pendingValue = () => PENDING;

// Provides the app's async atom convention:
// loading values are represented as null, while errors are thrown to the nearest boundary.
export function useJotaiLoadable<T>(targetAtom: Atom<T>): Awaited<T> | null {
  const value = useAtomValue(unwrap(targetAtom, pendingValue));

  return value === PENDING ? null : (value as Awaited<T>);
}

export function useAtomLoadable<T>(
  targetAtom: Atom<T>
): LoadableState<Awaited<T>> {
  const loadableAtom = useMemo(() => {
    const unwrappedAtom = unwrap(targetAtom, pendingValue);

    return atom((get): LoadableState<Awaited<T>> => {
      try {
        const value = get(unwrappedAtom);

        return value === PENDING
          ? { state: 'loading', contents: null as Awaited<T> }
          : { state: 'hasValue', contents: value as Awaited<T> };
      } catch (error) {
        return {
          state: 'hasError',
          contents: error as Awaited<T>,
        };
      }
    });
  }, [targetAtom]);

  return useAtomValue(loadableAtom);
}
