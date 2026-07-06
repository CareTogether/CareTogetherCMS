import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import Grid from '../../../Generic/GridLegacyCompat';
import {
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Arrangement,
  ArrangementPhase,
  ArrangementPolicy,
  ChildInvolvement,
  CombinedFamilyInfo,
  Permission,
  V1Case,
} from '../../../GeneratedClient';
import { CreateArrangementDialog } from '../CreateArrangementDialog';
import { useMemo, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../../Model/ConfigurationModel';
import { getFilteredArrangements } from './getFilteredArrangements';
import { useScrollToArrangement } from './useScrollToArrangement';
import { WideTableContainer } from '../../../Utilities/WideTableContainer';
import { containedStickyHeaderTableSx } from '../../../Utilities/stickyHeaderTableSx';
import { ArrangementPhaseSummary } from '../ArrangementPhaseSummary';
import { PersonName, personNameString } from '../../../Families/PersonName';
import { FamilyName } from '../../../Families/FamilyName';
import {
  useFamilyLookup,
  usePersonLookup,
} from '../../../Model/DirectoryModel';
import { format } from 'date-fns';
import {
  ArrangementRowV2,
  buildArrangementRowsV2,
} from '../arrangementViewModel';
import { ArrangementDetailsDrawerV2 } from '../ArrangementDetailsDrawerV2';

type ArrangementSectionProps = {
  v1Case: V1Case;
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  hideTitle?: boolean;
  scrollToArrangementId?: string;
};

type ArrangementTableRowProps = {
  arrangement: Arrangement;
  arrangementRow: ArrangementRowV2;
  arrangementPolicy?: ArrangementPolicy;
  family: CombinedFamilyInfo;
  rowRef: (element: HTMLTableRowElement | null) => void;
  onOpenDetails: (row: ArrangementRowV2) => void;
};

function arrangementPhaseLabel(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.SettingUp) return 'Setting up';
  if (phase === ArrangementPhase.ReadyToStart) return 'Ready to start';
  if (phase === ArrangementPhase.Started) return 'Started';
  if (phase === ArrangementPhase.Ended) return 'Ended';
  if (phase === ArrangementPhase.Cancelled) return 'Cancelled';
  return 'Unknown';
}

function arrangementPhaseColor(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.Ended) return 'success';
  if (phase === ArrangementPhase.Cancelled) return 'default';
  if (phase === ArrangementPhase.Started) return 'info';
  return 'warning';
}

function usesChildLocation(arrangementPolicy?: ArrangementPolicy) {
  return (
    arrangementPolicy?.childInvolvement === ChildInvolvement.ChildHousing ||
    arrangementPolicy?.childInvolvement === ChildInvolvement.DaytimeChildCareOnly
  );
}

function formatArrangementDate(date?: Date) {
  return date ? format(date, 'M/d/yyyy') : '-';
}

function ArrangementDurationSummary({
  arrangement,
}: {
  arrangement: Arrangement;
}) {
  const startLabel = arrangement.startedAtUtc ? 'Started' : 'Planned start';
  const startDate = arrangement.startedAtUtc ?? arrangement.plannedStartUtc;
  const endLabel = arrangement.endedAtUtc ? 'Ended' : 'Planned end';
  const endDate = arrangement.endedAtUtc ?? arrangement.plannedEndUtc;

  return (
    <Stack className="ph-unmask" spacing={0.5}>
      <Box>
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
        >
          {startLabel}:&nbsp;
        </Typography>
        <Typography component="span" variant="body2">
          {formatArrangementDate(startDate)}
        </Typography>
      </Box>
      <Box>
        <Typography
          component="span"
          variant="caption"
          color="text.secondary"
        >
          {endLabel}:&nbsp;
        </Typography>
        <Typography component="span" variant="body2">
          {formatArrangementDate(endDate)}
        </Typography>
      </Box>
    </Stack>
  );
}

