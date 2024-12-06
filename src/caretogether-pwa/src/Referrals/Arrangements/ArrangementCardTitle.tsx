import { Button } from '@mui/material';
import { formatRelative } from 'date-fns';
import { useState } from 'react';
import {
  Arrangement,
  ArrangementPhase,
  Permission,
} from '../../GeneratedClient';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { CancelArrangementDialog } from './CancelArrangementDialog';
import { ReopenArrangementDialog } from './ReopenArrangementDialog';
import { EndArrangementDialog } from './EndArrangementDialog';
import { StartArrangementDialog } from './StartArrangementDialog';
import { useInlineEditor } from '../../Hooks/useInlineEditor';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { DatePicker } from '@mui/x-date-pickers';
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

  const referralsModel = useReferralsModel();

  const startedAtEditor = useInlineEditor(async (value) => {
    await referralsModel.editArrangementStartTime(
      partneringFamilyId,
      referralId,
      arrangement.id!,
      value
    );
  }, arrangement.startedAtUtc);

  const [showStartArrangementDialog, setShowStartArrangementDialog] =
    useState(false);
  const [showEndArrangementDialog, setShowEndArrangementDialog] =
    useState(false);
  const [showCancelArrangementDialog, setShowCancelArrangementDialog] =
    useState(false);
  const [showReopenArrangementDialog, setShowReopenArrangementDialog] =
    useState(false);
  const [showDeleteArrangementDialog, setShowDeleteArrangementDialog] =
    useState(false);

  return (
    <>
      <span>{arrangement.arrangementType}</span>
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
        <span style={{ marginLeft: 0, float: 'right' }}>
          {arrangement.phase === ArrangementPhase.Cancelled ? (
            `Cancelled ${formatRelative(arrangement.cancelledAtUtc!, now)}`
          ) : arrangement.phase === ArrangementPhase.SettingUp ? (
            <>
              Setting up
              {permissions(Permission.EditArrangement) && (
                <Button
                  variant="outlined"
                  size="small"
                  style={{ marginLeft: 10 }}
                  onClick={() => setShowCancelArrangementDialog(true)}
                >
                  Cancel
                </Button>
              )}
            </>
          ) : arrangement.phase === ArrangementPhase.ReadyToStart ? (
            permissions(Permission.EditArrangement) && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  style={{ marginLeft: 10 }}
                  onClick={() => setShowCancelArrangementDialog(true)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  style={{ marginLeft: 10 }}
                  onClick={() => setShowStartArrangementDialog(true)}
                >
                  Start
                </Button>
              </>
            )
          ) : arrangement.phase === ArrangementPhase.Started ? (
            <>
              {permissions(Permission.EditArrangement) ? (
                <>
                  {startedAtEditor.editing ? (
                    <>
                      <DatePicker
                        label="When was this arrangement started?"
                        value={startedAtEditor.value}
                        disableFuture
                        format="M/d/yyyy"
                        onChange={(date: Date | null) =>
                          date && startedAtEditor.setValue(date)
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            sx: { marginTop: 1 },
                          },
                        }}
                      />
                      {startedAtEditor.cancelButton}
                      {startedAtEditor.saveButton}
                    </>
                  ) : (
                    <>
                      <span>
                        Started {formatRelative(arrangement.startedAtUtc!, now)}
                      </span>
                      {startedAtEditor.editButton}
                    </>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    style={{ marginLeft: 10 }}
                    onClick={() => setShowEndArrangementDialog(true)}
                  >
                    End
                  </Button>
                </>
              ) : (
                <span>
                  Started {formatRelative(arrangement.startedAtUtc!, now)}
                </span>
              )}
            </>
          ) : (
            <>
              <span>Ended {formatRelative(arrangement.endedAtUtc!, now)}</span>
              {permissions(Permission.EditArrangement) && (
                <Button
                  variant="outlined"
                  size="small"
                  style={{ marginLeft: 10 }}
                  onClick={() => setShowReopenArrangementDialog(true)}
                >
                  Reopen
                </Button>
              )}
            </>
          )}
          {permissions(Permission.DeleteArrangement) && (
            <>
              <Button
                variant="outlined"
                size="small"
                color="warning"
                style={{ marginLeft: 10 }}
                onClick={() => setShowDeleteArrangementDialog(true)}
              >
                Delete
              </Button>
            </>
          )}
        </span>
      )}
      {(showStartArrangementDialog && (
        <StartArrangementDialog
          referralId={referralId}
          arrangement={arrangement}
          onClose={() => setShowStartArrangementDialog(false)}
        />
      )) ||
        null}
      {(showEndArrangementDialog && (
        <EndArrangementDialog
          referralId={referralId}
          arrangement={arrangement}
          onClose={() => setShowEndArrangementDialog(false)}
        />
      )) ||
        null}
      {(showCancelArrangementDialog && (
        <CancelArrangementDialog
          referralId={referralId}
          arrangement={arrangement}
          onClose={() => setShowCancelArrangementDialog(false)}
        />
      )) ||
        null}
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
