import { Box, Grid, Stack } from '@mui/material';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import {
  Arrangement,
  CombinedFamilyInfo,
  Permission,
  ArrangementPhase,
} from '../../GeneratedClient';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { DateDisplayEditor } from './DateDisplayEditor';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { format } from 'date-fns';

interface ArrangementPlannedDurationProps {
  partneringFamily: CombinedFamilyInfo;
  referralId: string;
  arrangement: Arrangement;
  summaryOnly?: boolean;
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <Grid
      item
      p={1}
      xs={12}
      lg={6}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      border="1px solid"
      borderColor="grey.200"
    >
      <div className="ph-unmask">{children}</div>
    </Grid>
  );
}

export function ArrangementPlannedDuration({
  partneringFamily,
  referralId,
  arrangement,
  summaryOnly,
}: ArrangementPlannedDurationProps) {
  const partneringFamilyId = partneringFamily.family!.id!;
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const referralsModel = useReferralsModel();

  const withBackdrop = useBackdrop();

  const onDateChange = async (
    callback: (
      aggregateId: string,
      referralId: string,
      arrangementId: string,
      plannedStartLocal: Date
    ) => Promise<void>,
    newDate: Date
  ) =>
    await withBackdrop(async () => {
      await callback(partneringFamilyId, referralId, arrangement.id!, newDate);
    });

  const canEdit = !summaryOnly && permissions(Permission.EditArrangement);

  if (summaryOnly) {
    return (
      <Stack className="ph-unmask" direction="column" sx={{ clear: 'both' }}>
        <Box>
          <span>Planned start:&nbsp;</span>
          {arrangement.plannedStartUtc
            ? format(arrangement.plannedStartUtc, 'M/d/yyyy')
            : '-'}
        </Box>
        <Box>
          <span>Planned end:&nbsp;</span>
          {arrangement.plannedEndUtc
            ? format(arrangement.plannedEndUtc, 'M/d/yyyy')
            : '-'}
        </Box>
      </Stack>
    );
  }

  return (
    <Grid
      container
      spacing={0}
      mt={6}
      mb={1}
      sx={{ border: '1px solid', borderColor: 'grey.200' }}
    >
      <Cell>
        <DateDisplayEditor
          label="Requested at"
          initialValue={arrangement.requestedAtUtc!}
          canEdit={canEdit}
          availableInCurrentPhase // Available in all phases
          onChange={(newDate) =>
            onDateChange(referralsModel.editArrangementRequestedAt, newDate)
          }
        />
      </Cell>

      <Cell>
        <DateDisplayEditor
          label="Cancelled at"
          initialValue={arrangement.cancelledAtUtc!}
          canEdit={canEdit}
          availableInCurrentPhase={
            arrangement.phase === ArrangementPhase.Cancelled
          }
          unavailableTooltip="Only available when the arrangement is cancelled"
          onChange={(newDate) =>
            onDateChange(referralsModel.editArrangementCancelledAt, newDate)
          }
        />
      </Cell>

      <Cell>
        <DateDisplayEditor
          label="Planned start"
          initialValue={arrangement.plannedStartUtc!}
          disableFuture={false}
          canEdit={canEdit}
          availableInCurrentPhase // Available in all phases
          onChange={(newDate) =>
            onDateChange(referralsModel.planArrangementStart, newDate)
          }
        />
      </Cell>

      <Cell>
        <DateDisplayEditor
          label="Started at"
          initialValue={arrangement.startedAtUtc!}
          canEdit={canEdit}
          availableInCurrentPhase={
            (arrangement.phase || 0) >= ArrangementPhase.Started
          }
          unavailableTooltip="Only available when the arrangement is started"
          onChange={(newDate) =>
            onDateChange(referralsModel.editArrangementStartTime, newDate)
          }
        />
      </Cell>

      <Cell>
        <DateDisplayEditor
          label="Planned end"
          initialValue={arrangement.plannedEndUtc!}
          disableFuture={false}
          canEdit={canEdit}
          availableInCurrentPhase // Available in all phases
          onChange={(newDate) =>
            onDateChange(referralsModel.planArrangementEnd, newDate)
          }
        />
      </Cell>

      <Cell>
        <DateDisplayEditor
          label="Ended at"
          initialValue={arrangement.endedAtUtc!}
          canEdit={canEdit}
          availableInCurrentPhase={arrangement.phase === ArrangementPhase.Ended}
          unavailableTooltip="Only available when the arrangement is ended"
          onChange={(newDate) =>
            onDateChange(referralsModel.editArrangementEndTime, newDate)
          }
        />
      </Cell>
    </Grid>
  );
}