function ArrangementLocationSummary({
  arrangement,
}: {
  arrangement: Arrangement;
}) {
  const familyLookup = useFamilyLookup();
  const currentLocation =
    arrangement.childLocationHistory &&
    arrangement.childLocationHistory.length > 0
      ? arrangement.childLocationHistory[
          arrangement.childLocationHistory.length - 1
        ]
      : null;
  const nextPlannedLocation =
    arrangement.childLocationPlan && arrangement.childLocationPlan.length > 0
      ? arrangement.childLocationPlan.find(
          (entry) =>
            currentLocation == null ||
            (entry.timestampUtc! > currentLocation.timestampUtc! &&
              entry.childLocationFamilyId !==
                currentLocation.childLocationFamilyId)
        ) ||
        arrangement.childLocationPlan
          .slice()
          .reverse()
          .find(
            (entry) =>
              entry.childLocationFamilyId !== currentLocation?.childLocationFamilyId
          ) ||
        null
      : null;
  const nextPlanIsPastDue =
    nextPlannedLocation && nextPlannedLocation.timestampUtc! < new Date();

  return (
    <Stack spacing={1}>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Current Location
        </Typography>
        <Typography variant="body2">
          {currentLocation ? (
            <FamilyName
              family={familyLookup(currentLocation.childLocationFamilyId)}
            />
          ) : (
            <strong>Location unspecified</strong>
          )}
        </Typography>
      </Box>
      {nextPlannedLocation && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Next Planned Location
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: nextPlanIsPastDue ? 'error.main' : undefined,
              fontWeight: nextPlanIsPastDue ? 600 : undefined,
            }}
          >
            {nextPlanIsPastDue && 'PAST DUE - '}
            <FamilyName
              family={familyLookup(nextPlannedLocation.childLocationFamilyId)}
            />
            &nbsp;on {format(nextPlannedLocation.timestampUtc!, 'M/d/yyyy')}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

function ArrangementTableRow({
  arrangement,
  arrangementRow,
  arrangementPolicy,
  family,
  onOpenDetails,
  rowRef,
}: ArrangementTableRowProps) {
  const personLookup = usePersonLookup();

  return (
    <TableRow
      hover
      ref={rowRef}
      onClick={() => onOpenDetails(arrangementRow)}
      sx={{
        cursor: 'pointer',
        transition: (theme) =>
          theme.transitions.create('background-color', {
            duration: theme.transitions.duration.shortest,
          }),
      }}
    >
      <TableCell className="ph-unmask">
        {arrangement.arrangementType || '-'}
      </TableCell>
      <TableCell className="ph-unmask">
        <Typography variant="body2">{arrangementRow.caseLabel ?? '-'}</Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.75}>
          <Chip
            label={arrangementPhaseLabel(arrangement.phase)}
            color={arrangementPhaseColor(arrangement.phase)}
            size="small"
            sx={{ alignSelf: 'flex-start' }}
          />
          {arrangement.phase !== undefined && arrangement.requestedAtUtc && (
            <ArrangementPhaseSummary
              phase={arrangement.phase}
              requestedAtUtc={arrangement.requestedAtUtc}
              startedAtUtc={arrangement.startedAtUtc}
              endedAtUtc={arrangement.endedAtUtc}
            />
          )}
        </Stack>
      </TableCell>
      <TableCell className="ph-unmask">
        <PersonName
          person={personLookup(
            family.family!.id,
            arrangement.partneringFamilyPersonId
          )}
        />
      </TableCell>
      <TableCell>
        <ArrangementDurationSummary arrangement={arrangement} />
      </TableCell>
      <TableCell className="ph-unmask">
        {usesChildLocation(arrangementPolicy) ? (
          <ArrangementLocationSummary arrangement={arrangement} />
        ) : (
          '-'
        )}
      </TableCell>
    </TableRow>
  );
}

