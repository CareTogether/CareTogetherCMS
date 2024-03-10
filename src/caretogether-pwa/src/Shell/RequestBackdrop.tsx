import { useRecoilValue } from "recoil";
import { showGlobalBackdropData } from "../Hooks/useBackdrop";
import { ProgressBackdrop } from "./ProgressBackdrop";

export default function RequestBackdrop() {
  const showGlobalBackdrop = useRecoilValue(showGlobalBackdropData);

  return (
    <ProgressBackdrop open={showGlobalBackdrop} />
  );
}
