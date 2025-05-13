import { Grid } from '@mui/material';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import {
  Arrangement,
  CombinedFamilyInfo,
  Permission,
  ArrangementPhase,
} from '../../GeneratedClient';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { DateDisplayEditorRelative } from './DateDisplayEditorRelative';
import { DateDisplayEditor } from './DateDisplayEditor';

interface ArrangementPlannedDurationProps {
  partneringFamily: CombinedFamilyInfo;
  referralId: string;
  arrangement: Arrangement;
  summaryOnly?: boolean;
  cancelButton?: React.ReactNode;
  startButton?: React.ReactNode;
  endButton?: React.ReactNode;
}

export function ArrangementPlannedDuration({
  partneringFamily,
  referralId,
  arrangement,
  summaryOnly,
  cancelButton,
  startButton,
  endButton,
}: ArrangementPlannedDurationProps) {
  const partneringFamilyId = partneringFamily.family!.id!;
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const referralsModel = useReferralsModel();

  const onDateChange = (
    callback: (
      aggregateId: string,
      referralId: string,
      arrangementId: string,
      plannedStartLocal: Date
    ) => void,
    newDate: Date
  ) => callback(partneringFamilyId, referralId, arrangement.id!, newDate);

  const canEdit = !summaryOnly && permissions(Permission.EditArrangement);

  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid item xs={9}>
        <Grid container spacing={0}>
          <Grid item xs={12}>
            <DateDisplayEditor
              label="Requested at"
              initialValue={arrangement.requestedAtUtc!}
              canEdit={canEdit}
              onChange={(newDate) =>
                onDateChange(referralsModel.editArrangementRequestedAt, newDate)
              }
            />
            {arrangement.phase !== undefined &&
              arrangement.phase <= ArrangementPhase.ReadyToStart &&
              cancelButton}
          </Grid>

          <Grid item xs={12}>
            <DateDisplayEditor
              label="Planned start"
              initialValue={arrangement.plannedStartUtc!}
              canEdit={canEdit}
              onChange={(newDate) =>
                onDateChange(referralsModel.planArrangementStart, newDate)
              }
            />

            {arrangement.phase === ArrangementPhase.ReadyToStart && startButton}
            {arrangement.phase === ArrangementPhase.Started && (
              <DateDisplayEditorRelative
                label="Started"
                initialValue={arrangement.startedAtUtc!}
                onChange={(newDate) => {
                  referralsModel.editArrangementStartTime(
                    partneringFamilyId,
                    referralId,
                    arrangement.id!,
                    newDate
                  );
                }}
              />
            )}
          </Grid>

          <Grid item xs={12}>
            <DateDisplayEditor
              label="Planned end"
              initialValue={arrangement.plannedEndUtc!}
              canEdit={canEdit}
              onChange={(newDate) =>
                onDateChange(referralsModel.planArrangementEnd, newDate)
              }
            />

            {arrangement.phase === ArrangementPhase.Started && endButton}
            {arrangement.phase === ArrangementPhase.Ended && (
              <DateDisplayEditorRelative
                label="Ended"
                initialValue={arrangement.endedAtUtc!}
                onChange={(newDate) => {
                  referralsModel.editArrangementEndTime(
                    partneringFamilyId,
                    referralId,
                    arrangement.id!,
                    newDate
                  );
                }}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