export function ArrangementsSection({
  v1Case,
  family,
  permissions,
  hideTitle = false,
  scrollToArrangementId,
}: ArrangementSectionProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    'Active',
    'Ended',
    'Cancelled',
  ]);
  const [selectedArrangementRowId, setSelectedArrangementRowId] = useState<
    string | null
  >(null);

  const policy = useRecoilValue(policyData);
  const personLookup = usePersonLookup();
  const familyLookup = useFamilyLookup();
  const [
    createArrangementDialogParameter,
    setCreateArrangementDialogParameter,
  ] = useState<ArrangementPolicy | null>(null);

  const filteredArrangements = getFilteredArrangements(v1Case, selectedFilters);
  const arrangementRows = useMemo(
    () =>
      buildArrangementRowsV2({
        arrangements: filteredArrangements,
        arrangementPolicies: policy.referralPolicy?.arrangementPolicies,
        family,
        v1Case,
        personLabel: (familyId, personId) =>
          personNameString(personLookup(familyId, personId)),
        familyLabel: (familyId) => {
          const matchedFamily = familyLookup(familyId);
          const primaryContactPerson = matchedFamily?.family?.adults?.find(
            (adult) =>
              adult.item1?.id ===
              matchedFamily.family?.primaryFamilyContactPersonId
          )?.item1;

          return primaryContactPerson
            ? `${personNameString(primaryContactPerson)} Family`
            : 'Family';
        },
      }),
    [family, familyLookup, filteredArrangements, personLookup, policy, v1Case]
  );
  const selectedArrangementRow = useMemo(
    () =>
      arrangementRows.find((row) => row.id === selectedArrangementRowId) ?? null,
    [arrangementRows, selectedArrangementRowId]
  );
  const arrangementRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useScrollToArrangement(arrangementRefs, scrollToArrangementId);

  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          maxWidth: '100%',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            maxWidth: '100%',
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
            }}
          >
            {!hideTitle && (
              <Typography
                className="ph-unmask"
                variant="h3"
                sx={{ m: 0, display: 'flex', alignItems: 'center' }}
              >
                Arrangements
              </Typography>
            )}

            <ToggleButtonGroup
              value={selectedFilters}
              onChange={(_e, newFilters) => {
                if (newFilters.length > 0) setSelectedFilters(newFilters);
              }}
              aria-label="Arrangement Status Filter"
              size="small"
            >
              <ToggleButton value="Active">Active</ToggleButton>
              <ToggleButton value="Ended">Ended</ToggleButton>
              <ToggleButton value="Cancelled">Cancelled</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        {permissions(Permission.CreateArrangement) && (
          <Box
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              maxWidth: '100%',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {v1Case &&
              policy.referralPolicy?.arrangementPolicies
                ?.filter(
                  (arrangementPolicy) =>
                    !arrangementPolicy.supersededAtUtc ||
                    new Date(arrangementPolicy.supersededAtUtc) > new Date()
                )
                .map((arrangementPolicy) => (
                  <Box key={arrangementPolicy.arrangementType}>
                    <Button
                      className="ph-unmask"
                      onClick={() =>
                        setCreateArrangementDialogParameter(arrangementPolicy)
                      }
                      variant="contained"
                      size="small"
                      startIcon={<AddCircleIcon />}
                    >
                      {arrangementPolicy.arrangementType}
                    </Button>
                  </Box>
                ))}
          </Box>
        )}
      </Box>
      {filteredArrangements.length > 0 && (
        <WideTableContainer>
          <Table
            aria-label="Arrangements"
            stickyHeader
            size="small"
            sx={{ ...containedStickyHeaderTableSx, minWidth: 1100 }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Case</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Child / Person</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {arrangementRows.map((arrangementRow) => {
                const arrangement = arrangementRow.source;
                const arrangementPolicy = arrangementRow.arrangementPolicy;
                const arrangementId = arrangement.id!;

                return (
                  <ArrangementTableRow
                    key={arrangementId}
                    arrangement={arrangement}
                    arrangementRow={arrangementRow}
                    arrangementPolicy={arrangementPolicy}
                    family={family}
                    onOpenDetails={(row) => setSelectedArrangementRowId(row.id)}
                    rowRef={(el) => {
                      arrangementRefs.current[arrangementId] =
                        el as unknown as HTMLDivElement | null;
                    }}
                  />
                );
              })}
            </TableBody>
          </Table>
        </WideTableContainer>
      )}

      {createArrangementDialogParameter && (
        <CreateArrangementDialog
          v1CaseId={`${v1Case!.id}`}
          arrangementPolicy={createArrangementDialogParameter}
          onClose={() => setCreateArrangementDialogParameter(null)}
        />
      )}
      <ArrangementDetailsDrawerV2
        row={selectedArrangementRow}
        open={selectedArrangementRow !== null}
        onClose={() => setSelectedArrangementRowId(null)}
      />
    </Grid>
  );
}
