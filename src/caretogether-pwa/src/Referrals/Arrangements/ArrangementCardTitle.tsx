import { Button } from '@mui/material';
import { formatRelative } from 'date-fns';
import { useState } from 'react';
import {
  Arrangement,
  ArrangementPhase,
  Permission,
} from '../../GeneratedClient';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { ReopenArrangementDialog } from './ReopenArrangementDialog';
import { DeleteArrangementDialog } from './DeleteArrangementDialog';

type ArrangementCardTitleProps = {
  summaryOnly?: boolean;
  partneringFamilyId: string;
  referralId: string;
  arrangement: Arrangement;
};

export function ArrangementCardTitle({
  summaryOnly,
  partneringFamilyId,
  referralId,
  arrangement,
}: ArrangementCardTitleProps) {
  const now = new Date();
  const permissions = useFamilyIdPermissions(partneringFamilyId);

  const [showReopenArrangementDialog, setShowReopenArrangementDialog] =
    useState(false);
  const [showDeleteArrangementDialog, setShowDeleteArrangementDialog] =
    useState(false);

  return (
    <>
      <span className="ph-unmask">{arrangement.arrangementType}</span>
      {summaryOnly && (
        <span style={{ marginLeft: 40, float: 'right' }}>
          {arrangement.phase === ArrangementPhase.Cancelled
            ? `Cancelled ${formatRelative(arrangement.cancelledAtUtc!, now)}`
            : arrangement.phase === ArrangementPhase.SettingUp
              ? 'Setting up'
              : arrangement.phase === ArrangementPhase.ReadyToStart
                ? 'Ready to start'
                : arrangement.phase === ArrangementPhase.Started
                  ? `Started ${formatRelative(arrangement.startedAtUtc!, now)}`
                  : `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`}
        </span>
      )}
      {!summaryOnly && (
        <span className="ph-unmask" style={{ marginLeft: 0, float: 'right' }}>
          {arrangement.phase === ArrangementPhase.SettingUp && (
            <span>Setting up</span>
          )}

          {permissions(Permission.EditArrangement) &&
            arrangement.phase === ArrangementPhase.Ended && (
              <Button
                variant="outlined"
                size="small"
                style={{ marginLeft: 10 }}
                onClick={() => setShowReopenArrangementDialog(true)}
              >
                Reopen
              </Button>
            )}
          {permissions(Permission.DeleteArrangement) && (
            <Button
              variant="outlined"
              size="small"
              color="warning"
              style={{ marginLeft: 10 }}
              onClick={() => setShowDeleteArrangementDialog(true)}
            >
              Delete
            </Button>
          )}
        </span>
      )}
      {(showReopenArrangementDialog && (
        <ReopenArrangementDialog
          referralId={referralId}
          arrangement={arrangement}
          onClose={() => setShowReopenArrangementDialog(false)}
        />
      )) ||
        null}
      {(showDeleteArrangementDialog && (
        <DeleteArrangementDialog
          referralId={referralId}
          arrangement={arrangement}
          onClose={() => setShowDeleteArrangementDialog(false)}
        />
      )) ||
        null}
    </>
  );
}
