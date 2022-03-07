import { Backdrop, CircularProgress } from "@mui/material";
import { atom, useRecoilCallback, useRecoilValue } from "recoil";

const showBackdropData = atom({
  key: 'showBackdropData',
  default: false
});

export function useBackdrop() {
  const showBackdrop = useRecoilCallback(({snapshot, set}) => {
    return async () => {
      set(showBackdropData, true);
    };
  });
  const hideBackdrop = useRecoilCallback(({snapshot, set}) => {
    return async () => {
      set(showBackdropData, false);
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

export default function RequestBackdrop() {
  const showBackdrop = useRecoilValue(showBackdropData);

  return (
    <Backdrop
      style={{zIndex: 10000}}
      open={showBackdrop}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};
