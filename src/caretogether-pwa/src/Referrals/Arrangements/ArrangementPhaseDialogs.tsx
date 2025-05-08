import { StartArrangementDialog } from './StartArrangementDialog';
import { CancelArrangementDialog } from './CancelArrangementDialog';
import { EndArrangementDialog } from './EndArrangementDialog';
import { Arrangement } from '../../GeneratedClient';

interface ArrangementPhaseDialogsProps {
  referralId: string;
  arrangement: Arrangement;
  openStart: boolean;
  openCancel: boolean;
  openEnd: boolean;
  onCloseStart: () => void;
  onCloseCancel: () => void;
  onCloseEnd: () => void;
}

export function ArrangementPhaseDialogs({
  referralId,
  arrangement,
  openStart,
  openCancel,
  openEnd,
  onCloseStart,
  onCloseCancel,
  onCloseEnd,
}: ArrangementPhaseDialogsProps) {
  return (
    <>
      {openStart && (
        <StartArrangementDialog
          referralId={referralId}
          arrangement={arrangement}
          onClose={onCloseStart}
        />
      )}

      {openCancel && (
        <CancelArrangementDialog
          referralId={referralId}
          arrangement={arrangement}
          onClose={onCloseCancel}
        />
      )}

      {openEnd && (
        <EndArrangementDialog
          referralId={referralId}
          arrangement={arrangement}
          onClose={onCloseEnd}
        />
      )}
    </>
  );
}
