import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FamilyVolunteerAssignment,
  FunctionRequirement,
  IndividualVolunteerAssignment,
  Permission,
} from '../../GeneratedClient';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import type {
  ArrangementFunctionSummaryV2,
  ArrangementRowV2,
} from './arrangementViewModel';
import { AssignmentLabel } from './ArrangementAssignmentPresentationV2';
import {
  assignmentActionLabel,
  assignmentMetadataChips,
  assignmentSummary,
} from './arrangementAssignmentPresentationHelpersV2';
import {
  useArrangementFunctionCandidateAssignees,
  type ArrangementFunctionCandidateAssignee,
} from './useArrangementFunctionCandidateAssignees';

type ArrangementParticipantManagementDrawerV2Props = {
  functionSummary: ArrangementFunctionSummaryV2 | null;
  functionSummaries?: ArrangementFunctionSummaryV2[];
  row: ArrangementRowV2 | null;
  open: boolean;
  onClose: () => void;
};

type ArrangementAssignmentDetailDrawerV2Props = {
  functionSummary: ArrangementFunctionSummaryV2 | null;
  row: ArrangementRowV2 | null;
  open: boolean;
  onClose: () => void;
};

export function ArrangementParticipantManagementDrawerV2({
  functionSummary,
  functionSummaries,
  row,
  open,
  onClose,
}: ArrangementParticipantManagementDrawerV2Props) {
  const [selectedFunctionSummary, setSelectedFunctionSummary] =
    useState<ArrangementFunctionSummaryV2 | null>(null);

  useEffect(() => {
    setSelectedFunctionSummary(null);
  }, [open]);

  if (!row || !functionSummary) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box />
      </Drawer>
    );
  }

  const summaries = functionSummaries ?? [functionSummary];

  return (
    <>
      <Drawer
        anchor="right"
        aria-labelledby="arrangement-participants-title"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 500, md: 560 },
              p: 2,
              pt: { xs: 7, sm: 8, md: 6 },
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Box
            sx={{
              alignItems: 'flex-start',
              display: 'flex',
              gap: 1,
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
                variant="caption"
              >
                Arrangement Participants
              </Typography>
              <Typography
                id="arrangement-participants-title"
                className="ph-unmask"
                variant="h5"
              >
                Manage Assignments
              </Typography>
            </Box>
            <IconButton
              aria-label="close arrangement participant management"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={1}>
            {summaries.map((summary) => (
              <Box
                key={summary.functionName}
                onClick={() => setSelectedFunctionSummary(summary)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  cursor: 'pointer',
                  pb: 1.25,
                  '&:last-of-type': { borderBottom: 0, pb: 0 },
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 0.75,
                    py: 0.5,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {summary.functionName}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {assignmentSummary(summary)}
                    </Typography>
                  </Box>
                  <ChevronRightIcon color="action" fontSize="small" />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Drawer>

      <ArrangementAssignmentDetailDrawerV2
        functionSummary={selectedFunctionSummary}
        row={row}
        open={selectedFunctionSummary !== null}
        onClose={() => setSelectedFunctionSummary(null)}
      />
    </>
  );
}

function ArrangementAssignmentDetailDrawerV2({
  functionSummary,
  row,
  open,
  onClose,
}: ArrangementAssignmentDetailDrawerV2Props) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const [unassignmentParameter, setUnassignmentParameter] = useState<
    FamilyVolunteerAssignment | IndividualVolunteerAssignment | null
  >(null);
  const [fields, setFields] = useState({
    assigneeKey: '',
    variant: null as string | null,
  });
  const partneringFamilyId = row?.partneringFamily.family?.id ?? '';
  const familyId = familyIdMaybe.familyId ?? partneringFamilyId;
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const canEditAssignments = permissions(Permission.EditAssignments);
  const v1CasesModel = useV1CasesModel();
  const withBackdrop = useBackdrop();
  const candidateAssignees = useArrangementFunctionCandidateAssignees({
    arrangement: row?.source,
    arrangementFunction: functionSummary?.functionPolicy,
  });

  useEffect(() => {
    setUnassignmentParameter(null);
    setFields({
      assigneeKey: '',
      variant: null,
    });
  }, [functionSummary?.functionName, open]);

  if (!row || !functionSummary) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box />
      </Drawer>
    );
  }

  const arrangement = row.source;
  const arrangementFunction = functionSummary.functionPolicy;
  const selectedAssignee = candidateAssignees.find(
    (candidate) => candidate.key === fields.assigneeKey
  );
  const requiresVariant =
    arrangementFunction.variants !== undefined &&
    arrangementFunction.variants.length > 0;
  const canAssign =
    canEditAssignments &&
    fields.assigneeKey.length > 0 &&
    (!requiresVariant || fields.variant !== null);
  const usesProgressiveReplacement =
    arrangementFunction.requirement === FunctionRequirement.ExactlyOne &&
    functionSummary.assignments.length > 0;
  const showAssignmentForm = !usesProgressiveReplacement;
  const currentAssignmentActionLabel = assignmentActionLabel(functionSummary);
  const showNoEligibleCandidates =
    showAssignmentForm && candidateAssignees.length === 0 && canEditAssignments;

  const assign = async () => {
    if (!selectedAssignee) return;

    await withBackdrop(async () => {
      if (selectedAssignee.personId == null) {
        await v1CasesModel.assignVolunteerFamily(
          familyId,
          row.v1Case.id!,
          arrangement.id!,
          selectedAssignee.familyId,
          arrangementFunction.functionName!,
          fields.variant || undefined
        );
      } else {
        await v1CasesModel.assignIndividualVolunteer(
          familyId,
          row.v1Case.id!,
          arrangement.id!,
          selectedAssignee.familyId,
          selectedAssignee.personId,
          arrangementFunction.functionName!,
          fields.variant || undefined
        );
      }

      onClose();
    });
  };

  const unassign = async () => {
    if (!unassignmentParameter) return;

    await withBackdrop(async () => {
      if (unassignmentParameter instanceof IndividualVolunteerAssignment) {
        await v1CasesModel.unassignIndividualVolunteer(
          partneringFamilyId,
          row.v1Case.id!,
          arrangement.id!,
          unassignmentParameter.familyId!,
          unassignmentParameter.personId!,
          arrangementFunction.functionName!,
          unassignmentParameter.arrangementFunctionVariant
        );
      } else {
        await v1CasesModel.unassignVolunteerFamily(
          partneringFamilyId,
          row.v1Case.id!,
          arrangement.id!,
          unassignmentParameter.familyId!,
          arrangementFunction.functionName!,
          unassignmentParameter.arrangementFunctionVariant
        );
      }

      onClose();
    });
  };

  return (
    <Drawer
      anchor="right"
      aria-labelledby="arrangement-assignment-detail-title"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500, md: 560 },
            p: 2,
            pt: { xs: 7, sm: 8, md: 6 },
          },
        },
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            alignItems: 'flex-start',
            display: 'flex',
            gap: 1,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              color="text.secondary"
              sx={{ textTransform: 'uppercase' }}
              variant="caption"
            >
              Assignment
            </Typography>
            <Typography
              id="arrangement-assignment-detail-title"
              className="ph-unmask"
              variant="h5"
            >
              {functionSummary.functionName}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1 }}
            >
              {assignmentMetadataChips(functionSummary).map((chip) => (
                <Chip
                  key={chip.label}
                  label={chip.label}
                  size="small"
                  variant={chip.variant}
                />
              ))}
            </Stack>
          </Box>
          <IconButton
            aria-label="close arrangement assignment detail"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {showAssignmentForm && (
          <Stack spacing={1.25}>
            <Typography variant="subtitle2">
              {currentAssignmentActionLabel}
            </Typography>
            {requiresVariant && (
              <FormControl required>
                <FormLabel id="assignment-variant">Variant</FormLabel>
                <RadioGroup
                  aria-labelledby="assignment-variant"
                  value={fields.variant}
                  onChange={(event) =>
                    setFields({
                      ...fields,
                      variant: (event.target as HTMLInputElement).value,
                    })
                  }
                >
                  {arrangementFunction.variants!.map((variant) => (
                    <FormControlLabel
                      key={variant.variantName}
                      value={variant.variantName}
                      control={<Radio />}
                      label={variant.variantName!}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
            <Autocomplete
              id="assignee"
              clearOnEscape
              onChange={(
                _event,
                newValue: ArrangementFunctionCandidateAssignee | null
              ) => {
                setFields({
                  ...fields,
                  assigneeKey: newValue?.key ?? '',
                });
              }}
              options={candidateAssignees.sort(
                (a, b) => -b.candidateType.localeCompare(a.candidateType)
              )}
              isOptionEqualToValue={(option, value) => option.key === value.key}
              groupBy={(option) => option.candidateType}
              getOptionLabel={(option) => option.displayName}
              renderInput={(params) => (
                <TextField
                  required
                  {...params}
                  label="Select a family or individual to assign"
                />
              )}
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button disabled={!canAssign} onClick={assign} variant="contained">
                {currentAssignmentActionLabel}
              </Button>
            </Stack>
          </Stack>
        )}

        <Stack spacing={1}>
          <Typography variant="subtitle2">Current Assignments</Typography>
          {functionSummary.assignments.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No assignments.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {functionSummary.assignments.map((assignment, index) => (
                <Box
                  key={`${functionSummary.functionName}:${index}`}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 1,
                    '&:last-of-type': { borderBottom: 0, pb: 0 },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack spacing={0.25}>
                      <Typography variant="body2">
                        <AssignmentLabel assignment={assignment} />
                      </Typography>
                      {assignment.arrangementFunctionVariant && (
                        <Typography color="text.secondary" variant="caption">
                          {assignment.arrangementFunctionVariant}
                        </Typography>
                      )}
                    </Stack>
                    <Button
                      disabled={!canEditAssignments}
                      onClick={() => setUnassignmentParameter(assignment)}
                      size="small"
                      variant="outlined"
                    >
                      Unassign
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
          {functionSummary.missingVariantLabels.length > 0 && (
            <Typography color="error.main" variant="caption">
              Missing variant: {functionSummary.missingVariantLabels.join(', ')}
            </Typography>
          )}
        </Stack>

        {unassignmentParameter && (
          <Stack
            spacing={1}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
            }}
          >
            <Typography variant="subtitle2">Confirm Unassignment</Typography>
            <Typography variant="body2">
              Unassign <AssignmentLabel assignment={unassignmentParameter} />?
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button
                color="secondary"
                onClick={() => setUnassignmentParameter(null)}
              >
                Cancel
              </Button>
              <Button onClick={unassign} variant="contained">
                Unassign
              </Button>
            </Stack>
          </Stack>
        )}

        {!canEditAssignments && (
          <Typography color="text.secondary" variant="body2">
            You do not have permission to edit assignments.
          </Typography>
        )}

        {showNoEligibleCandidates && (
          <Typography color="text.secondary" variant="body2">
            No eligible candidates are available for this function.
          </Typography>
        )}
      </Stack>
    </Drawer>
  );
}
