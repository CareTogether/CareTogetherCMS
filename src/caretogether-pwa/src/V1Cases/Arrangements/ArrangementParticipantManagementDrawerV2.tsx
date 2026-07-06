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
import { useRecoilValue } from 'recoil';
import {
  FamilyVolunteerAssignment,
  FunctionRequirement,
  IndividualVolunteerAssignment,
  Person,
  Permission,
  RoleApprovalStatus,
  ValueTupleOfPersonAndFamilyAdultRelationshipInfo,
} from '../../GeneratedClient';
import { FamilyName } from '../../Families/FamilyName';
import { PersonName } from '../../Families/PersonName';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { visibleFamiliesQuery } from '../../Model/Data';
import {
  useFamilyLookup,
  usePersonAndFamilyLookup,
  usePersonLookup,
} from '../../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import type {
  ArrangementFunctionSummaryV2,
  ArrangementRowV2,
} from './arrangementViewModel';

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

type AssigneeOption = {
  candidateType: string;
  displayName: string;
  familyId: string;
  key: string;
  personId: string | null;
};

function AssignmentLabel({
  assignment,
}: {
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment;
}) {
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  if (assignment instanceof IndividualVolunteerAssignment) {
    return (
      <PersonName
        person={personLookup(assignment.familyId, assignment.personId)}
      />
    );
  }

  return <FamilyName family={familyLookup(assignment.familyId)} />;
}

function getFamilyName(
  person: ValueTupleOfPersonAndFamilyAdultRelationshipInfo | undefined
) {
  return person
    ? `${person.item1!.firstName} ${person.item1!.lastName} Family`
    : 'Missing primary contact Family';
}

function assignmentSummary(summary: ArrangementFunctionSummaryV2) {
  if (summary.assignmentLabels.length === 0) {
    return 'Not assigned';
  }

  return summary.assignmentLabels.join(', ');
}

function assignmentMetadataChips(summary: ArrangementFunctionSummaryV2) {
  if (summary.functionPolicy.requirement === FunctionRequirement.ExactlyOne) {
    return [
      { label: 'Required', variant: 'filled' as const },
      { label: 'Exactly one', variant: 'outlined' as const },
    ];
  }

  if (summary.functionPolicy.requirement === FunctionRequirement.OneOrMore) {
    return [
      { label: 'Required', variant: 'filled' as const },
      { label: 'One or more', variant: 'outlined' as const },
    ];
  }

  return [
    { label: 'Optional', variant: 'outlined' as const },
    { label: 'Zero or more', variant: 'outlined' as const },
  ];
}

