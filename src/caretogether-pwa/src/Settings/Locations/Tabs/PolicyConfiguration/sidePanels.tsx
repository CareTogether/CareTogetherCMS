import { Autocomplete, Button, FormControlLabel, MenuItem, Switch, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import Grid from '../../../../Generic/GridLegacyCompat';
import {
  ActionRequirement,
  ArrangementFunction,
  ArrangementPolicy,
  ChildInvolvement,
  CustomField,
  CustomFieldType,
  CustomFieldValidation,
  DocumentLinkRequirement,
  FunctionAssignmentEligibility,
  FunctionAssignmentPolicy,
  FunctionRequirement,
  MonitoringRequirement,
  NoteEntryRequirement,
  OneTimeRecurrencePolicy,
  RequirementDefinition,
  VolunteerApprovalRequirement,
  VolunteerFamilyApprovalRequirement,
  VolunteerFamilyRolePolicyVersion,
  VolunteerRolePolicyVersion,
} from '../../../../GeneratedClient';
import type { ActionDefinitionDraft, ArrangementFunctionDraft, ArrangementPolicyDraft, CustomFieldDraft, FunctionAssignmentPolicyDraft, MonitoringRequirementDraft, PersonOption, RequirementDraft, ValidityUnit, VolunteerRolePolicyVersionDraft } from './types';
import { actionToDraft, arrangementFunctionToDraft, arrangementPolicyToDraft, customFieldToDraft, enumOptions, functionAssignmentPolicyToDraft, monitoringRequirementToDraft, normalizeStringList, parseValidityAmount, parseVolunteerFamilyRequirements, parseVolunteerRequirements, requirementToDraft, toTimeSpanString, volunteerRolePolicyVersionToDraft } from './policyUtils';

export function ActionDefinitionSidePanel({
  actionName,
  action,
  existingActionNames,
  onClose,
  onSave,
}: {
  actionName?: string;
  action?: ActionRequirement;
  existingActionNames: string[];
  onClose: () => void;
  onSave: (
    previousName: string | undefined,
    actionName: string,
    action: ActionRequirement
  ) => void;
}) {
  const [draft, setDraft] = useState<ActionDefinitionDraft>(() =>
    actionToDraft(actionName, action)
  );

  const trimmedName = draft.actionName.trim();
  const duplicateName =
    trimmedName.length > 0 &&
    trimmedName !== actionName &&
    existingActionNames.includes(trimmedName);
  const alternateNames = normalizeStringList(draft.alternateNames);
  const validityAmountIsValid =
    !draft.validityEnabled ||
    typeof parseValidityAmount(draft.validityAmount) !== 'undefined';
  const canSave =
    trimmedName.length > 0 &&
    !duplicateName &&
    validityAmountIsValid;

  function save() {
    if (!canSave) return;

    onSave(
      actionName,
      trimmedName,
      new ActionRequirement({
        documentLink: draft.documentLink,
        noteEntry: draft.noteEntry,
        instructions: draft.instructions.trim() || undefined,
        infoLink: draft.infoLink.trim() || undefined,
        validity: toTimeSpanString(
          draft.validityEnabled,
          draft.validityAmount,
          draft.validityUnit
        ),
        canView: draft.canView.trim() || undefined,
        canEdit: draft.canEdit.trim() || undefined,
        alternateNames: alternateNames.length > 0 ? alternateNames : undefined,
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={520}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">
          {actionName ? 'Edit Action Definition' : 'Add Action Definition'}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          autoFocus
          label="Action Name"
          value={draft.actionName}
          error={duplicateName}
          helperText={duplicateName ? 'Action name must be unique.' : undefined}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              actionName: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Document"
          value={draft.documentLink}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              documentLink: Number(
                event.target.value
              ) as DocumentLinkRequirement,
            }))
          }
        >
          {enumOptions(DocumentLinkRequirement).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Note"
          value={draft.noteEntry}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              noteEntry: Number(event.target.value) as NoteEntryRequirement,
            }))
          }
        >
          {enumOptions(NoteEntryRequirement).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Instructions"
          value={draft.instructions}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              instructions: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="URL"
          value={draft.infoLink}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              infoLink: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.validityEnabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  validityEnabled: event.target.checked,
                }))
              }
            />
          }
          label="Validity"
        />
      </Grid>

      {draft.validityEnabled && (
        <>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Valid For"
              value={draft.validityAmount}
              error={!validityAmountIsValid}
              helperText={
                validityAmountIsValid
                  ? undefined
                  : 'Enter a positive whole number.'
              }
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  validityAmount: event.target.value,
                }))
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Time Period"
              value={draft.validityUnit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  validityUnit: event.target
                    .value as ActionDefinitionDraft['validityUnit'],
                }))
              }
            >
              <MenuItem value="days">Days</MenuItem>
              <MenuItem value="months">Months</MenuItem>
              <MenuItem value="years">Years</MenuItem>
            </TextField>
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          multiple
          freeSolo
          options={existingActionNames}
          value={draft.alternateNames}
          onChange={(_, values) =>
            setDraft((current) => ({
              ...current,
              alternateNames: normalizeStringList(values),
            }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Alternate Names"
              helperText="Type a name and press Enter to add it."
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

export function CustomFieldSidePanel({
  title,
  field,
  existingNames,
  onClose,
  onSave,
}: {
  title: string;
  field?: CustomField;
  existingNames: string[];
  onClose: () => void;
  onSave: (previousName: string | undefined, field: CustomField) => void;
}) {
  const [draft, setDraft] = useState<CustomFieldDraft>(() =>
    customFieldToDraft(field)
  );
  const trimmedName = draft.name.trim();
  const duplicateName =
    trimmedName.length > 0 &&
    trimmedName !== field?.name &&
    existingNames.includes(trimmedName);
  const validValues = normalizeStringList(draft.validValues);
  const canSave = trimmedName.length > 0 && !duplicateName;

  function save() {
    if (!canSave) return;

    onSave(
      field?.name,
      new CustomField({
        name: trimmedName,
        type: draft.type,
        validation: draft.validationEnabled
          ? CustomFieldValidation.SuggestOnly
          : undefined,
        validValues:
          draft.type === CustomFieldType.Boolean || validValues.length === 0
            ? undefined
            : validValues,
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={520}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          autoFocus
          label="Name"
          value={draft.name}
          error={duplicateName}
          helperText={duplicateName ? 'Name must be unique.' : undefined}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          select
          label="Type"
          value={draft.type}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              type: Number(event.target.value) as CustomFieldType,
              validationEnabled:
                Number(event.target.value) === CustomFieldType.Boolean
                  ? false
                  : current.validationEnabled,
              validValues:
                Number(event.target.value) === CustomFieldType.Boolean
                  ? []
                  : current.validValues,
            }))
          }
        >
          {enumOptions(CustomFieldType).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {draft.type !== CustomFieldType.Boolean && (
        <>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={draft.validationEnabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      validationEnabled: event.target.checked,
                    }))
                  }
                />
              }
              label="Suggestions Only"
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              multiple
              freeSolo
              options={[]}
              value={draft.validValues}
              onChange={(_, values) =>
                setDraft((current) => ({
                  ...current,
                  validValues: normalizeStringList(values),
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Valid Values"
                  helperText='Start typing and press "Enter" to add a new item.'
                />
              )}
            />
          </Grid>
        </>
      )}

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

export function RequirementSidePanel({
  title,
  requirement,
  actionNames,
  existingActionNames,
  onClose,
  onSave,
}: {
  title: string;
  requirement?: RequirementDefinition;
  actionNames: string[];
  existingActionNames: string[];
  onClose: () => void;
  onSave: (
    previousName: string | undefined,
    requirement: RequirementDefinition
  ) => void;
}) {
  const [draft, setDraft] = useState<RequirementDraft>(() =>
    requirementToDraft(requirement)
  );
  const trimmedActionName = draft.actionName.trim();
  const duplicateName =
    trimmedActionName.length > 0 &&
    trimmedActionName !== requirement?.actionName &&
    existingActionNames.includes(trimmedActionName);
  const unknownActionName =
    trimmedActionName.length > 0 && !actionNames.includes(trimmedActionName);
  const canSave =
    trimmedActionName.length > 0 && !duplicateName && !unknownActionName;

  function save() {
    if (!canSave) return;
    onSave(
      requirement?.actionName,
      new RequirementDefinition({
        actionName: trimmedActionName,
        isRequired: draft.isRequired,
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={520}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          options={actionNames}
          value={draft.actionName || null}
          onChange={(_, value) =>
            setDraft((current) => ({ ...current, actionName: value ?? '' }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              required
              label="Action Name"
              error={duplicateName || unknownActionName}
              helperText={
                duplicateName
                  ? 'Action name is already referenced in this list.'
                  : unknownActionName
                    ? 'Action name must exist in Action Definitions.'
                    : undefined
              }
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.isRequired}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  isRequired: event.target.checked,
                }))
              }
            />
          }
          label="Required"
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

export function MonitoringRequirementSidePanel({
  title,
  requirement,
  actionNames,
  existingActionNames,
  onClose,
  onSave,
}: {
  title: string;
  requirement?: MonitoringRequirement;
  actionNames: string[];
  existingActionNames: string[];
  onClose: () => void;
  onSave: (
    previousName: string | undefined,
    requirement: MonitoringRequirement
  ) => void;
}) {
  const [draft, setDraft] = useState<MonitoringRequirementDraft>(() =>
    monitoringRequirementToDraft(requirement)
  );
  const trimmedActionName = draft.actionName.trim();
  const previousName = requirement?.action?.actionName;
  const duplicateName =
    trimmedActionName.length > 0 &&
    trimmedActionName !== previousName &&
    existingActionNames.includes(trimmedActionName);
  const unknownActionName =
    trimmedActionName.length > 0 && !actionNames.includes(trimmedActionName);
  const delayAmountIsValid =
    !draft.delayEnabled ||
    typeof parseValidityAmount(draft.delayAmount) !== 'undefined';
  const canSave =
    trimmedActionName.length > 0 &&
    !duplicateName &&
    !unknownActionName &&
    delayAmountIsValid;

  function save() {
    if (!canSave) return;

    onSave(
      previousName,
      new MonitoringRequirement({
        action: new RequirementDefinition({
          actionName: trimmedActionName,
          isRequired: draft.isRequired,
        }),
        recurrence: new OneTimeRecurrencePolicy({
          delay: toTimeSpanString(
            draft.delayEnabled,
            draft.delayAmount,
            draft.delayUnit
          ),
        }),
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={520}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          options={actionNames}
          value={draft.actionName || null}
          onChange={(_, value) =>
            setDraft((current) => ({ ...current, actionName: value ?? '' }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              required
              label="Action Name"
              error={duplicateName || unknownActionName}
              helperText={
                duplicateName
                  ? 'Action name is already referenced in this list.'
                  : unknownActionName
                    ? 'Action name must exist in Action Definitions.'
                    : undefined
              }
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.isRequired}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  isRequired: event.target.checked,
                }))
              }
            />
          }
          label="Required"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.delayEnabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  delayEnabled: event.target.checked,
                }))
              }
            />
          }
          label="Recurrence Delay"
        />
      </Grid>

      {draft.delayEnabled && (
        <>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Repeat After"
              value={draft.delayAmount}
              error={!delayAmountIsValid}
              helperText={
                delayAmountIsValid
                  ? undefined
                  : 'Enter a positive whole number.'
              }
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  delayAmount: event.target.value,
                }))
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Time Period"
              value={draft.delayUnit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  delayUnit: event.target.value as ValidityUnit,
                }))
              }
            >
              <MenuItem value="days">Days</MenuItem>
              <MenuItem value="months">Months</MenuItem>
              <MenuItem value="years">Years</MenuItem>
            </TextField>
          </Grid>
        </>
      )}

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

