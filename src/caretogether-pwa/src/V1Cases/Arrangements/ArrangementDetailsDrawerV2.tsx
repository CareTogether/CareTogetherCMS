import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { type ReactNode, useState } from 'react';
import {
  ArrangementPhase,
  ChildInvolvement,
  ChildLocationHistoryEntry,
  ChildLocationPlan,
  Permission,
} from '../../GeneratedClient';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { FamilyName } from '../../Families/FamilyName';
import { PersonName } from '../../Families/PersonName';
import {
  useFamilyLookup,
  usePersonLookup,
} from '../../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { ArrangementComments } from './ArrangementComments';
import { ArrangementReason } from './ArrangementReason';
import { ArrangementRowV2 } from './arrangementViewModel';
import { DateDisplayEditor } from './DateDisplayEditor';
import {
  ChildLocationTimeline,
  TrackChildLocationDialog,
} from './TrackChildLocationDialog';
import { format } from 'date-fns';

type ArrangementDetailsDrawerV2Props = {
  row: ArrangementRowV2 | null;
  open: boolean;
  onClose: () => void;
};

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        className="ph-unmask"
        variant="body2"
        sx={{ fontWeight: 600 }}
      >
        {children || '-'}
      </Typography>
    </Box>
  );
}

type DateCommand = (
  aggregateId: string,
  v1CaseId: string,
  arrangementId: string,
  date: Date
) => Promise<void>;

function DateFields({ row }: { row: ArrangementRowV2 }) {
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
    <Stack className="ph-unmask" spacing={0.5}>
      <DateDisplayEditor
        label="Requested"
        initialValue={arrangement.requestedAtUtc}
        canEdit={canEdit}
        availableInCurrentPhase
        onChange={(newDate) =>
          onDateChange(v1CasesModel.editArrangementRequestedAt, newDate)
        }
      />
      <DateDisplayEditor
        label="Cancelled"
        initialValue={arrangement.cancelledAtUtc}
        canEdit={canEdit}
        availableInCurrentPhase={arrangement.phase === ArrangementPhase.Cancelled}
        unavailableTooltip="Only available when the arrangement is cancelled"
        onChange={(newDate) =>
          onDateChange(v1CasesModel.editArrangementCancelledAt, newDate)
        }
      />
      <DateDisplayEditor
        label="Planned start"
        initialValue={arrangement.plannedStartUtc}
        disableFuture={false}
        canEdit={canEdit}
        availableInCurrentPhase
        onChange={(newDate) =>
          onDateChange(v1CasesModel.planArrangementStart, newDate)
        }
      />
      <DateDisplayEditor
        label="Started"
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
      <DateDisplayEditor
        label="Planned end"
        initialValue={arrangement.plannedEndUtc}
        disableFuture={false}
        canEdit={canEdit}
        availableInCurrentPhase
        onChange={(newDate) =>
          onDateChange(v1CasesModel.planArrangementEnd, newDate)
        }
      />
      <DateDisplayEditor
        label="Ended"
        initialValue={arrangement.endedAtUtc}
        canEdit={canEdit}
        availableInCurrentPhase={arrangement.phase === ArrangementPhase.Ended}
        unavailableTooltip="Only available when the arrangement is ended"
        onChange={(newDate) =>
          onDateChange(v1CasesModel.editArrangementEndTime, newDate)
        }
      />
    </Stack>
  );
}

function SummaryFields({ row }: { row: ArrangementRowV2 }) {
  return (
    <Stack spacing={1.15}>
      <DetailField label="Case">{row.caseLabel}</DetailField>
      <DetailField label="Child / Person">{row.childOrPersonLabel}</DetailField>
      <DetailField label="Family">{row.familyLabel}</DetailField>
    </Stack>
  );
}

function ReasonField({ row }: { row: ArrangementRowV2 }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        Arrangement Reason
      </Typography>
      <Typography
        className="ph-unmask"
        component="div"
        variant="body2"
        sx={{ fontWeight: 600 }}
      >
        <ArrangementReason
          arrangement={row.source}
          hideLabel
          partneringFamily={row.partneringFamily}
          v1CaseId={row.v1Case.id!}
        />
      </Typography>
    </Box>
  );
}

function CommentsField({ row }: { row: ArrangementRowV2 }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        Arrangement Comments
      </Typography>
      <Typography
        className="ph-unmask"
        component="div"
        variant="body2"
        sx={{ fontWeight: 600 }}
      >
        <ArrangementComments
          arrangement={row.source}
          partneringFamily={row.partneringFamily}
          v1CaseId={row.v1Case.id!}
        />
      </Typography>
    </Box>
  );
}

function usesChildLocation(row: ArrangementRowV2) {
  return (
    row.arrangementPolicy?.childInvolvement ===
      ChildInvolvement.ChildHousing ||
    row.arrangementPolicy?.childInvolvement ===
      ChildInvolvement.DaytimeChildCareOnly
  );
}

function childLocationPlanLabel(plan?: ChildLocationPlan) {
  if (plan === ChildLocationPlan.DaytimeChildCare) return 'Daytime child care';
  if (plan === ChildLocationPlan.OvernightHousing) return 'Overnight housing';
  if (plan === ChildLocationPlan.WithParent) return 'With parent';
  return '-';
}

function currentLocationEntry(row: ArrangementRowV2) {
  return row.source.childLocationHistory &&
    row.source.childLocationHistory.length > 0
    ? row.source.childLocationHistory[row.source.childLocationHistory.length - 1]
    : undefined;
}

