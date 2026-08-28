import { useAtomValue } from 'jotai';
import { showGlobalBackdropData } from '../Hooks/useBackdrop';
import { ProgressBackdrop } from './ProgressBackdrop';

export default function RequestBackdrop() {
  const showGlobalBackdrop = useAtomValue(showGlobalBackdropData);

  return <ProgressBackdrop open={showGlobalBackdrop} />;
}
