import { atom, useSetAtom } from 'jotai';

export const showGlobalBackdropData = atom(false);

export function useBackdrop() {
  const setShowGlobalBackdrop = useSetAtom(showGlobalBackdropData);

  return async (asyncFunction: () => Promise<void>) => {
    setShowGlobalBackdrop(true);
    try {
      await asyncFunction();
    } finally {
      setShowGlobalBackdrop(false);
    }
  };
}
