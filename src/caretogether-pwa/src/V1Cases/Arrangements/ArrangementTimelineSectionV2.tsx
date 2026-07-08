import { Box, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { ArrangementPhase, Permission } from '../../GeneratedClient';
import { v2Typography } from '../../Families/v2Typography';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { ArrangementRowV2 } from './arrangementViewModel';
import { DateDisplayEditor } from './DateDisplayEditor';

type DateCommand = (
  aggregateId: string,
  v1CaseId: string,
  arrangementId: string,
  date: Date
) => Promise<void>;

function TimelineHeaderCell({ children }: { children: ReactNode }) {
  return (
    <Typography
      color="text.secondary"
      variant="caption"
      sx={{ fontWeight: 600 }}
    >
      {children}
    </Typography>
  );
}

function TimelineRowLabel({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        alignSelf: 'stretch',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        py: 0.75,
      }}
    >
      <Typography {...v2Typography.primaryValue}>
        {children}
      </Typography>
    </Box>
  );
}

function TimelineValueCell({ children }: { children?: ReactNode }) {
  return (
    <Box
      sx={{
        alignSelf: 'stretch',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        py: 0.75,
        '& > div': {
          minWidth: 0,
        },
        '& .MuiTypography-root': {
          fontSize: '1rem',
          lineHeight: 1.35,
        },
      }}
    >
      {children ?? (
        <Typography color="text.disabled" {...v2Typography.browserCell}>
          -
        </Typography>
      )}
    </Box>
  );
}

export function ArrangementTimelineSectionV2({
  row,
}: {
  row: ArrangementRowV2;
}) {
  const arrangement = row.source;
  const partneringFamilyId = row.partneringFamily.family!.id!;
  const v1CaseId = row.v1Case.id!;
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const v1CasesModel = useV1CasesModel();
  const withBackdrop = useBackdrop();
  const canEdit = permissions(Permission.EditArrangement);

  const onDateChange = async (callback: DateCommand, newDate: Date) => {
    await withBackdrop(async () => {
      await callback(partneringFamilyId, v1CaseId, arrangement.id!, newDate);
    });
  };

  return (
    <Box
      className="ph-unmask"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '84px minmax(0, 1fr) minmax(0, 1fr)',
          sm: '112px minmax(0, 1fr) minmax(0, 1fr)',
        },
        columnGap: { xs: 1, sm: 1.5 },
        alignItems: 'stretch',
      }}
    >
      <Box />
      <TimelineHeaderCell>Planned</TimelineHeaderCell>
      <TimelineHeaderCell>Actual</TimelineHeaderCell>

      <TimelineRowLabel>Requested</TimelineRowLabel>
      <TimelineValueCell />
      <TimelineValueCell>
        <DateDisplayEditor
          label="Requested"
          hideDisplayLabel
          initialValue={arrangement.requestedAtUtc}
          canEdit={canEdit}
          availableInCurrentPhase
          onChange={(newDate) =>
            onDateChange(v1CasesModel.editArrangementRequestedAt, newDate)
          }
        />
      </TimelineValueCell>

      <TimelineRowLabel>Start</TimelineRowLabel>
      <TimelineValueCell>
        <DateDisplayEditor
          label="Planned start"
          hideDisplayLabel
          initialValue={arrangement.plannedStartUtc}
          disableFuture={false}
          canEdit={canEdit}
          availableInCurrentPhase
          onChange={(newDate) =>
            onDateChange(v1CasesModel.planArrangementStart, newDate)
          }
        />
      </TimelineValueCell>
      <TimelineValueCell>
        <DateDisplayEditor
          label="Started"
          hideDisplayLabel
          initialValue={arrangement.startedAtUtc}
          canEdit={canEdit}
          availableInCurrentPhase={
            (arrangement.phase || 0) >= ArrangementPhase.Started
          }
          unavailableTooltip="Only available when the arrangement is started"
          onChange={(newDate) =>
            onDateChange(v1CasesModel.editArrangementStartTime, newDate)
          }
        />
      </TimelineValueCell>

      <TimelineRowLabel>End</TimelineRowLabel>
      <TimelineValueCell>
        <DateDisplayEditor
          label="Planned end"
          hideDisplayLabel
          initialValue={arrangement.plannedEndUtc}
          disableFuture={false}
          canEdit={canEdit}
          availableInCurrentPhase
          onChange={(newDate) =>
            onDateChange(v1CasesModel.planArrangementEnd, newDate)
          }
        />
      </TimelineValueCell>
      <TimelineValueCell>
        <DateDisplayEditor
          label="Ended"
          hideDisplayLabel
          initialValue={arrangement.endedAtUtc}
          canEdit={canEdit}
          availableInCurrentPhase={arrangement.phase === ArrangementPhase.Ended}
          unavailableTooltip="Only available when the arrangement is ended"
          onChange={(newDate) =>
            onDateChange(v1CasesModel.editArrangementEndTime, newDate)
          }
        />
      </TimelineValueCell>

      <TimelineRowLabel>Cancelled</TimelineRowLabel>
      <TimelineValueCell />
      <TimelineValueCell>
        <DateDisplayEditor
          label="Cancelled"
          hideDisplayLabel
          initialValue={arrangement.cancelledAtUtc}
          canEdit={canEdit}
          availableInCurrentPhase={
            arrangement.phase === ArrangementPhase.Cancelled
          }
          unavailableTooltip="Only available when the arrangement is cancelled"
          onChange={(newDate) =>
            onDateChange(v1CasesModel.editArrangementCancelledAt, newDate)
          }
        />
      </TimelineValueCell>
    </Box>
  );
}
