import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { add, format, formatDuration, formatRelative, isValid } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import {
  ActionRequirement,
  Arrangement,
  ArrangementPhase,
  CompletedRequirementInfo,
  DocumentLinkRequirement,
  ExemptedRequirementInfo,
  MissingArrangementRequirement,
  NoteEntryRequirement,
} from '../../GeneratedClient';
import { familyNameString } from '../../Families/FamilyName';
import { personNameString } from '../../Families/PersonName';
import { ValidateDatePicker } from '../../Generic/Forms/ValidateDatePicker';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { policyData } from '../../Model/ConfigurationModel';
import { selectedLocationContextState } from '../../Model/Data';
import {
  useDirectoryModel,
  useFamilyLookup,
  usePersonLookup,
} from '../../Model/DirectoryModel';
import { uploadFamilyFileToTenant } from '../../Model/FilesModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { formatUtcDateOnly } from '../../Utilities/dateUtils';
import { RequirementContext } from '../../Requirements/RequirementContext';

export type ArrangementRequirementWorkflowV2 =
  | {
      context: RequirementContext;
      kind: 'missing';
      requirement: MissingArrangementRequirement;
    }
  | {
      context: RequirementContext;
      kind: 'completed';
      requirement: CompletedRequirementInfo;
    }
  | {
      context: RequirementContext;
      kind: 'exempted';
      requirement: ExemptedRequirementInfo;
    };

type ArrangementRequirementManagementDrawerV2Props = {
  onClose: () => void;
  open: boolean;
  workflow: ArrangementRequirementWorkflowV2 | null;
};

const UPLOAD_NEW = '__uploadnew__';

function requirementName(workflow: ArrangementRequirementWorkflowV2) {
  if (workflow.kind === 'missing') {
    return workflow.requirement.action?.actionName ?? 'Requirement';
  }

  return workflow.requirement.requirementName;
}

function familyIdFromContext(context: RequirementContext) {
  if (
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
  ) {
    return context.partneringFamilyId;
  }

  return '';
}

function contextLabel(context: RequirementContext) {
  if (context.kind === 'Arrangement') {
    return 'Arrangement';
  }

  return context.kind;
}

function isArrangementRequirementContext(
  context: RequirementContext
): context is
  | Extract<RequirementContext, { kind: 'Arrangement' }>
  | Extract<RequirementContext, { kind: 'Family Volunteer Assignment' }>
  | Extract<RequirementContext, { kind: 'Individual Volunteer Assignment' }> {
  return (
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
  );
}

function arrangementStatusLabel(arrangement: Arrangement) {
  const now = new Date();

  if (arrangement.phase === ArrangementPhase.Cancelled) {
    return `Cancelled ${formatRelative(arrangement.cancelledAtUtc!, now)}`;
  }

  if (arrangement.phase === ArrangementPhase.SettingUp) {
    return 'Setting up';
  }

  if (arrangement.phase === ArrangementPhase.ReadyToStart) {
    return 'Ready to start';
  }

  if (arrangement.phase === ArrangementPhase.Started) {
    return `Started ${formatRelative(arrangement.startedAtUtc!, now)}`;
  }

  return `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`;
}

function ArrangementApplyLabel({
  arrangement,
  context,
}: {
  arrangement: Arrangement;
  context: RequirementContext;
}) {
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  const familyId = familyIdFromContext(context);
  const person = familyId
    ? personLookup(familyId, arrangement.partneringFamilyPersonId)
    : undefined;

  return (
    <Typography component="span" variant="body2">
      {arrangement.arrangementType} - {personNameString(person)}
      {context.kind === 'Family Volunteer Assignment'
        ? ` (${familyNameString(familyLookup(context.assignment.familyId))})`
        : ''}
      {context.kind === 'Individual Volunteer Assignment'
        ? ` (${
            personLookup
              ? personNameString(
                  personLookup(
                    context.assignment.familyId,
                    context.assignment.personId
                  )
                )
              : ''
          })`
        : ''}{' '}
      - {arrangementStatusLabel(arrangement)}
    </Typography>
  );
}

