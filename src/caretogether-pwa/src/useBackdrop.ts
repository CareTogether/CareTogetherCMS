import { atom, useRecoilCallback } from "recoil";

export const showGlobalBackdropData = atom({
  key: 'showGlobalBackdropData',
  default: false
});

export function useBackdrop() {
  const showBackdrop = useRecoilCallback(({snapshot, set}) => {
    return async () => {
      set(showGlobalBackdropData, true);
    };
  });
  const hideBackdrop = useRecoilCallback(({snapshot, set}) => {
    return async () => {
      set(showGlobalBackdropData, false);
    };
  });
  return async (asyncFunction: () => Promise<void>) => {
    await showBackdrop();
    try {
      await asyncFunction();
    } finally {
      await hideBackdrop();
    }
  }
}
