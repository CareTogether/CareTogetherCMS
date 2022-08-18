import { useRecoilValue } from "recoil";
import { showGlobalBackdropData } from "./Hooks/useBackdrop";
import { ProgressBackdrop } from "./Shell/ProgressBackdrop";

export default function RequestBackdrop() {
  const showGlobalBackdrop = useRecoilValue(showGlobalBackdropData);

  return (
    <ProgressBackdrop open={showGlobalBackdrop} />
  );
};
