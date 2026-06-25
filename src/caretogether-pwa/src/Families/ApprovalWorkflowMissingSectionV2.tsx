import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { add, format, formatDuration, isValid } from 'date-fns';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import {
  ActionRequirement,
  DocumentLinkRequirement,
  NoteEntryRequirement,
  RequirementDefinition,
} from '../GeneratedClient';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { useBackdrop } from '../Hooks/useBackdrop';
import { policyData } from '../Model/ConfigurationModel';
import { selectedLocationContextState } from '../Model/Data';
import { useDirectoryModel, useFamilyLookup } from '../Model/DirectoryModel';
import { uploadFamilyFileToTenant } from '../Model/FilesModel';
import { useVolunteersModel } from '../Model/VolunteersModel';
import type {
  IndividualVolunteerContext,
  RequirementContext,
  VolunteerFamilyContext,
} from '../Requirements/RequirementContext';
import type { ApprovalLedgerOccurrence } from './approvalLedgerViewModel';

type ApprovalWorkflowMissingSectionV2Props = {
  occurrence: ApprovalLedgerOccurrence;
  context: RequirementContext;
  canComplete: boolean;
  canExempt: boolean;
  onSuccess?: () => void;
};

const UPLOAD_NEW = '__uploadnew__';

function requirementNameFromOccurrence(occurrence: ApprovalLedgerOccurrence) {
  if (typeof occurrence.requirement === 'string') {
    return occurrence.requirement;
  }

  if (occurrence.requirement instanceof RequirementDefinition) {
    return occurrence.requirement.actionName!;
  }

  return occurrence.requirement.requirementName;
}

function findRequirementPolicy(
  actionDefinitions: Record<string, ActionRequirement>,
  requirementName: string
) {
  return (
    actionDefinitions[requirementName] ||
    Object.values(actionDefinitions).find((definition) =>
      definition.alternateNames?.includes(requirementName)
    )
  );
}

type SupportedApprovalContext =
  | VolunteerFamilyContext
  | IndividualVolunteerContext;

function isSupportedApprovalContext(
  context: RequirementContext
): context is SupportedApprovalContext {
  if (
    context.kind === 'Volunteer Family' ||
    context.kind === 'Individual Volunteer'
  ) {
    return true;
  }

  return false;
}