function findRequirementPolicy(
  actionDefinitions: Record<string, ActionRequirement>,
  actionName: string
) {
  return (
    actionDefinitions[actionName] ??
    Object.values(actionDefinitions).find((definition) =>
      definition.alternateNames?.includes(actionName)
    )
  );
}

export function ArrangementRequirementManagementDrawerV2({
  onClose,
  open,
  workflow,
}: ArrangementRequirementManagementDrawerV2Props) {
  const directory = useDirectoryModel();
  const v1Cases = useV1CasesModel();
  const withBackdrop = useBackdrop();
  const policy = useRecoilValue(policyData);
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );
  const familyLookup = useFamilyLookup();

  const [tabValue, setTabValue] = useState(0);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [completedAtLocal, setCompletedAtLocal] = useState<Date | null>(null);
  const [completedAtError, setCompletedAtError] = useState(false);
  const [notes, setNotes] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [exemptionExpiresAtLocal, setExemptionExpiresAtLocal] =
    useState<Date | null>(null);
  const [exemptionExpiresAtError, setExemptionExpiresAtError] = useState(false);
  const [exemptAll, setExemptAll] = useState(false);
  const [applyToArrangements, setApplyToArrangements] = useState<Arrangement[]>(
    []
  );
  const [saving, setSaving] = useState(false);

  const requirementTitle = workflow ? requirementName(workflow) : '';
  const requirementPolicy =
    workflow?.kind === 'missing'
      ? findRequirementPolicy(
          policy.actionDefinitions,
          workflow.requirement.action?.actionName ?? ''
        )
      : undefined;
  const familyId = workflow ? familyIdFromContext(workflow.context) : '';
  const contextFamily = familyId ? familyLookup(familyId) : undefined;
  const openV1Case = contextFamily?.partneringFamilyInfo?.openV1Case;
  const closedV1Cases =
    contextFamily?.partneringFamilyInfo?.closedV1Cases
      ?.slice()
      .sort((a, b) => (a.closedAtUtc! > b.closedAtUtc! ? -1 : 1)) ?? [];
  const v1CasesForFamily = openV1Case
    ? [openV1Case, ...closedV1Cases]
    : closedV1Cases;
  const arrangementContext =
    workflow && isArrangementRequirementContext(workflow.context)
      ? workflow.context
      : null;
  const selectedV1Case = arrangementContext
    ? v1CasesForFamily.find(
        (v1Case) => v1Case.id === arrangementContext.v1CaseId
      )
    : undefined;
  const availableArrangements = useMemo(
    () =>
      workflow?.kind === 'missing' &&
      selectedV1Case &&
      workflow.requirement instanceof MissingArrangementRequirement
        ? selectedV1Case.arrangements!.filter((arrangement) =>
            [
              ...(arrangement.missingRequirements ?? []),
              ...(arrangement.missingOptionalRequirements ?? []),
            ].some((missingRequirementInfo) => {
              if (workflow.context.kind === 'Family Volunteer Assignment') {
                return (
                  missingRequirementInfo.action?.actionName ===
                    workflow.requirement.action?.actionName &&
                  missingRequirementInfo.arrangementFunction ===
                    workflow.context.assignment.arrangementFunction &&
                  missingRequirementInfo.arrangementFunctionVariant ===
                    workflow.context.assignment.arrangementFunctionVariant &&
                  missingRequirementInfo.volunteerFamilyId ===
                    workflow.context.assignment.familyId
                );
              }

              if (workflow.context.kind === 'Individual Volunteer Assignment') {
                return (
                  missingRequirementInfo.action?.actionName ===
                    workflow.requirement.action?.actionName &&
                  missingRequirementInfo.arrangementFunction ===
                    workflow.context.assignment.arrangementFunction &&
                  missingRequirementInfo.arrangementFunctionVariant ===
                    workflow.context.assignment.arrangementFunctionVariant &&
                  missingRequirementInfo.volunteerFamilyId ===
                    workflow.context.assignment.familyId &&
                  missingRequirementInfo.personId ===
                    workflow.context.assignment.personId
                );
              }

              return (
                missingRequirementInfo.action?.actionName ===
                workflow.requirement.action?.actionName
              );
            })
          )
        : [],
    [selectedV1Case, workflow]
  );
  const validityDuration = requirementPolicy?.validity
    ? { days: parseInt(requirementPolicy.validity.split('.')[0]) }
    : null;

  useEffect(() => {
    if (!open || !workflow) return;

    setTabValue(0);
    setDocumentFile(null);
    setDocumentId('');
    setCompletedAtLocal(null);
    setCompletedAtError(false);
    setNotes('');
    setAdditionalComments('');
    setExemptionExpiresAtLocal(null);
    setExemptionExpiresAtError(false);
    setExemptAll(false);
    setSaving(false);
  }, [open, workflow]);

  useEffect(() => {
    if (!open || workflow?.kind !== 'missing') return;

    setApplyToArrangements(
      arrangementContext
        ? availableArrangements.filter(
            (arrangement) => arrangement.id === arrangementContext.arrangementId
          )
        : []
    );
  }, [arrangementContext, availableArrangements, open, workflow]);

  if (!workflow) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box />
      </Drawer>
    );
  }

  const closeDrawer = () => {
    if (!saving) onClose();
  };

  const requiresArrangementSelection =
    workflow.kind === 'missing' && availableArrangements.length > 0;
  const hasValidArrangementSelection =
    !requiresArrangementSelection || applyToArrangements.length > 0;
  const canSaveMissing =
    workflow.kind === 'missing' &&
    requirementPolicy &&
    hasValidArrangementSelection &&
    (tabValue === 0
      ? completedAtLocal !== null &&
        !completedAtError &&
        ((documentId === UPLOAD_NEW && documentFile) ||
          (documentId !== UPLOAD_NEW && documentId !== '') ||
          requirementPolicy.documentLink !==
            DocumentLinkRequirement.Required) &&
        (notes !== '' ||
          requirementPolicy.noteEntry !== NoteEntryRequirement.Required)
      : additionalComments !== '' && !exemptionExpiresAtError);
  const canSave = workflow.kind === 'missing' ? canSaveMissing : true;

  const toggleApplyToArrangement = (
    arrangement: Arrangement,
    include: boolean
  ) => {
    setApplyToArrangements((current) =>
      include
        ? current.concat(arrangement)
        : current.filter((item) => item.id !== arrangement.id)
    );
  };

  const uploadDocument = async () => {
    if (documentId !== UPLOAD_NEW) {
      return documentId === '' ? null : documentId;
    }

    if (!documentFile) {
      throw new Error('No document file selected.');
    }

    const uploadedDocumentId = await uploadFamilyFileToTenant(
      organizationId,
      locationId,
      familyId,
      documentFile
    );

    await directory.uploadFamilyDocument(
      familyId,
      uploadedDocumentId,
      documentFile.name
    );

    return uploadedDocumentId;
  };

  const createCompletionNote = async () => {
    if (notes.trim() === '') {
      return null;
    }

    const noteId = crypto.randomUUID();
    await directory.createDraftNote(
      familyId,
      noteId,
      notes,
      completedAtLocal ?? undefined
    );

    return noteId;
  };

  const completeMissingRequirement = async () => {
    if (!requirementPolicy || workflow.kind !== 'missing') return;
    if (!isArrangementRequirementContext(workflow.context)) {
      throw new Error(
        `Invalid requirement context '${workflow.context.kind}'.`
      );
    }

    const document = await uploadDocument();
    const noteId = await createCompletionNote();
    const arrangementIds = applyToArrangements.map(
      (arrangement) => arrangement.id!
    );

    if (workflow.context.kind === 'Arrangement') {
      await v1Cases.completeArrangementRequirement(
        familyId,
        workflow.context.v1CaseId,
        arrangementIds,
        requirementTitle,
        requirementPolicy,
        completedAtLocal!,
        document,
        noteId
      );
      return;
    }

    if (workflow.context.kind === 'Family Volunteer Assignment') {
      await v1Cases.completeVolunteerFamilyAssignmentRequirement(
        familyId,
        workflow.context.v1CaseId,
        arrangementIds,
        workflow.context.assignment,
        requirementTitle,
        requirementPolicy,
        completedAtLocal!,
        document,
        noteId
      );
      return;
    }

    await v1Cases.completeIndividualVolunteerAssignmentRequirement(
      familyId,
      workflow.context.v1CaseId,
      arrangementIds,
      workflow.context.assignment,
      requirementTitle,
      requirementPolicy,
      completedAtLocal!,
      document,
      noteId
    );
  };

  const exemptMissingRequirement = async () => {
    if (workflow.kind !== 'missing') return;
    if (!isArrangementRequirementContext(workflow.context)) {
      throw new Error(
        `Invalid requirement context '${workflow.context.kind}'.`
      );
    }

    const arrangementIds = applyToArrangements.map(
      (arrangement) => arrangement.id!
    );

    if (workflow.context.kind === 'Arrangement') {
      await v1Cases.exemptArrangementRequirement(
        familyId,
        workflow.context.v1CaseId,
        arrangementIds,
        workflow.requirement,
        exemptAll,
        additionalComments,
        exemptionExpiresAtLocal
      );
      return;
    }

    if (workflow.context.kind === 'Family Volunteer Assignment') {
      await v1Cases.exemptVolunteerFamilyAssignmentRequirement(
        familyId,
        workflow.context.v1CaseId,
        arrangementIds,
        workflow.context.assignment,
        workflow.requirement,
        exemptAll,
        additionalComments,
        exemptionExpiresAtLocal
      );
      return;
    }

    await v1Cases.exemptIndividualVolunteerAssignmentRequirement(
      familyId,
      workflow.context.v1CaseId,
      arrangementIds,
      workflow.context.assignment,
      workflow.requirement,
      exemptAll,
      additionalComments,
      exemptionExpiresAtLocal
    );
  };

  const markRequirementIncomplete = async () => {
    if (workflow.kind !== 'completed') return;
    if (!isArrangementRequirementContext(workflow.context)) {
      throw new Error(
        `Invalid requirement context '${workflow.context.kind}'.`
      );
    }

    if (workflow.context.kind === 'Arrangement') {
      await v1Cases.markArrangementRequirementIncomplete(
        familyId,
        workflow.context.v1CaseId,
        workflow.context.arrangementId,
        workflow.requirement
      );
      return;
    }

    if (workflow.context.kind === 'Family Volunteer Assignment') {
      await v1Cases.markVolunteerFamilyAssignmentRequirementIncomplete(
        familyId,
        workflow.context.v1CaseId,
        workflow.context.arrangementId,
        workflow.context.assignment,
        workflow.requirement
      );
      return;
    }

    await v1Cases.markIndividualVolunteerAssignmentRequirementIncomplete(
      familyId,
      workflow.context.v1CaseId,
      workflow.context.arrangementId,
      workflow.context.assignment,
      workflow.requirement
    );
  };

  const removeRequirementExemption = async () => {
    if (workflow.kind !== 'exempted') return;
    if (!isArrangementRequirementContext(workflow.context)) {
      throw new Error(
        `Invalid requirement context '${workflow.context.kind}'.`
      );
    }

    if (workflow.context.kind === 'Arrangement') {
      await v1Cases.unexemptArrangementRequirement(
        familyId,
        workflow.context.v1CaseId,
        workflow.context.arrangementId,
        workflow.requirement
      );
      return;
    }

    if (workflow.context.kind === 'Family Volunteer Assignment') {
      await v1Cases.unexemptVolunteerFamilyAssignmentRequirement(
        familyId,
        workflow.context.v1CaseId,
        workflow.context.arrangementId,
        workflow.context.assignment,
        workflow.requirement
      );
      return;
    }

    await v1Cases.unexemptIndividualVolunteerAssignmentRequirement(
      familyId,
      workflow.context.v1CaseId,
      workflow.context.arrangementId,
      workflow.context.assignment,
      workflow.requirement
    );
  };

  const save = async () => {
    setSaving(true);

    try {
      await withBackdrop(async () => {
        if (workflow.kind === 'missing' && tabValue === 0) {
          await completeMissingRequirement();
        } else if (workflow.kind === 'missing') {
          await exemptMissingRequirement();
        } else if (workflow.kind === 'completed') {
          await markRequirementIncomplete();
        } else {
          await removeRequirementExemption();
        }

        onClose();
      });
    } finally {
      setSaving(false);
    }
  };

  const title =
    workflow.kind === 'missing'
      ? tabValue === 0
        ? 'Complete Requirement'
        : 'Grant Exemption'
      : workflow.kind === 'completed'
        ? 'Mark Incomplete'
        : 'Remove Exemption';
  const saveLabel =
    workflow.kind === 'completed'
      ? 'Yes, Mark Incomplete'
      : workflow.kind === 'exempted'
        ? 'Yes, Remove Exemption'
        : title;

  return (
    <Drawer
      anchor="right"
      aria-labelledby="arrangement-requirement-management-title"
      open={open}
      onClose={closeDrawer}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560, md: 620 },
            p: 2,
            pt: { xs: 7, sm: 8, md: 6 },
          },
        },
      }}
    >
      <Stack spacing={2.25}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              id="arrangement-requirement-management-title"
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {title}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {contextLabel(workflow.context)}
            </Typography>
          </Box>
          <IconButton
            aria-label="Close requirement management"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box>
          <Typography color="text.secondary" variant="caption">
            Requirement
          </Typography>
          <Typography className="ph-unmask" variant="subtitle1">
            {requirementTitle}
          </Typography>
        </Box>

        {workflow.kind === 'missing' && (
          <>
            <Tabs
              value={tabValue}
              onChange={(_, value) => setTabValue(value)}
              indicatorColor="secondary"
              variant="fullWidth"
            >
              <Tab value={0} label="Complete" />
              <Tab value={1} label="Exempt" />
            </Tabs>

            {!requirementPolicy && (
              <Typography color="error" variant="body2">
                Requirement policy could not be found.
              </Typography>
            )}

            {tabValue === 0 && requirementPolicy && (
              <Stack spacing={2}>
                {requirementPolicy.instructions && (
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {requirementPolicy.instructions}
                  </Typography>
                )}
                {requirementPolicy.infoLink && (
                  <Link
                    href={requirementPolicy.infoLink}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    variant="body2"
                  >
                    {requirementPolicy.infoLink}
                  </Link>
                )}
                {availableArrangements.length > 0 && (
                  <FormControl component="fieldset" variant="standard">
                    <FormLabel component="legend">Complete for</FormLabel>
                    <FormGroup>
                      {availableArrangements.map((arrangement) => (
                        <FormControlLabel
                          key={arrangement.id}
                          control={
                            <Checkbox
                              checked={applyToArrangements.some(
                                (item) => item.id === arrangement.id
                              )}
                              onChange={(_, checked) =>
                                toggleApplyToArrangement(arrangement, checked)
                              }
                            />
                          }
                          label={
                            <ArrangementApplyLabel
                              arrangement={arrangement}
                              context={workflow.context}
                            />
                          }
                        />
                      ))}
                    </FormGroup>
                  </FormControl>
                )}
                <Box>
                  <ValidateDatePicker
                    label="When was this requirement completed?"
                    value={completedAtLocal}
                    disableFuture
                    maxDate={new Date()}
                    onChange={setCompletedAtLocal}
                    onErrorChange={setCompletedAtError}
                    textFieldProps={{ fullWidth: true, required: true }}
                  />
                  {validityDuration &&
                    (completedAtLocal && isValid(completedAtLocal) ? (
                      <Typography color="text.secondary" variant="caption">
                        This will be valid until{' '}
                        {format(
                          add(completedAtLocal, validityDuration),
                          'M/d/yyyy h:mm a'
                        )}
                      </Typography>
                    ) : (
                      <Typography color="text.secondary" variant="caption">
                        Valid for {formatDuration(validityDuration)}
                      </Typography>
                    ))}
                </Box>
                {(requirementPolicy.documentLink ===
                  DocumentLinkRequirement.Allowed ||
                  requirementPolicy.documentLink ===
                    DocumentLinkRequirement.Required) && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <FormControl
                      fullWidth
                      required={
                        requirementPolicy.documentLink ===
                        DocumentLinkRequirement.Required
                      }
                    >
                      <InputLabel id="requirement-document-label">
                        Document
                      </InputLabel>
                      <Select
                        labelId="requirement-document-label"
                        label="Document"
                        value={documentId}
                        onChange={(event) =>
                          setDocumentId(event.target.value as string)
                        }
                      >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value={UPLOAD_NEW}>Upload new...</MenuItem>
                        <Divider />
                        {contextFamily?.uploadedDocuments?.map((document) => (
                          <MenuItem
                            key={document.uploadedDocumentId}
                            value={document.uploadedDocumentId}
                          >
                            {document.uploadedFileName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {documentId === UPLOAD_NEW && (
                      <Box sx={{ alignSelf: 'center' }}>
                        <input
                          accept="*/*"
                          id="requirement-document-file"
                          multiple={false}
                          type="file"
                          onChange={(event) =>
                            setDocumentFile(event.target.files?.[0] ?? null)
                          }
                        />
                      </Box>
                    )}
                  </Stack>
                )}
                {(requirementPolicy.noteEntry ===
                  NoteEntryRequirement.Allowed ||
                  requirementPolicy.noteEntry ===
                    NoteEntryRequirement.Required) && (
                  <TextField
                    required={
                      requirementPolicy.noteEntry ===
                      NoteEntryRequirement.Required
                    }
                    label="Notes"
                    placeholder="Space for any general notes"
                    multiline
                    fullWidth
                    minRows={5}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                )}
              </Stack>
            )}

            {tabValue === 1 && (
              <Stack spacing={2}>
                {availableArrangements.length > 0 && (
                  <FormControl component="fieldset" variant="standard">
                    <FormLabel component="legend">Exempt for</FormLabel>
                    <FormGroup>
                      {availableArrangements.map((arrangement) => (
                        <FormControlLabel
                          key={arrangement.id}
                          control={
                            <Checkbox
                              checked={applyToArrangements.some(
                                (item) => item.id === arrangement.id
                              )}
                              onChange={(_, checked) =>
                                toggleApplyToArrangement(arrangement, checked)
                              }
                            />
                          }
                          label={
                            <ArrangementApplyLabel
                              arrangement={arrangement}
                              context={workflow.context}
                            />
                          }
                        />
                      ))}
                    </FormGroup>
                  </FormControl>
                )}
                {(workflow.requirement.dueBy ||
                  workflow.requirement.pastDueSince) && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exemptAll}
                        onChange={(_, checked) => setExemptAll(checked)}
                      />
                    }
                    label="Exempt ALL instances of this requirement for the selected arrangement(s)?"
                  />
                )}
                <TextField
                  required
                  label="Additional Comments"
                  placeholder="Explain why this requirement will be exempted"
                  multiline
                  fullWidth
                  minRows={2}
                  maxRows={5}
                  value={additionalComments}
                  onChange={(event) =>
                    setAdditionalComments(event.target.value)
                  }
                />
                <ValidateDatePicker
                  label="When does this exemption expire? (Default is never)"
                  value={exemptionExpiresAtLocal}
                  onChange={setExemptionExpiresAtLocal}
                  onErrorChange={setExemptionExpiresAtError}
                  textFieldProps={{ fullWidth: true }}
                />
              </Stack>
            )}
          </>
        )}

        {workflow.kind === 'completed' && (
          <Typography variant="body2">
            Mark this {workflow.context.kind} requirement as incomplete?
          </Typography>
        )}

        {workflow.kind === 'exempted' && (
          <Stack spacing={1}>
            <Typography variant="body2">
              Remove the exemption for this {workflow.context.kind} requirement?
            </Typography>
            {workflow.requirement.additionalComments && (
              <Typography color="text.secondary" variant="body2">
                {workflow.requirement.additionalComments}
              </Typography>
            )}
            {workflow.requirement.exemptionExpiresAtUtc && (
              <Typography color="text.secondary" variant="caption">
                Expires{' '}
                {formatUtcDateOnly(workflow.requirement.exemptionExpiresAtUtc)}
              </Typography>
            )}
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button color="secondary" disabled={saving} onClick={closeDrawer}>
            Cancel
          </Button>
          <Button
            color={workflow.kind === 'exempted' ? 'secondary' : 'primary'}
            disabled={!canSave || saving}
            onClick={save}
            variant="contained"
          >
            {saveLabel}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
