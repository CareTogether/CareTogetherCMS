import { Box, Button, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
import { type ReactNode, useState } from 'react';
import {
  ArrangementPhase,
  ChildLocationHistoryEntry,
  ChildLocationPlan,
} from '../../GeneratedClient';
import { FamilyName } from '../../Families/FamilyName';
import { PersonName } from '../../Families/PersonName';
import { v2Typography } from '../../Families/v2Typography';
import {
  useFamilyLookup,
  usePersonLookup,
} from '../../Model/DirectoryModel';
import { ArrangementRowV2 } from './arrangementViewModel';
import {
  ChildLocationTimeline,
  TrackChildLocationDialog,
} from './TrackChildLocationDialog';

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
      <Typography component="div" {...v2Typography.primaryValue}>
        {children}
      </Typography>
    </Box>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" variant="body2">
      {children}
    </Typography>
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

export function ChildCareWorkspaceModuleV2({
  row,
}: {
  row: ArrangementRowV2;
}) {
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
