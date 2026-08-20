import type { Atom } from 'jotai';
import { useAtomValue } from 'jotai';
import { loadable } from 'jotai/utils';

export type LoadableState<T> = {
  state: 'loading' | 'hasValue' | 'hasError';
  contents: T;
};

// Provides the app's async atom convention:
// loading values are represented as null, while errors are thrown to the nearest boundary.
export function useJotaiLoadable<T>(targetAtom: Atom<T>): Awaited<T> | null {
  const loadableValue = useAtomValue(loadable(targetAtom));

  if (loadableValue.state === 'loading') {
    return null;
  }

  if (loadableValue.state === 'hasError') {
    throw loadableValue.error;
  }

  return loadableValue.data as Awaited<T>;
}

export function useAtomLoadable<T>(
  targetAtom: Atom<T>
): LoadableState<Awaited<T>> {
  const loadableValue = useAtomValue(loadable(targetAtom));

  if (loadableValue.state === 'loading') {
    return { state: 'loading', contents: null as Awaited<T> };
  }

  if (loadableValue.state === 'hasError') {
    return {
      state: 'hasError',
      contents: loadableValue.error as Awaited<T>,
    };
  }

  return { state: 'hasValue', contents: loadableValue.data as Awaited<T> };
}