function assignmentActionLabel(summary: ArrangementFunctionSummaryV2) {
  if (summary.assignments.length === 0) {
    return 'Assign';
  }

  if (summary.functionPolicy.requirement === FunctionRequirement.ExactlyOne) {
    return 'Change Assignment';
  }

  return 'Add Assignment';
}

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
                className="ph-unmask"
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
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);
  const familyAndPersonLookup = usePersonAndFamilyLookup();
  const v1CasesModel = useV1CasesModel();
  const withBackdrop = useBackdrop();

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
  const candidateNamedPeopleAssignees = arrangementFunction.eligiblePeople
    ? arrangementFunction.eligiblePeople
        .map((personId) => familyAndPersonLookup(personId))
        .filter(
          (personResult) =>
            personResult &&
            personResult.family &&
            !arrangement.individualVolunteerAssignments?.find(
              (iva) =>
                iva.arrangementFunction === arrangementFunction.functionName &&
                iva.familyId === personResult.family!.id &&
                iva.personId === personResult.person?.id
            )
        )
        .map((personResult) => ({
          family: personResult.family!,
          person: personResult.person || null,
        }))
    : [];
  const candidateVolunteerIndividualAssignees =
    arrangementFunction.eligibleIndividualVolunteerRoles
      ? visibleFamilies.flatMap((family) =>
          family.volunteerFamilyInfo?.individualVolunteers
            ? Object.entries(family.volunteerFamilyInfo.individualVolunteers)
                .filter(
                  ([volunteerId]) =>
                    family.family!.adults!.find(
                      (adult) => adult.item1!.id === volunteerId
                    )!.item1!.active
                )
                .flatMap(([volunteerId, volunteerInfo]) =>
                  volunteerInfo.approvalStatusByRole
                    ? Object.entries(
                        volunteerInfo.approvalStatusByRole
                      ).flatMap(([roleName, roleApprovalStatus]) =>
                        arrangementFunction.eligibleIndividualVolunteerRoles!.find(
                          (eligibleRole) => eligibleRole === roleName
                        ) &&
                        (roleApprovalStatus.currentStatus ===
                          RoleApprovalStatus.Approved ||
                          roleApprovalStatus.currentStatus ===
                            RoleApprovalStatus.Onboarded) &&
                        !arrangement.individualVolunteerAssignments?.find(
                          (iva) =>
                            iva.arrangementFunction ===
                              arrangementFunction.functionName &&
                            iva.familyId === family.family!.id &&
                            iva.personId === volunteerId
                        )
                          ? [
                              {
                                family: family.family!,
                                person:
                                  family.family!.adults!.find(
                                    (adult) => adult.item1!.id === volunteerId
                                  )!.item1 || null,
                              },
                            ]
                          : []
                      )
                    : []
                )
            : []
        )
      : [];
  const candidateVolunteerFamilyAssignees =
    arrangementFunction.eligibleVolunteerFamilyRoles
      ? visibleFamilies.flatMap((family) =>
          family.volunteerFamilyInfo?.familyRoleApprovals
            ? Object.entries(
                family.volunteerFamilyInfo.familyRoleApprovals
              ).flatMap(([roleName, roleApprovalStatus]) =>
                arrangementFunction.eligibleVolunteerFamilyRoles!.find(
                  (eligibleRole) => eligibleRole === roleName
                ) &&
                (roleApprovalStatus.currentStatus ===
                  RoleApprovalStatus.Approved ||
                  roleApprovalStatus.currentStatus ===
                    RoleApprovalStatus.Onboarded) &&
                !arrangement.familyVolunteerAssignments?.find(
                  (fva) =>
                    fva.arrangementFunction ===
                      arrangementFunction.functionName &&
                    fva.familyId === family.family!.id
                )
                  ? [{ family: family.family!, person: null as Person | null }]
                  : []
              )
            : []
        )
      : [];
  const allCandidateAssignees = candidateNamedPeopleAssignees
    .concat(candidateVolunteerFamilyAssignees)
    .concat(candidateVolunteerIndividualAssignees);
  const candidateAssignees: AssigneeOption[] = allCandidateAssignees
    .filter((item, index) => allCandidateAssignees.indexOf(item) === index)
    .sort((a, b) => {
      const aPrimaryContact = a.family.adults!.find(
        (adult) => a.family.primaryFamilyContactPersonId === adult.item1!.id
      )?.item1;
      const bPrimaryContact = b.family.adults!.find(
        (adult) => b.family.primaryFamilyContactPersonId === adult.item1!.id
      )?.item1;
      const aFirst = a.person ? a.person.firstName! : null;
      const aLast = a.person
        ? a.person.lastName!
        : (aPrimaryContact?.lastName ?? '');
      const bFirst = b.person ? b.person.firstName! : null;
      const bLast = b.person
        ? b.person.lastName!
        : (bPrimaryContact?.lastName ?? '');

      if (aLast < bLast) return -1;
      if (aLast > bLast) return 1;
      if (aFirst == null || bFirst == null) return 0;
      if (aFirst < bFirst) return -1;
      if (aFirst > bFirst) return 1;
      return 0;
    })
    .map((candidate) => {
      if (candidate.person == null) {
        return {
          familyId: candidate.family.id!,
          personId: null,
          key: candidate.family.id!,
          displayName: getFamilyName(
            candidate.family.adults!.find(
              (adult) =>
                candidate.family.primaryFamilyContactPersonId ===
                adult.item1?.id
            )
          ),
          candidateType: 'Families',
        };
      }

      return {
        familyId: candidate.family.id!,
        personId: candidate.person.id!,
        key: `${candidate.family.id!}|${candidate.person.id || ''}`,
        displayName: `${candidate.person.firstName} ${candidate.person.lastName}`,
        candidateType: 'Individuals',
      };
    });
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

        <Stack spacing={1.25}>
          <Typography variant="subtitle2">
            {assignmentActionLabel(functionSummary)}
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
            onChange={(_event, newValue: AssigneeOption | null) => {
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
          <Button
            disabled={!canAssign}
            onClick={assign}
            variant="contained"
            sx={{ alignSelf: 'flex-start' }}
          >
            {assignmentActionLabel(functionSummary)}
          </Button>
        </Stack>

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
                      <Typography className="ph-unmask" variant="body2">
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
            <Typography className="ph-unmask" variant="body2">
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

        {candidateAssignees.length === 0 && canEditAssignments && (
          <Typography color="text.secondary" variant="body2">
            No eligible candidates are available for this function.
          </Typography>
        )}
      </Stack>
    </Drawer>
  );
}
