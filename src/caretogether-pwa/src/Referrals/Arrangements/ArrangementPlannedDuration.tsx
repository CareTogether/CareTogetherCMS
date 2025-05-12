import { Grid } from '@mui/material';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useInlineEditor } from '../../Hooks/useInlineEditor';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Arrangement,
  CombinedFamilyInfo,
  Permission,
  ArrangementPhase,
} from '../../GeneratedClient';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { format } from 'date-fns';
import { DateDisplayEditorRelative } from './DateDisplayEditorRelative';

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

  const requestedAtEditor = useInlineEditor(async (value) => {
    await referralsModel.editArrangementRequestedAt(
      partneringFamilyId,
      referralId,
      arrangement.id!,
      value!
    );
  }, arrangement.requestedAtUtc || null);

  const plannedStartEditor = useInlineEditor(async (value) => {
    await referralsModel.planArrangementStart(
      partneringFamilyId,
      referralId,
      arrangement.id!,
      value
    );
  }, arrangement.plannedStartUtc || null);

  const plannedEndEditor = useInlineEditor(async (value) => {
    await referralsModel.planArrangementEnd(
      partneringFamilyId,
      referralId,
      arrangement.id!,
      value
    );
  }, arrangement.plannedEndUtc || null);

  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid item xs={9}>
        <Grid container spacing={0}>
          <Grid item xs={12}>
            Requested at:&nbsp;
            {!summaryOnly && permissions(Permission.EditArrangement) ? (
              requestedAtEditor.editing ? (
                <>
                  <DatePicker
                    label="Requested at"
                    value={requestedAtEditor.value}
                    onChange={(value: Date | null) =>
                      requestedAtEditor.setValue(value)
                    }
                    slotProps={{ textField: { size: 'small', margin: 'none' } }}
                  />
                  {requestedAtEditor.cancelButton}
                  {requestedAtEditor.saveButton}
                </>
              ) : (
                <>
                  {requestedAtEditor.value
                    ? format(requestedAtEditor.value, 'M/d/yyyy')
                    : '-'}
                  {requestedAtEditor.editButton}
                </>
              )
            ) : (
              <>
                {requestedAtEditor.value
                  ? format(requestedAtEditor.value, 'M/d/yyyy')
                  : '-'}
              </>
            )}
            {arrangement.phase !== undefined &&
              arrangement.phase <= ArrangementPhase.ReadyToStart &&
              cancelButton}
          </Grid>

          <Grid item xs={12}>
            Planned start:&nbsp;
            {!summaryOnly && permissions(Permission.EditArrangement) ? (
              plannedStartEditor.editing ? (
                <>
                  <DatePicker
                    label="Planned start"
                    value={plannedStartEditor.value}
                    onChange={(value: Date | null) =>
                      plannedStartEditor.setValue(value)
                    }
                    slotProps={{ textField: { size: 'small', margin: 'none' } }}
                  />
                  {plannedStartEditor.cancelButton}
                  {plannedStartEditor.saveButton}
                </>
              ) : (
                <>
                  {plannedStartEditor.value
                    ? format(plannedStartEditor.value, 'M/d/yyyy')
                    : '-'}
                  {plannedStartEditor.editButton}
                </>
              )
            ) : (
              <>
                {plannedStartEditor.value
                  ? format(plannedStartEditor.value, 'M/d/yyyy')
                  : '-'}
              </>
            )}
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
            Planned end:&nbsp;
            {!summaryOnly && permissions(Permission.EditArrangement) ? (
              plannedEndEditor.editing ? (
                <>
                  <DatePicker
                    label="Planned end"
                    value={plannedEndEditor.value}
                    onChange={(value: Date | null) =>
                      plannedEndEditor.setValue(value)
                    }
                    slotProps={{ textField: { size: 'small', margin: 'none' } }}
                  />
                  {plannedEndEditor.cancelButton}
                  {plannedEndEditor.saveButton}
                </>
              ) : (
                <>
                  {plannedEndEditor.value
                    ? format(plannedEndEditor.value, 'M/d/yyyy')
                    : '-'}
                  {plannedEndEditor.editButton}
                </>
              )
            ) : (
              <>
                {plannedEndEditor.value
                  ? format(plannedEndEditor.value, 'M/d/yyyy')
                  : '-'}
              </>
            )}
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