export function ArrangementFunctionSidePanel({
  arrangementFunction,
  existingFunctionNames,
  volunteerRoles,
  volunteerFamilyRoles,
  personOptions,
  onClose,
  onSave,
}: {
  arrangementFunction?: ArrangementFunction;
  existingFunctionNames: string[];
  volunteerRoles: string[];
  volunteerFamilyRoles: string[];
  personOptions: PersonOption[];
  onClose: () => void;
  onSave: (
    previousName: string | undefined,
    arrangementFunction: ArrangementFunction
  ) => void;
}) {
  const [draft, setDraft] = useState<ArrangementFunctionDraft>(() =>
    arrangementFunctionToDraft(arrangementFunction)
  );
  const trimmedName = draft.functionName.trim();
  const duplicateName =
    trimmedName.length > 0 &&
    trimmedName !== arrangementFunction?.functionName &&
    existingFunctionNames.includes(trimmedName);
  const eligibleIndividualVolunteerRoles = normalizeStringList(
    draft.eligibleIndividualVolunteerRoles
  );
  const eligibleVolunteerFamilyRoles = normalizeStringList(
    draft.eligibleVolunteerFamilyRoles
  );
  const eligiblePeople = normalizeStringList(draft.eligiblePeople);
  const selectedPeople = personOptions.filter((person) =>
    eligiblePeople.includes(person.id)
  );
  const canSave = trimmedName.length > 0 && !duplicateName;

  function save() {
    if (!canSave) return;

    onSave(
      arrangementFunction?.functionName,
      new ArrangementFunction({
        functionName: trimmedName,
        requirement: draft.requirement,
        eligibleIndividualVolunteerRoles:
          eligibleIndividualVolunteerRoles.length > 0
            ? eligibleIndividualVolunteerRoles
            : undefined,
        eligibleVolunteerFamilyRoles:
          eligibleVolunteerFamilyRoles.length > 0
            ? eligibleVolunteerFamilyRoles
            : undefined,
        eligiblePeople: eligiblePeople.length > 0 ? eligiblePeople : undefined,
        variants: arrangementFunction?.variants ?? [],
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={560}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">
          {arrangementFunction ? 'Edit Arrangement Function' : 'Add Arrangement Function'}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          autoFocus
          label="Function"
          value={draft.functionName}
          error={duplicateName}
          helperText={duplicateName ? 'Function must be unique.' : undefined}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              functionName: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          select
          label="Requirement"
          value={draft.requirement}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              requirement: Number(event.target.value) as FunctionRequirement,
            }))
          }
        >
          {enumOptions(FunctionRequirement).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          multiple
          options={volunteerRoles}
          value={draft.eligibleIndividualVolunteerRoles}
          onChange={(_, values) =>
            setDraft((current) => ({
              ...current,
              eligibleIndividualVolunteerRoles: values,
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Eligible Individual Volunteer Roles" />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          multiple
          options={volunteerFamilyRoles}
          value={draft.eligibleVolunteerFamilyRoles}
          onChange={(_, values) =>
            setDraft((current) => ({
              ...current,
              eligibleVolunteerFamilyRoles: values,
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Eligible Volunteer Family Roles" />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          multiple
          options={personOptions}
          value={selectedPeople}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, values) =>
            setDraft((current) => ({
              ...current,
              eligiblePeople: values.map((value) => value.id),
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Eligible People" />
          )}
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

export function FunctionAssignmentPolicySidePanel({
  title,
  policy,
  existingAssignmentRoles,
  locationRoles,
  volunteerRoles,
  volunteerFamilyRoles,
  personOptions,
  onClose,
  onSave,
}: {
  title: string;
  policy?: FunctionAssignmentPolicy;
  existingAssignmentRoles: string[];
  locationRoles: string[];
  volunteerRoles: string[];
  volunteerFamilyRoles: string[];
  personOptions: PersonOption[];
  onClose: () => void;
  onSave: (
    previousRole: string | undefined,
    policy: FunctionAssignmentPolicy
  ) => void;
}) {
  const [draft, setDraft] = useState<FunctionAssignmentPolicyDraft>(() =>
    functionAssignmentPolicyToDraft(policy)
  );
  const trimmedRole = draft.assignmentRole.trim();
  const duplicateRole =
    trimmedRole.length > 0 &&
    trimmedRole !== policy?.assignmentRole &&
    existingAssignmentRoles.includes(trimmedRole);
  const eligibleLocationRoles = normalizeStringList(draft.eligibleLocationRoles);
  const eligibleIndividualVolunteerRoles = normalizeStringList(
    draft.eligibleIndividualVolunteerRoles
  );
  const eligibleVolunteerFamilyRoles = normalizeStringList(
    draft.eligibleVolunteerFamilyRoles
  );
  const eligiblePeople = normalizeStringList(draft.eligiblePeople);
  const selectedPeople = personOptions.filter((person) =>
    eligiblePeople.includes(person.id)
  );
  const hasEligibility =
    eligibleLocationRoles.length +
      eligibleIndividualVolunteerRoles.length +
      eligibleVolunteerFamilyRoles.length +
      eligiblePeople.length >
    0;
  const canSave =
    trimmedRole.length > 0 &&
    !duplicateRole &&
    hasEligibility;

  function save() {
    if (!canSave) return;

    onSave(
      policy?.assignmentRole,
      new FunctionAssignmentPolicy({
        assignmentRole: trimmedRole,
        eligibility: new FunctionAssignmentEligibility({
          eligibleLocationRoles,
          eligibleIndividualVolunteerRoles,
          eligibleVolunteerFamilyRoles,
          eligiblePeople,
        }),
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={560}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Function"
          value={draft.assignmentRole}
          error={duplicateRole}
          helperText={duplicateRole ? 'Function must be unique.' : undefined}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              assignmentRole: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          multiple
          options={locationRoles}
          value={draft.eligibleLocationRoles}
          onChange={(_, values) =>
            setDraft((current) => ({
              ...current,
              eligibleLocationRoles: values,
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Eligible Location Roles" />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          multiple
          options={volunteerRoles}
          value={draft.eligibleIndividualVolunteerRoles}
          onChange={(_, values) =>
            setDraft((current) => ({
              ...current,
              eligibleIndividualVolunteerRoles: values,
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Eligible Individual Volunteer Roles" />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          multiple
          options={volunteerFamilyRoles}
          value={draft.eligibleVolunteerFamilyRoles}
          onChange={(_, values) =>
            setDraft((current) => ({
              ...current,
              eligibleVolunteerFamilyRoles: values,
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Eligible Volunteer Family Roles" />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          multiple
          options={personOptions}
          value={selectedPeople}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, values) =>
            setDraft((current) => ({
              ...current,
              eligiblePeople: values.map((value) => value.id),
            }))
          }
          renderInput={(params) => (
            <TextField {...params} label="Eligible People" />
          )}
        />
      </Grid>

      {!hasEligibility && (
        <Grid item xs={12}>
          <Typography variant="body2" color="error">
            At least one eligibility dimension is required.
          </Typography>
        </Grid>
      )}

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

export function ArrangementPolicySidePanel({
  arrangement,
  existingArrangementTypes,
  onClose,
  onSave,
}: {
  arrangement?: ArrangementPolicy;
  existingArrangementTypes: string[];
  onClose: () => void;
  onSave: (
    previousType: string | undefined,
    arrangement: ArrangementPolicy
  ) => void;
}) {
  const [draft, setDraft] = useState<ArrangementPolicyDraft>(() =>
    arrangementPolicyToDraft(arrangement)
  );
  const trimmedType = draft.arrangementType.trim();
  const duplicateType =
    trimmedType.length > 0 &&
    trimmedType !== arrangement?.arrangementType &&
    existingArrangementTypes.includes(trimmedType);
  const canSave = trimmedType.length > 0 && !duplicateType;

  function save() {
    if (!canSave) return;

    onSave(
      arrangement?.arrangementType,
      new ArrangementPolicy({
        requiredSetupActions_PRE_MIGRATION:
          arrangement?.requiredSetupActions_PRE_MIGRATION ?? [],
        requiredMonitoringActions_PRE_MIGRATION:
          arrangement?.requiredMonitoringActions_PRE_MIGRATION ?? [],
        requiredCloseoutActionNames_PRE_MIGRATION:
          arrangement?.requiredCloseoutActionNames_PRE_MIGRATION ?? [],
        arrangementType: trimmedType,
        childInvolvement: draft.childInvolvement,
        arrangementFunctions: arrangement?.arrangementFunctions ?? [],
        requiredSetupActionNames: arrangement?.requiredSetupActionNames ?? [],
        requiredMonitoringActions: arrangement?.requiredMonitoringActions ?? [],
        requiredCloseoutActionNames:
          arrangement?.requiredCloseoutActionNames ?? [],
        requiredSetupActions: arrangement?.requiredSetupActions ?? [],
        requiredMonitoringActionsNew:
          arrangement?.requiredMonitoringActionsNew ?? [],
        requiredCloseoutActions: arrangement?.requiredCloseoutActions ?? [],
        supersededAtUtc:
          draft.superseded && draft.supersededAtUtc
            ? new Date(draft.supersededAtUtc)
            : undefined,
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={560}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">
          {arrangement ? 'Edit Arrangement Policy' : 'Add Arrangement Policy'}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Arrangement Type"
          value={draft.arrangementType}
          error={duplicateType}
          helperText={
            duplicateType ? 'Arrangement type must be unique.' : undefined
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              arrangementType: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          select
          label="Child Involvement"
          value={draft.childInvolvement}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              childInvolvement: Number(event.target.value) as ChildInvolvement,
            }))
          }
        >
          {enumOptions(ChildInvolvement).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.superseded}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  superseded: event.target.checked,
                }))
              }
            />
          }
          label="Superseded"
        />
      </Grid>

      {draft.superseded && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Superseded Date"
            value={draft.supersededAtUtc}
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                supersededAtUtc: event.target.value,
              }))
            }
          />
        </Grid>
      )}

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

export function VolunteerRolePolicyVersionSidePanel({
  title,
  roleName,
  version,
  existingRoleNames,
  existingVersionsForRole,
  family,
  actionNames,
  onClose,
  onSave,
}: {
  title: string;
  roleName?: string;
  version?: VolunteerRolePolicyVersion | VolunteerFamilyRolePolicyVersion;
  existingRoleNames: string[];
  existingVersionsForRole: string[];
  family: boolean;
  actionNames: string[];
  onClose: () => void;
  onSave: (
    previousRoleName: string | undefined,
    previousVersion: string | undefined,
    roleName: string,
    version: VolunteerRolePolicyVersion | VolunteerFamilyRolePolicyVersion
  ) => void;
}) {
  const [draft, setDraft] = useState<VolunteerRolePolicyVersionDraft>(() =>
    volunteerRolePolicyVersionToDraft(roleName, version, family)
  );
  const trimmedRoleName = draft.roleName.trim();
  const trimmedVersion = draft.version.trim();
  const requirements = family
    ? parseVolunteerFamilyRequirements(draft.requirements)
    : parseVolunteerRequirements(draft.requirements);
  const referencedActions = requirements.map(
    (requirement) => requirement.actionName
  );
  const unknownActions = referencedActions.filter(
    (actionName) => !actionNames.includes(actionName)
  );
  const duplicateVersion =
    trimmedVersion.length > 0 &&
    (trimmedRoleName !== roleName || trimmedVersion !== version?.version) &&
    existingVersionsForRole.includes(trimmedVersion);
  const canSave =
    trimmedRoleName.length > 0 &&
    trimmedVersion.length > 0 &&
    !duplicateVersion &&
    unknownActions.length === 0;

  function save() {
    if (!canSave) return;

    onSave(
      roleName,
      version?.version,
      trimmedRoleName,
      family
        ? new VolunteerFamilyRolePolicyVersion({
            version: trimmedVersion,
            supersededAtUtc:
              draft.superseded && draft.supersededAtUtc
                ? new Date(draft.supersededAtUtc)
                : undefined,
            requirements: requirements as VolunteerFamilyApprovalRequirement[],
          })
        : new VolunteerRolePolicyVersion({
            version: trimmedVersion,
            supersededAtUtc:
              draft.superseded && draft.supersededAtUtc
                ? new Date(draft.supersededAtUtc)
                : undefined,
            requirements: requirements as VolunteerApprovalRequirement[],
          })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={580}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label={family ? 'Volunteer Family Role Type' : 'Volunteer Role Type'}
          value={draft.roleName}
          helperText={
            existingRoleNames.includes(trimmedRoleName)
              ? 'Editing an existing role policy.'
              : 'A new role policy will be created.'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              roleName: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Version"
          value={draft.version}
          error={duplicateVersion}
          helperText={
            duplicateVersion
              ? 'Version must be unique for this role.'
              : undefined
          }
          onChange={(event) =>
            setDraft((current) => ({ ...current, version: event.target.value }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.superseded}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  superseded: event.target.checked,
                }))
              }
            />
          }
          label="Superseded"
        />
      </Grid>

      {draft.superseded && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Superseded Date"
            value={draft.supersededAtUtc}
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                supersededAtUtc: event.target.value,
              }))
            }
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          minRows={5}
          label="Requirements"
          value={draft.requirements}
          error={unknownActions.length > 0}
          helperText={
            unknownActions.length > 0
              ? `Unknown Action Definitions: ${unknownActions.join(', ')}`
              : family
                ? 'One per line: Stage | Action Name | Scope'
                : 'One per line: Stage | Action Name'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              requirements: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
