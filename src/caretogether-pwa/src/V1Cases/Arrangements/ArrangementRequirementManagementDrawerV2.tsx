import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
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
import { add, format, formatDuration, isValid } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import {
  Arrangement,
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
import { usePolicy } from '../../Model/PolicyModel';
import { useRequiredSelectedLocationContext } from '../../Model/Data';
import {
  useDirectoryModel,
  useFamilyLookup,
  usePersonLookup,
} from '../../Model/DirectoryModel';
import { uploadFamilyFileToTenant } from '../../Model/FilesModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { formatUtcDateOnly } from '../../Utilities/dateUtils';
import { RequirementContext } from '../../Requirements/RequirementContext';
import {
  familyIdFromRequirementContext,
  findActionRequirementPolicy,
  getArrangementRequirementStatusLabel,
  getAvailableArrangementsForRequirement,
  isArrangementRequirementContext,
  parseRequirementValidity,
  requirementNameFromWorkflowRequirement,
} from '../../Requirements/requirementWorkflowModel';

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
const NON_ISO_8859_1_CODE_POINT_ERROR =
  'String contains non ISO-8859-1 code point.';

class RequirementDocumentUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequirementDocumentUploadError';
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '';
}

function nonIso88591FilenameCharacters(fileName: string) {
  return Array.from(
    new Set(
      Array.from(fileName).filter(
        (character) => character.codePointAt(0)! > 255
      )
    )
  );
}

function formatCodePoint(character: string) {
  return `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;
}

function formatUnsupportedFilenameCharacters(fileName: string) {
  return nonIso88591FilenameCharacters(fileName)
    .map((character) => `"${character}" (${formatCodePoint(character)})`)
    .join(', ');
}

function formatDocumentUploadError(error: unknown, fileName: string) {
  const message = errorMessage(error);
  const unsupportedCharacters = formatUnsupportedFilenameCharacters(fileName);

  if (message.includes(NON_ISO_8859_1_CODE_POINT_ERROR)) {
    if (unsupportedCharacters !== '') {
      return `Upload failed. Rename the file without ${unsupportedCharacters}. Use basic letters, numbers, spaces, hyphens, or underscores.`;
    }

    return 'Upload failed. Rename the file using basic letters, numbers, spaces, hyphens, or underscores, then try again.';
  }

  if (message.trim() !== '') {
    return `Upload failed: ${message}`;
  }

  return 'Upload failed. Please try again.';
}

function contextLabel(context: RequirementContext) {
  if (context.kind === 'Arrangement') {
    return 'Arrangement';
  }

  return context.kind;
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
  const familyId = familyIdFromRequirementContext(context);
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
      - {getArrangementRequirementStatusLabel(arrangement)}
    </Typography>
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
  const policy = usePolicy();
  const { organizationId, locationId } = useRequiredSelectedLocationContext();
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const requirementTitle = workflow
    ? requirementNameFromWorkflowRequirement(workflow.requirement)
    : '';
  const requirementPolicy =
    workflow?.kind === 'missing'
      ? findActionRequirementPolicy(
          policy.actionDefinitions,
          workflow.requirement.action?.actionName ?? ''
        )
      : undefined;
  const familyId = workflow
    ? (familyIdFromRequirementContext(workflow.context) ?? '')
    : '';
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
      getAvailableArrangementsForRequirement(
        selectedV1Case,
        workflow?.kind === 'missing' ? workflow.requirement : undefined,
        workflow?.context
      ),
    [selectedV1Case, workflow]
  );
  const validityDuration = parseRequirementValidity(requirementPolicy?.validity);

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
    setUploadError(null);
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

    let uploadedDocumentId: string;
    try {
      uploadedDocumentId = await uploadFamilyFileToTenant(
        organizationId,
        locationId,
        familyId,
        documentFile
      );
    } catch (error: unknown) {
      throw new RequirementDocumentUploadError(
        formatDocumentUploadError(error, documentFile.name)
      );
    }

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
    setUploadError(null);

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
    } catch (error: unknown) {
      if (error instanceof RequirementDocumentUploadError) {
        setUploadError(error.message);
        return;
      }

      throw error;
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
                        onChange={(event) => {
                          setDocumentId(event.target.value as string);
                          setUploadError(null);
                        }}
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
                          onChange={(event) => {
                            setDocumentFile(event.target.files?.[0] ?? null);
                            setUploadError(null);
                          }}
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

        {uploadError && <Alert severity="error">{uploadError}</Alert>}

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
