import { DatePicker } from '@mui/x-date-pickers';
import {
  Checkbox,
  DialogContentText,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import {
  ActionRequirement,
  Arrangement,
  ArrangementPhase,
  DocumentLinkRequirement,
  MissingArrangementRequirement,
  NoteEntryRequirement,
  Referral,
  RequirementDefinition,
} from '../GeneratedClient';
import {
  useDirectoryModel,
  useFamilyLookup,
  usePersonLookup,
} from '../Model/DirectoryModel';
import { uploadFamilyFileToTenant } from '../Model/FilesModel';
import { useReferralsModel } from '../Model/ReferralsModel';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { UpdateDialog } from '../Generic/UpdateDialog';
import { RequirementContext } from './RequirementContext';
import { a11yProps, TabPanel } from '../Generic/TabPanel';
import { personNameString } from '../Families/PersonName';
import { DialogHandle } from '../Hooks/useDialogHandle';
import { familyNameString } from '../Families/FamilyName';
import { add, format, formatDuration, formatRelative, isValid } from 'date-fns';
import { selectedLocationContextState } from '../Model/Data';

type MissingRequirementDialogProps = {
  handle: DialogHandle;
  requirement: MissingArrangementRequirement | RequirementDefinition | string;
  context: RequirementContext;
  policy: ActionRequirement;
  referralId?: string;
  canExempt: boolean;
};
export function MissingRequirementDialog({
  handle,
  requirement,
  context,
  policy,
  referralId,
  canExempt,
}: MissingRequirementDialogProps) {
  const directory = useDirectoryModel();
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  const now = new Date();

  const validityDuration = policy.validity
    ? { days: parseInt(policy.validity.split('.')[0]) }
    : null;

  const [tabValue, setTabValue] = useState(0);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [completedAtLocal, setCompletedAtLocal] = useState(null as Date | null);
  const [completedAtError, setCompletedAtError] = useState(false);
  const [notes, setNotes] = useState('');
  const UPLOAD_NEW = '__uploadnew__';
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );
  const [additionalComments, setAdditionalComments] = useState('');
  const [exemptionExpiresAtLocal, setExemptionExpiresAtLocal] = useState(
    null as Date | null
  );
  const [exemptAll, setExemptAll] = useState(false);

  const familyLookup = useFamilyLookup();
  const contextFamilyId =
    context.kind === 'Referral' ||
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
      ? context.partneringFamilyId
      : context.volunteerFamilyId;
  const contextFamily = familyLookup(contextFamilyId);

  const personLookup = usePersonLookup().bind(null, contextFamilyId);

  const openReferrals: Referral[] =
    contextFamily?.partneringFamilyInfo?.openReferral !== undefined
      ? [contextFamily.partneringFamilyInfo.openReferral]
      : [];
  const closedReferrals: Referral[] =
    contextFamily?.partneringFamilyInfo?.closedReferrals
      ?.slice()
      .sort((r1, r2) => (r1.closedAtUtc! > r2.closedAtUtc! ? -1 : 1)) || [];
  const allReferrals: Referral[] = [...openReferrals, ...closedReferrals];
  const selectedReferral = referralId
    ? allReferrals.find((r) => r.id === referralId)
    : undefined;

  const availableArrangements =
    selectedReferral && requirement instanceof MissingArrangementRequirement
      ? selectedReferral.arrangements!.filter((arrangement) =>
          [
            ...arrangement.missingRequirements!,
            ...arrangement.missingOptionalRequirements!,
          ].some((missingRequirementInfo) => {
            if (context.kind === 'Family Volunteer Assignment')
              return (
                missingRequirementInfo.action?.actionName ===
                  requirement.action?.actionName &&
                missingRequirementInfo.arrangementFunction ===
                  context.assignment.arrangementFunction &&
                missingRequirementInfo.arrangementFunctionVariant ===
                  context.assignment.arrangementFunctionVariant &&
                missingRequirementInfo.volunteerFamilyId ===
                  context.assignment.familyId
              );
            else if (context.kind === 'Individual Volunteer Assignment')
              return (
                missingRequirementInfo.action?.actionName ===
                  requirement.action?.actionName &&
                missingRequirementInfo.arrangementFunction ===
                  context.assignment.arrangementFunction &&
                missingRequirementInfo.arrangementFunctionVariant ===
                  context.assignment.arrangementFunctionVariant &&
                missingRequirementInfo.volunteerFamilyId ===
                  context.assignment.familyId &&
                missingRequirementInfo.personId === context.assignment.personId
              );
            else
              return (
                missingRequirementInfo.action?.actionName ===
                requirement.action?.actionName
              );
          })
        )
      : [];
  const [applyToArrangements, setApplyToArrangements] = useState(
    context.kind === 'Arrangement'
      ? availableArrangements.filter(
          (arrangement) => arrangement.id === context.arrangementId
        )
      : []
  );
  function toggleApplyToArrangement(
    arrangement: Arrangement,
    include: boolean
  ) {
    if (include) {
      setApplyToArrangements(applyToArrangements.concat(arrangement));
    } else {
      setApplyToArrangements(
        applyToArrangements.filter((a) => a.id !== arrangement.id)
      );
    }
  }

  const enableSave = () =>
    tabValue === 0
      ? // mark complete
        completedAtLocal != null &&
        !completedAtError &&
        ((documentId === UPLOAD_NEW && documentFile) ||
          (documentId !== UPLOAD_NEW && documentId !== '') ||
          policy.documentLink !== DocumentLinkRequirement.Required) &&
        (notes !== '' || policy.noteEntry !== NoteEntryRequirement.Required) &&
        (availableArrangements.length === 0) !== applyToArrangements.length > 0 // logical XOR
      : // grant exemption
        (availableArrangements.length === 0) !==
          applyToArrangements.length > 0 && // logical XOR
        additionalComments !== '';

  const requirementName =
    requirement instanceof MissingArrangementRequirement
      ? requirement.action!.actionName!
      : requirement instanceof RequirementDefinition
        ? requirement.actionName!
        : requirement;

  async function markComplete() {
    let document = documentId;
    if (documentId === UPLOAD_NEW) {
      document = await uploadFamilyFileToTenant(
        organizationId,
        locationId,
        contextFamilyId,
        documentFile!
      );
      await directory.uploadFamilyDocument(
        contextFamilyId,
        document,
        documentFile!.name
      );
    }
    let noteId: string | undefined = undefined;
    if (notes !== '') {
      noteId = crypto.randomUUID();
      await directory.createDraftNote(
        contextFamilyId as string,
        noteId,
        notes,
        completedAtLocal || undefined
      );
    }
    switch (context.kind) {
      case 'Referral':
        await referrals.completeReferralRequirement(
          contextFamilyId,
          context.referralId,
          requirementName,
          policy,
          completedAtLocal!,
          document === '' ? null : document,
          noteId || null
        );
        break;
      case 'Arrangement':
        await referrals.completeArrangementRequirement(
          contextFamilyId,
          context.referralId,
          applyToArrangements.map((arrangement) => arrangement.id!),
          requirementName,
          policy,
          completedAtLocal!,
          document === '' ? null : document,
          noteId || null
        );
        break;
      case 'Family Volunteer Assignment':
        await referrals.completeVolunteerFamilyAssignmentRequirement(
          contextFamilyId,
          context.referralId,
          applyToArrangements.map((arrangement) => arrangement.id!),
          context.assignment,
          requirementName,
          policy,
          completedAtLocal!,
          document === '' ? null : document,
          noteId || null
        );
        break;
      case 'Individual Volunteer Assignment':
        await referrals.completeIndividualVolunteerAssignmentRequirement(
          contextFamilyId,
          context.referralId,
          applyToArrangements.map((arrangement) => arrangement.id!),
          context.assignment,
          requirementName,
          policy,
          completedAtLocal!,
          document === '' ? null : document,
          noteId || null
        );
        break;
      case 'Volunteer Family':
        await volunteers.completeFamilyRequirement(
          contextFamilyId,
          requirementName,
          policy,
          completedAtLocal!,
          document === '' ? null : document,
          noteId || null
        );
        break;
      case 'Individual Volunteer':
        await volunteers.completeIndividualRequirement(
          contextFamilyId,
          context.personId,
          requirementName,
          policy,
          completedAtLocal!,
          document === '' ? null : document,
          noteId || null
        );
        break;
    }
  }

  async function exempt() {
    switch (context.kind) {
      case 'Referral':
        await referrals.exemptReferralRequirement(
          contextFamilyId,
          context.referralId,
          requirementName,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      case 'Arrangement':
        await referrals.exemptArrangementRequirement(
          contextFamilyId,
          context.referralId,
          applyToArrangements.map((arrangement) => arrangement.id!),
          requirement as MissingArrangementRequirement,
          exemptAll,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      case 'Family Volunteer Assignment':
        await referrals.exemptVolunteerFamilyAssignmentRequirement(
          contextFamilyId,
          context.referralId,
          applyToArrangements.map((arrangement) => arrangement.id!),
          context.assignment,
          requirement as MissingArrangementRequirement,
          exemptAll,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      case 'Individual Volunteer Assignment':
        await referrals.exemptIndividualVolunteerAssignmentRequirement(
          contextFamilyId,
          context.referralId,
          applyToArrangements.map((arrangement) => arrangement.id!),
          context.assignment,
          requirement as MissingArrangementRequirement,
          exemptAll,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      case 'Volunteer Family':
        await volunteers.exemptVolunteerFamilyRequirement(
          contextFamilyId,
          requirementName,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      case 'Individual Volunteer':
        await volunteers.exemptVolunteerRequirement(
          contextFamilyId,
          context.personId,
          requirementName,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
    }
  }

  async function save() {
    if (tabValue === 0) {
      await markComplete();
    } else {
      await exempt();
    }
  }

  return (
    <UpdateDialog
      open={handle.open}
      onClose={handle.closeDialog}
      key={handle.key}
      title={`${context.kind} Requirement: ${requirementName}`}
      enableSave={enableSave}
      onSave={save}
    >
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        indicatorColor="secondary"
        variant="fullWidth"
      >
        <Tab label="Mark Complete" {...a11yProps(0)} />
        {canExempt && <Tab label="Grant Exemption" {...a11yProps(1)} />}
      </Tabs>
      <TabPanel value={tabValue} index={0}>
        {policy.instructions && (
          <DialogContentText style={{ whiteSpace: 'pre-wrap' }}>
            {policy.instructions}
          </DialogContentText>
        )}
        {policy.infoLink && (
          <DialogContentText>
            <Link
              href={policy.infoLink}
              target="_blank"
              rel="noreferrer"
              underline="hover"
            >
              {policy.infoLink}
            </Link>
          </DialogContentText>
        )}
        <br />
        <Grid container spacing={2}>
          {requirement instanceof MissingArrangementRequirement && (
            <Grid item xs={12}>
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">Complete for</FormLabel>
                <FormGroup>
                  {availableArrangements.map((arrangement) => (
                    <FormControlLabel
                      key={arrangement.id}
                      control={
                        <Checkbox
                          size="medium"
                          checked={applyToArrangements.includes(arrangement)}
                          onChange={(_, checked) =>
                            toggleApplyToArrangement(arrangement, checked)
                          }
                          name={arrangement.id!}
                        />
                      }
                      label={
                        arrangement.arrangementType +
                        ' - ' +
                        personNameString(
                          personLookup(arrangement.partneringFamilyPersonId)
                        ) +
                        (context.kind === 'Family Volunteer Assignment'
                          ? ` (${familyNameString(familyLookup(context.assignment.familyId))})`
                          : '') +
                        (context.kind === 'Individual Volunteer Assignment'
                          ? ` (${personNameString(personLookup(context.assignment.personId))})`
                          : '') +
                        ` - ` +
                        (arrangement.phase === ArrangementPhase.Cancelled
                          ? `Cancelled ${formatRelative(arrangement.cancelledAtUtc!, now)}`
                          : arrangement.phase === ArrangementPhase.SettingUp
                            ? 'Setting up'
                            : arrangement.phase ===
                                ArrangementPhase.ReadyToStart
                              ? 'Ready to start'
                              : arrangement.phase === ArrangementPhase.Started
                                ? `Started ${formatRelative(arrangement.startedAtUtc!, now)}`
                                : `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`)
                      }
                    />
                  ))}
                </FormGroup>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12}>
            {requirement instanceof MissingArrangementRequirement ? (
              <DatePicker
                label="When was this requirement completed?"
                value={completedAtLocal}
                disableFuture
                minDate={new Date(1900, 0, 1)}
                format="MM/dd/yyyy"
                onChange={(date: Date | null) => {
                  const invalid = !date || date.getFullYear() < 1900;
                  setCompletedAtError(invalid);
                  if (date) setCompletedAtLocal(date);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: completedAtError,
                    helperText: completedAtError
                      ? 'Hmm, that doesn’t seem to be a valid date. Please enter a valid date to continue.'
                      : '',
                  },
                }}
              />
            ) : (
              <DatePicker
                label="When was this requirement completed?"
                value={completedAtLocal}
                disableFuture
                minDate={new Date(1900, 0, 1)}
                format="MM/dd/yyyy"
                onChange={(date: Date | null) => {
                  const invalid = !date || date.getFullYear() < 1900;
                  setCompletedAtError(invalid);
                  if (date) setCompletedAtLocal(date);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: completedAtError,
                    helperText: completedAtError
                      ? 'Hmm, that doesn’t seem to be a valid date. Please enter a valid date to continue.'
                      : '',
                  },
                }}
              />
            )}
            {validityDuration &&
              (completedAtLocal && isValid(completedAtLocal) ? (
                <p>
                  This will be valid until{' '}
                  {format(
                    add(completedAtLocal, validityDuration),
                    'M/d/yyyy h:mm a'
                  )}
                </p>
              ) : (
                <p>Valid for {formatDuration(validityDuration)}</p>
              ))}
          </Grid>
          {(policy.documentLink === DocumentLinkRequirement.Allowed ||
            policy.documentLink === DocumentLinkRequirement.Required) && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  size="small"
                  required={
                    policy.documentLink === DocumentLinkRequirement.Required
                  }
                >
                  <InputLabel id="document-label">Document</InputLabel>
                  <Select
                    labelId="document-label"
                    id="document"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value as string)}
                  >
                    <MenuItem key="placeholder" value="">
                      None
                    </MenuItem>
                    <MenuItem key={UPLOAD_NEW} value={UPLOAD_NEW}>
                      Upload new...
                    </MenuItem>
                    <Divider />
                    {contextFamily!.uploadedDocuments?.map((document) => (
                      <MenuItem
                        key={document.uploadedDocumentId}
                        value={document.uploadedDocumentId}
                      >
                        {document.uploadedFileName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                {documentId === UPLOAD_NEW && (
                  <input
                    accept="*/*"
                    multiple={false}
                    id="document-file"
                    type="file"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setDocumentFile(e.target.files[0]);
                      } else {
                        setDocumentFile(null);
                      }
                    }}
                  />
                )}
              </Grid>
            </>
          )}
          {(policy.noteEntry === NoteEntryRequirement.Allowed ||
            policy.noteEntry === NoteEntryRequirement.Required) && (
            <Grid item xs={12}>
              <TextField
                id="notes"
                required={policy.noteEntry === NoteEntryRequirement.Required}
                label="Notes"
                placeholder="Space for any general notes"
                multiline
                fullWidth
                variant="outlined"
                minRows={6}
                size="medium"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          )}
        </Grid>
      </TabPanel>
      {canExempt && (
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {requirement instanceof MissingArrangementRequirement && (
              <Grid item xs={12}>
                <FormControl component="fieldset" variant="standard">
                  <FormLabel component="legend">Exempt for</FormLabel>
                  <FormGroup>
                    {availableArrangements.map((arrangement) => (
                      <FormControlLabel
                        key={arrangement.id}
                        control={
                          <Checkbox
                            size="medium"
                            checked={applyToArrangements.includes(arrangement)}
                            onChange={(_, checked) =>
                              toggleApplyToArrangement(arrangement, checked)
                            }
                            name={arrangement.id!}
                          />
                        }
                        label={
                          `${arrangement.arrangementType} - ${personNameString(personLookup(arrangement.partneringFamilyPersonId))} - ` +
                          (arrangement.phase === ArrangementPhase.Cancelled
                            ? `Cancelled ${formatRelative(arrangement.cancelledAtUtc!, now)}`
                            : arrangement.phase === ArrangementPhase.SettingUp
                              ? 'Setting up'
                              : arrangement.phase ===
                                  ArrangementPhase.ReadyToStart
                                ? 'Ready to start'
                                : arrangement.phase === ArrangementPhase.Started
                                  ? `Started ${formatRelative(arrangement.startedAtUtc!, now)}`
                                  : `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`)
                        }
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </Grid>
            )}
            {requirement instanceof MissingArrangementRequirement &&
              (requirement.dueBy || requirement.pastDueSince) && ( // Only monitoring requirements will have one of these dates set.
                <Grid item xs={12}>
                  <Divider sx={{ marginBottom: 1 }} />
                  <FormControl component="fieldset" variant="standard">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="medium"
                          checked={exemptAll}
                          onChange={(_, checked) => setExemptAll(checked)}
                          name="exempt-all"
                        />
                      }
                      label="Exempt ALL instances of this requirement for the selected arrangement(s)?"
                    />
                  </FormControl>
                </Grid>
              )}
            <Grid item xs={12}>
              <TextField
                id="additional-comments"
                required
                label="Additional Comments"
                placeholder="Explain why this requirement will be exempted"
                multiline
                fullWidth
                variant="outlined"
                minRows={2}
                maxRows={5}
                size="small"
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <DatePicker
                label="When does this exemption expire? (Default is never)"
                value={exemptionExpiresAtLocal}
                minDate={new Date(1900, 0, 1)}
                format="MM/dd/yyyy"
                onChange={(date: Date | null) => {
                  const invalid = !date || date.getFullYear() < 1900;
                  setCompletedAtError(invalid);
                  if (date) setExemptionExpiresAtLocal(date);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: completedAtError,
                    helperText: completedAtError
                      ? 'Hmm, that doesn’t seem to be a valid date. Please enter a valid date to continue.'
                      : '',
                  },
                }}
              />
            </Grid>
          </Grid>
        </TabPanel>
      )}
    </UpdateDialog>
  );
}
