import { Backdrop, CircularProgress } from "@mui/material";
import { useRecoilValue } from "recoil";
import { showGlobalBackdropData } from "./useBackdrop";

export default function RequestBackdrop() {
  const showGlobalBackdrop = useRecoilValue(showGlobalBackdropData);

  return (
    <Backdrop
      style={{zIndex: 10000}}
      open={showGlobalBackdrop}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};
