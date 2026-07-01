import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import Grid from '../../../Generic/GridLegacyCompat';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
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
import { useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../../Model/ConfigurationModel';
import { getFilteredArrangements } from './getFilteredArrangements';
import { useScrollToArrangement } from './useScrollToArrangement';
import { WideTableContainer } from '../../../Utilities/WideTableContainer';
import { containedStickyHeaderTableSx } from '../../../Utilities/stickyHeaderTableSx';
import { ArrangementPhaseSummary } from '../ArrangementPhaseSummary';
import { ArrangementCardDetailsSection } from '../ArrangementCardDetailsSection';
import { useRequirementContextData } from '../useRequirementContextData';
import { PersonName } from '../../../Families/PersonName';
import { FamilyName } from '../../../Families/FamilyName';
import {
  useFamilyLookup,
  usePersonLookup,
} from '../../../Model/DirectoryModel';
import { StartArrangementDialog } from '../StartArrangementDialog';
import { EndArrangementDialog } from '../EndArrangementDialog';
import { CancelArrangementDialog } from '../CancelArrangementDialog';
import { ReopenArrangementDialog } from '../ReopenArrangementDialog';
import { DeleteArrangementDialog } from '../DeleteArrangementDialog';
import { format } from 'date-fns';

type ArrangementSectionProps = {
  v1Case: V1Case;
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  hideTitle?: boolean;
  scrollToArrangementId?: string;
};

type ArrangementTableRowProps = {
  arrangement: Arrangement;
  arrangementPolicy?: ArrangementPolicy;
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  rowRef: (element: HTMLTableRowElement | null) => void;
  v1CaseId: string;
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

function ArrangementActions({
  arrangement,
  permissions,
  v1CaseId,
}: {
  arrangement: Arrangement;
  permissions: (permission: Permission) => boolean;
  v1CaseId: string;
}) {
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

  const canEdit = permissions(Permission.EditArrangement);
  const canDelete = permissions(Permission.DeleteArrangement);

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        {arrangement.phase === ArrangementPhase.SettingUp && canEdit && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowCancelArrangementDialog(true)}
          >
            Cancel
          </Button>
        )}
        {arrangement.phase === ArrangementPhase.ReadyToStart && canEdit && (
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowCancelArrangementDialog(true)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowStartArrangementDialog(true)}
            >
              Start
            </Button>
          </>
        )}
        {arrangement.phase === ArrangementPhase.Started && canEdit && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowEndArrangementDialog(true)}
          >
            End
          </Button>
        )}
        {arrangement.phase === ArrangementPhase.Ended && canEdit && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowReopenArrangementDialog(true)}
          >
            Reopen
          </Button>
        )}
        {canDelete && (
          <Button
            variant="outlined"
            size="small"
            color="warning"
            onClick={() => setShowDeleteArrangementDialog(true)}
          >
            Delete
          </Button>
        )}
      </Stack>
      {showStartArrangementDialog && (
        <StartArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowStartArrangementDialog(false)}
        />
      )}
      {showEndArrangementDialog && (
        <EndArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowEndArrangementDialog(false)}
        />
      )}
      {showCancelArrangementDialog && (
        <CancelArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowCancelArrangementDialog(false)}
        />
      )}
      {showReopenArrangementDialog && (
        <ReopenArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowReopenArrangementDialog(false)}
        />
      )}
      {showDeleteArrangementDialog && (
        <DeleteArrangementDialog
          v1CaseId={v1CaseId}
          arrangement={arrangement}
          onClose={() => setShowDeleteArrangementDialog(false)}
        />
      )}
    </>
  );
}

function ArrangementTableRow({
  arrangement,
  arrangementPolicy,
  family,
  permissions,
  rowRef,
  v1CaseId,
}: ArrangementTableRowProps) {
  const [expanded, setExpanded] = useState(false);
  const personLookup = usePersonLookup();
  const requirementsData = useRequirementContextData(
    arrangement,
    arrangementPolicy,
    family,
    v1CaseId
  );

  return (
    <>
      <TableRow hover ref={rowRef}>
        <TableCell sx={{ width: 48 }}>
          <IconButton
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `Hide ${arrangement.arrangementType} arrangement details`
                : `Show ${arrangement.arrangementType} arrangement details`
            }
            size="small"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell className="ph-unmask">
          {arrangement.arrangementType || '-'}
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
        <TableCell align="right">
          <ArrangementActions
            arrangement={arrangement}
            permissions={permissions}
            v1CaseId={v1CaseId}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, borderBottom: expanded ? 1 : 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2 }}>
              <ArrangementCardDetailsSection
                partneringFamily={family}
                v1CaseId={v1CaseId}
                arrangement={arrangement}
                arrangementPolicy={arrangementPolicy}
                requirementsData={requirementsData}
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
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

  const policy = useRecoilValue(policyData);
  const [
    createArrangementDialogParameter,
    setCreateArrangementDialogParameter,
  ] = useState<ArrangementPolicy | null>(null);

  const filteredArrangements = getFilteredArrangements(v1Case, selectedFilters);
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
                <TableCell />
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Child / Person</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredArrangements.map((arrangement) => {
                const arrangementPolicy =
                  policy.referralPolicy?.arrangementPolicies?.find(
                    (a) => a.arrangementType === arrangement.arrangementType
                  );

                return (
                  <ArrangementTableRow
                    key={arrangement.id}
                    arrangement={arrangement}
                    arrangementPolicy={arrangementPolicy}
                    family={family}
                    permissions={permissions}
                    v1CaseId={v1Case.id!}
                    rowRef={(el) => {
                      if (arrangement.id) {
                        arrangementRefs.current[arrangement.id] =
                          el as unknown as HTMLDivElement | null;
                      }
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
    </Grid>
  );
}
