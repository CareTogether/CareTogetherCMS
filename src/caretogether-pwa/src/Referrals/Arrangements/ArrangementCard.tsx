import { Card, CardContent, Button, CardHeader } from '@mui/material';
import { useState } from 'react';
import {
  Arrangement,
  CombinedFamilyInfo,
  ArrangementPhase,
} from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { useInlineEditor } from '../../Hooks/useInlineEditor';
import { formatRelative } from 'date-fns';
import { ArrangementPhaseSummary } from './ArrangementPhaseSummary';
import { ArrangementCardTitle } from './ArrangementCardTitle';
import { ArrangementCardHeaderSection } from './ArrangementCardHeaderSection';
import { ArrangementCardDetailsSection } from './ArrangementCardDetailsSection';
import { ArrangementPhaseDialogs } from './ArrangementPhaseDialogs';
import { useRequirementContextData } from './useRequirementContextData';
import { DatePicker } from '@mui/x-date-pickers';

export type ArrangementCardProps = {
  partneringFamily: CombinedFamilyInfo;
  referralId: string;
  arrangement: Arrangement;
  summaryOnly?: boolean;
};

export function ArrangementCard({
  partneringFamily,
  referralId,
  arrangement,
  summaryOnly,
}: ArrangementCardProps) {
  const policy = useRecoilValue(policyData);
  const referralsModel = useReferralsModel();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const partneringFamilyId = partneringFamily.family!.id!;

  const startedAtEditor = useInlineEditor(async (value) => {
    if (value) value.setHours(0, 0, 0, 0);
    await referralsModel.editArrangementStartTime(
      partneringFamilyId,
      referralId,
      arrangement.id!,
      value!
    );
  }, arrangement.startedAtUtc || null);

  const endedAtEditor = useInlineEditor(async (value) => {
    if (value) value.setHours(23, 59, 59, 999);
    await referralsModel.editArrangementEndTime(
      partneringFamilyId,
      referralId,
      arrangement.id!,
      value!
    );
  }, arrangement.endedAtUtc || null);

  const now = new Date();

  const cancelButton =
    !summaryOnly && arrangement.phase === ArrangementPhase.SettingUp ? (
      <Button
        size="small"
        variant="outlined"
        onClick={() => setShowCancelDialog(true)}
        sx={{ ml: 1 }}
      >
        Cancel
      </Button>
    ) : null;

  const startButton = !summaryOnly ? (
    <Button
      size="small"
      variant="contained"
      onClick={() => setShowStartDialog(true)}
      sx={{ ml: 1 }}
    >
      Start
    </Button>
  ) : null;

  const endButton = !summaryOnly ? (
    <Button
      size="small"
      variant="outlined"
      onClick={() => setShowEndDialog(true)}
      sx={{ ml: 1 }}
    >
      End
    </Button>
  ) : null;

  const startedAtLabel =
    arrangement.phase === ArrangementPhase.Started ? (
      startedAtEditor.editing ? (
        <>
          <DatePicker
            label="Started at"
            value={startedAtEditor.value}
            onChange={(value) => startedAtEditor.setValue(value)}
            slotProps={{ textField: { size: 'small', margin: 'none' } }}
          />
          {startedAtEditor.cancelButton}
          {startedAtEditor.saveButton}
        </>
      ) : (
        <>
          {startedAtEditor.value
            ? `Started ${formatRelative(startedAtEditor.value, now)}`
            : '-'}
          {startedAtEditor.editButton}
        </>
      )
    ) : null;

  const endedAtLabel =
    arrangement.phase === ArrangementPhase.Ended ? (
      endedAtEditor.editing ? (
        <>
          <DatePicker
            label="Ended at"
            value={endedAtEditor.value}
            onChange={(value) => endedAtEditor.setValue(value)}
            slotProps={{ textField: { size: 'small', margin: 'none' } }}
          />
          {endedAtEditor.cancelButton}
          {endedAtEditor.saveButton}
        </>
      ) : (
        <>
          {endedAtEditor.value
            ? `Ended ${formatRelative(endedAtEditor.value, now)}`
            : '-'}
          {endedAtEditor.editButton}
        </>
      )
    ) : null;

  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(
    (a) => a.arrangementType === arrangement.arrangementType
  );

  const requirementsData = useRequirementContextData(
    arrangement,
    arrangementPolicy,
    partneringFamily,
    referralId
  );

  return (
    <Card variant="outlined">
      <ArrangementPhaseSummary
        phase={arrangement.phase!}
        requestedAtUtc={arrangement.requestedAtUtc!}
        startedAtUtc={arrangement.startedAtUtc}
        endedAtUtc={arrangement.endedAtUtc}
      />

      <CardHeader
        sx={{
          paddingTop: 0.5,
          paddingBottom: 0,
          '& .MuiCardHeader-title': {
            fontSize: '16px',
          },
        }}
        title={
          <ArrangementCardTitle
            summaryOnly={summaryOnly}
            partneringFamilyId={partneringFamily.family!.id!}
            referralId={referralId}
            arrangement={arrangement}
          />
        }
      />

      <CardContent
        sx={{
          paddingTop: 1,
          paddingBottom: 1,
          '&:last-child': {
            paddingBottom: 0,
          },
        }}
      >
        <ArrangementCardHeaderSection
          partneringFamily={partneringFamily}
          referralId={referralId}
          arrangement={arrangement}
          summaryOnly={summaryOnly}
          arrangementPolicy={arrangementPolicy}
          cancelButton={cancelButton}
          startButton={startButton}
          endButton={endButton}
          startedAtLabel={!summaryOnly ? startedAtLabel : null}
          endedAtLabel={!summaryOnly ? endedAtLabel : null}
        />

        {!summaryOnly && (
          <ArrangementCardDetailsSection
            partneringFamily={partneringFamily}
            referralId={referralId}
            arrangement={arrangement}
            arrangementPolicy={arrangementPolicy}
            requirementsData={requirementsData}
          />
        )}
      </CardContent>

      <ArrangementPhaseDialogs
        referralId={referralId}
        arrangement={arrangement}
        openStart={showStartDialog}
        openCancel={showCancelDialog}
        openEnd={showEndDialog}
        onCloseStart={() => setShowStartDialog(false)}
        onCloseCancel={() => setShowCancelDialog(false)}
        onCloseEnd={() => setShowEndDialog(false)}
      />
    </Card>
  );
}