export function ApprovalWorkflowMissingSectionV2({
  occurrence,
  context,
  canComplete,
  canExempt,
  onSuccess,
}: ApprovalWorkflowMissingSectionV2Props) {
  const directory = useDirectoryModel();
  const familyLookup = useFamilyLookup();
  const policy = useRecoilValue(policyData);
  const volunteers = useVolunteersModel();
  const withBackdrop = useBackdrop();
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const requirementName = requirementNameFromOccurrence(occurrence);
  const requirementPolicy = findRequirementPolicy(
    policy.actionDefinitions,
    requirementName
  );
  const validityDuration = requirementPolicy?.validity
    ? { days: parseInt(requirementPolicy.validity.split('.')[0]) }
    : null;

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [completedAtLocal, setCompletedAtLocal] = useState<Date | null>(null);
  const [completedAtError, setCompletedAtError] = useState(false);
  const [notes, setNotes] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [exemptionExpiresAtLocal, setExemptionExpiresAtLocal] =
    useState<Date | null>(null);
  const [exemptionExpiresAtError, setExemptionExpiresAtError] = useState(false);
  const [savingAction, setSavingAction] = useState<
    'complete' | 'exempt' | null
  >(null);

  if (!isSupportedApprovalContext(context)) {
    return (
      <Alert severity="info">
        This approval workflow is not available for this requirement context yet.
      </Alert>
    );
  }

  const approvalContext = context;
  const familyId = approvalContext.volunteerFamilyId;
  const family = familyLookup(familyId);

  if (!requirementPolicy) {
    return (
      <Alert severity="warning">
        Approval workflow details are unavailable for this requirement.
      </Alert>
    );
  }

  const documentRequired =
    requirementPolicy.documentLink === DocumentLinkRequirement.Required;
  const documentAllowed =
    requirementPolicy.documentLink === DocumentLinkRequirement.Allowed ||
    documentRequired;
  const notesRequired =
    requirementPolicy.noteEntry === NoteEntryRequirement.Required;
  const notesAllowed =
    requirementPolicy.noteEntry === NoteEntryRequirement.Allowed ||
    notesRequired;
  const isCompleting = savingAction === 'complete';
  const isExempting = savingAction === 'exempt';
  const isSaving = savingAction !== null;
  const canSaveCompletion =
    !isSaving &&
    canComplete &&
    completedAtLocal !== null &&
    !completedAtError &&
    ((documentId === UPLOAD_NEW && documentFile !== null) ||
      (documentId !== UPLOAD_NEW && documentId !== '') ||
      !documentRequired) &&
    (notes.trim() !== '' || !notesRequired);
  const canSaveExemption =
    !isSaving &&
    canExempt &&
    additionalComments.trim() !== '' &&
    !exemptionExpiresAtError;

  async function resolveDocumentId() {
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
  }

  async function createCompletionNote() {
    if (notes.trim() === '') {
      return null;
    }

    const noteId = crypto.randomUUID();
    await directory.createDraftNote(
      familyId,
      noteId,
      notes,
      completedAtLocal || undefined
    );

    return noteId;
  }

  async function completeRequirement() {
    if (!canSaveCompletion || !completedAtLocal) {
      return;
    }

    setSavingAction('complete');
    try {
      await withBackdrop(async () => {
        const uploadedDocumentId = await resolveDocumentId();
        const noteId = await createCompletionNote();

        if (approvalContext.kind === 'Volunteer Family') {
          await volunteers.completeFamilyRequirement(
            familyId,
            requirementName,
            requirementPolicy,
            completedAtLocal,
            uploadedDocumentId,
            noteId
          );
        } else {
          await volunteers.completeIndividualRequirement(
            familyId,
            approvalContext.personId,
            requirementName,
            requirementPolicy,
            completedAtLocal,
            uploadedDocumentId,
            noteId
          );
        }

        onSuccess?.();
      });
    } finally {
      setSavingAction(null);
    }
  }

  async function grantExemption() {
    if (!canSaveExemption) {
      return;
    }

    setSavingAction('exempt');
    try {
      await withBackdrop(async () => {
        if (approvalContext.kind === 'Volunteer Family') {
          await volunteers.exemptVolunteerFamilyRequirement(
            familyId,
            requirementName,
            additionalComments,
            exemptionExpiresAtLocal
          );
        } else {
          await volunteers.exemptVolunteerRequirement(
            familyId,
            approvalContext.personId,
            requirementName,
            additionalComments,
            exemptionExpiresAtLocal
          );
        }

        onSuccess?.();
      });
    } finally {
      setSavingAction(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Complete Requirement</Typography>
        {requirementPolicy.instructions && (
          <Typography sx={{ whiteSpace: 'pre-wrap' }} variant="body2">
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
        <ValidateDatePicker
          label="Completion Date"
          value={completedAtLocal}
          disableFuture
          onChange={(date) => setCompletedAtLocal(date)}
          onErrorChange={setCompletedAtError}
          textFieldProps={{ fullWidth: true, required: true, size: 'small' }}
        />
        {validityDuration &&
          (completedAtLocal && isValid(completedAtLocal) ? (
            <Typography color="text.secondary" variant="caption">
              This will be valid until{' '}
              {format(add(completedAtLocal, validityDuration), 'M/d/yyyy h:mm a')}
            </Typography>
          ) : (
            <Typography color="text.secondary" variant="caption">
              Valid for {formatDuration(validityDuration)}
            </Typography>
          ))}
        {documentAllowed && (
          <Stack spacing={1}>
            <FormControl fullWidth required={documentRequired} size="small">
              <InputLabel id="approval-workflow-document-label">
                Documents
              </InputLabel>
              <Select
                labelId="approval-workflow-document-label"
                label="Documents"
                value={documentId}
                onChange={(event) => setDocumentId(event.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value={UPLOAD_NEW}>Upload new...</MenuItem>
                <Divider />
                {family?.uploadedDocuments?.map((document) => (
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
              <Box>
                <input
                  accept="*/*"
                  type="file"
                  onChange={(event) =>
                    setDocumentFile(event.target.files?.[0] ?? null)
                  }
                />
              </Box>
            )}
          </Stack>
        )}
        {notesAllowed && (
          <TextField
            fullWidth
            label="Notes"
            multiline
            minRows={3}
            placeholder="Space for any general notes"
            required={notesRequired}
            size="small"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            aria-busy={isCompleting}
            disabled={!canSaveCompletion}
            onClick={completeRequirement}
            variant="contained"
          >
            {isCompleting ? 'Saving...' : 'Complete Requirement'}
          </Button>
        </Box>
      </Stack>

      <Divider />

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Grant Exemption</Typography>
        <TextField
          fullWidth
          label="Reason"
          multiline
          minRows={2}
          placeholder="Explain why this requirement will be exempted"
          required
          size="small"
          value={additionalComments}
          onChange={(event) => setAdditionalComments(event.target.value)}
        />
        <ValidateDatePicker
          label="Expiration Date"
          value={exemptionExpiresAtLocal}
          onChange={(date) => setExemptionExpiresAtLocal(date)}
          onErrorChange={setExemptionExpiresAtError}
          textFieldProps={{ fullWidth: true, size: 'small' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            aria-busy={isExempting}
            disabled={!canSaveExemption}
            onClick={grantExemption}
            variant="contained"
          >
            {isExempting ? 'Saving...' : 'Grant Exemption'}
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
}