function nextPlannedLocationEntry(row: ArrangementRowV2) {
  const currentLocation = currentLocationEntry(row);

  return row.source.childLocationPlan && row.source.childLocationPlan.length > 0
    ? row.source.childLocationPlan.find(
        (entry) =>
          currentLocation == null ||
          (entry.timestampUtc! > currentLocation.timestampUtc! &&
            entry.childLocationFamilyId !==
              currentLocation.childLocationFamilyId)
      ) ||
        row.source.childLocationPlan
          .slice()
          .reverse()
          .find(
            (entry) =>
              entry.childLocationFamilyId !==
              currentLocation?.childLocationFamilyId
          )
    : undefined;
}

function ChildLocationEntryDetails({
  entry,
  emptyText,
}: {
  entry?: ChildLocationHistoryEntry;
  emptyText: string;
}) {
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  if (!entry) {
    return <EmptyText>{emptyText}</EmptyText>;
  }

  return (
    <Stack spacing={1}>
      <DetailField label="Family">
        <FamilyName family={familyLookup(entry.childLocationFamilyId)} />
      </DetailField>
      <DetailField label="Receiving Adult">
        <PersonName
          person={personLookup(
            entry.childLocationFamilyId,
            entry.childLocationReceivingAdultId
          )}
        />
      </DetailField>
      <DetailField label="Plan Type">
        {childLocationPlanLabel(entry.plan)}
      </DetailField>
      {entry.timestampUtc && (
        <DetailField label="Timestamp">
          {format(entry.timestampUtc, 'M/d/yyyy h:mm a')}
        </DetailField>
      )}
    </Stack>
  );
}

function ChildLocationWorkspace({ row }: { row: ArrangementRowV2 }) {
  const [trackingMode, setTrackingMode] = useState<'record' | 'plan' | null>(
    null
  );
  const [plannedEntryToRecord, setPlannedEntryToRecord] =
    useState<ChildLocationHistoryEntry | null>(null);
  const arrangementHasNotStartedYet =
    row.source.phase === ArrangementPhase.SettingUp ||
    row.source.phase === ArrangementPhase.ReadyToStart ||
    row.source.phase === ArrangementPhase.Cancelled;
  const hasTimelineEntries =
    (row.source.childLocationHistory?.length ?? 0) > 0 ||
    (row.source.childLocationPlan?.length ?? 0) > 0;
  const currentEntry = currentLocationEntry(row);
  const nextPlanEntry = nextPlannedLocationEntry(row);

  const closeTrackingDialog = () => {
    setTrackingMode(null);
    setPlannedEntryToRecord(null);
  };

  if (!usesChildLocation(row)) {
    return (
      <EmptyText>
        Child location tracking is not configured for this arrangement type.
      </EmptyText>
    );
  }

  return (
    <Stack spacing={2.25}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Current Location
        </Typography>
        <ChildLocationEntryDetails
          entry={currentEntry}
          emptyText="No current location has been recorded yet."
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Upcoming Plan
        </Typography>
        <ChildLocationEntryDetails
          entry={nextPlanEntry}
          emptyText="No upcoming move is planned."
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Location Timeline
        </Typography>
        {hasTimelineEntries ? (
          <ChildLocationTimeline
            partneringFamily={row.partneringFamily}
            v1CaseId={row.v1Case.id!}
            arrangement={row.source}
            presentation="drawer"
            recordChildLocationPlan={(entry) => {
              setPlannedEntryToRecord(entry);
              setTrackingMode('record');
            }}
          />
        ) : (
          <EmptyText>
            No location history or planned moves have been recorded yet.
          </EmptyText>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Button
          disabled={arrangementHasNotStartedYet}
          onClick={() => setTrackingMode('record')}
          size="small"
          variant="contained"
        >
          Record Location Change
        </Button>
        <Button
          onClick={() => setTrackingMode('plan')}
          size="small"
          variant="contained"
        >
          Plan Future Change
        </Button>
      </Stack>

      {(trackingMode || plannedEntryToRecord) && (
        <TrackChildLocationDialog
          partneringFamily={row.partneringFamily}
          v1CaseId={row.v1Case.id!}
          arrangement={row.source}
          initialMode={trackingMode ?? undefined}
          initialPlannedEntry={plannedEntryToRecord ?? undefined}
          onClose={closeTrackingDialog}
        />
      )}
    </Stack>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" variant="body2">
      {children}
    </Typography>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Stack spacing={1.25}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="subtitle2">{title}</Typography>
        {action}
      </Stack>
      {children}
    </Stack>
  );
}

export function ArrangementDetailsDrawerV2({
  row,
  open,
  onClose,
}: ArrangementDetailsDrawerV2Props) {
  return (
    <Drawer
      anchor="right"
      aria-labelledby="arrangement-details-title"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 680, md: 1040 },
            p: 2,
            pt: { xs: 7, sm: 8, md: 6 },
          },
        },
      }}
    >
      {row && (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
                variant="caption"
              >
                Arrangement
              </Typography>
              <Typography
                id="arrangement-details-title"
                className="ph-unmask"
                variant="h5"
              >
                {row.arrangementType}
              </Typography>
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: 'space-between',
                  mt: 1,
                }}
              >
                <Chip label={row.statusLabel} size="small" />
              </Box>
            </Box>
            <IconButton
              aria-label="close arrangement details"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: { xs: 2.5, md: 4 },
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
              },
              alignItems: 'start',
            }}
          >
            <Stack spacing={2.25}>
              <Section title="Summary">
                <SummaryFields row={row} />
              </Section>

              <Section title="Timeline">
                <DateFields row={row} />
              </Section>

              <Section title="Reason">
                <ReasonField row={row} />
              </Section>

              <Section title="Comments">
                <CommentsField row={row} />
              </Section>
            </Stack>

            <Stack spacing={2}>
              <Section title="Child Location">
                <ChildLocationWorkspace row={row} />
              </Section>
            </Stack>
          </Box>
        </Stack>
      )}
    </Drawer>
  );
}
