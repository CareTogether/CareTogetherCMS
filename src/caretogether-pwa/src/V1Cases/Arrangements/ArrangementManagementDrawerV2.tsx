import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ValidateDatePicker } from '../../Generic/Forms/ValidateDatePicker';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useDirectoryModel, usePersonLookup } from '../../Model/DirectoryModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { usePolicy } from '../../Model/PolicyModel';
import type { ArrangementRowV2 } from './arrangementViewModel';
import {
  getAvailablePolicyVersionsForParticipant,
  hasPolicyVersions,
  isArrangementPolicyAvailableForParticipant,
} from './arrangementPolicyVersions';

export type ArrangementManagementMode =
  | 'start'
  | 'end'
  | 'cancel'
  | 'reopen'
  | 'change-type'
  | 'delete';

type ArrangementManagementDrawerV2Props = {
  mode: ArrangementManagementMode | null;
  onClose: () => void;
  open: boolean;
  row: ArrangementRowV2 | null;
};

function modeTitle(mode: ArrangementManagementMode) {
  if (mode === 'start') return 'Start Arrangement';
  if (mode === 'end') return 'End Arrangement';
  if (mode === 'cancel') return 'Cancel Arrangement';
  if (mode === 'reopen') return 'Reopen Arrangement';
  if (mode === 'change-type') return 'Change Arrangement Type';
  return 'Delete Arrangement';
}

function primaryActionLabel(mode: ArrangementManagementMode) {
  if (mode === 'delete') return 'Delete Arrangement';
  if (mode === 'change-type') return 'Change Type';
  return 'Save';
}

function confirmationPrompt({
  arrangementType,
  mode,
  personName,
}: {
  arrangementType: string | undefined;
  mode: ArrangementManagementMode;
  personName: string;
}) {
  if (mode === 'start') {
    return `Do you want to start this ${arrangementType} arrangement for ${personName}?`;
  }

  if (mode === 'end') {
    return `Do you want to end this ${arrangementType} arrangement for ${personName}?`;
  }

  if (mode === 'cancel') {
    return `Do you want to cancel setting up this ${arrangementType} arrangement for ${personName}?`;
  }

  if (mode === 'reopen') {
    return `Do you want to reopen this already-ended ${arrangementType} arrangement for ${personName}?`;
  }

  if (mode === 'change-type') {
    return 'Choose the correct arrangement type. Requirements and available volunteer roles will follow the new type; existing assignments, completions, and exemptions will be kept.';
  }

  return `Are you sure you want to delete this ${arrangementType} arrangement for ${personName}?`;
}

function latestChildLocationTimestamp(row: ArrangementRowV2) {
  return row.source.childLocationHistory
    ?.slice()
    .sort((a, b) =>
      a.timestampUtc! < b.timestampUtc!
        ? 1
        : a.timestampUtc! > b.timestampUtc!
          ? -1
          : 0
    )[0]?.timestampUtc;
}

export function ArrangementManagementDrawerV2({
  mode,
  onClose,
  open,
  row,
}: ArrangementManagementDrawerV2Props) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId =
    familyIdMaybe.familyId ?? row?.partneringFamily.family?.id ?? '';
  const v1CasesModel = useV1CasesModel();
  const directoryModel = useDirectoryModel();
  const personLookup = usePersonLookup();
  const policy = usePolicy();
  const withBackdrop = useBackdrop();
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [dateHasError, setDateHasError] = useState(false);
  const [notes, setNotes] = useState('');
  const [arrangementType, setArrangementType] = useState('');
  const [arrangementPolicyVersion, setArrangementPolicyVersion] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!open) return;

    setDateValue(null);
    setDateHasError(false);
    setNotes('');
    setArrangementType(row?.source.arrangementType ?? '');
    setArrangementPolicyVersion(row?.source.arrangementPolicyVersion ?? null);
  }, [
    mode,
    open,
    row?.id,
    row?.source.arrangementPolicyVersion,
    row?.source.arrangementType,
  ]);

  if (!row || !mode) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box />
      </Drawer>
    );
  }

  const arrangement = row.source;
  const person = personLookup(familyId, arrangement.partneringFamilyPersonId);
  const personName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(' ');
  const title = modeTitle(mode);
  const saveLabel = primaryActionLabel(mode);
  const prompt = confirmationPrompt({
    arrangementType: arrangement.arrangementType,
    mode,
    personName,
  });
  const earliestAllowedEndDate =
    latestChildLocationTimestamp(row) ?? arrangement.startedAtUtc;
  const requiresDate = mode === 'start' || mode === 'end' || mode === 'cancel';
  const canSave = !requiresDate || (dateValue !== null && !dateHasError);
  const participantIsAdult = row.partneringFamily.family?.adults?.some(
    (adult) => adult.item1?.id === arrangement.partneringFamilyPersonId
  );
  const participantIsChild = row.partneringFamily.family?.children?.some(
    (child) => child.id === arrangement.partneringFamilyPersonId
  );
  const arrangementPolicies =
    policy.referralPolicy?.arrangementPolicies?.filter(
      (arrangementPolicy) =>
        arrangementPolicy.arrangementType === arrangement.arrangementType ||
        isArrangementPolicyAvailableForParticipant(
          arrangementPolicy,
          !!participantIsAdult,
          !!participantIsChild
        )
    ) ?? [];
  const selectedArrangementPolicy = arrangementPolicies.find(
    (arrangementPolicy) => arrangementPolicy.arrangementType === arrangementType
  );
  const availablePolicyVersions = selectedArrangementPolicy
    ? getAvailablePolicyVersionsForParticipant(
        selectedArrangementPolicy,
        !!participantIsAdult,
        !!participantIsChild
      )
    : [];
  const policyVersionIsRequired = selectedArrangementPolicy
    ? arrangementType !== arrangement.arrangementType &&
      hasPolicyVersions(selectedArrangementPolicy)
    : false;
  const canChangeType =
    arrangementType !== arrangement.arrangementType &&
    !!selectedArrangementPolicy &&
    (!policyVersionIsRequired || !!arrangementPolicyVersion);

  const selectArrangementType = (nextType: string) => {
    const nextPolicy = arrangementPolicies.find(
      (arrangementPolicy) => arrangementPolicy.arrangementType === nextType
    );
    const compatibleVersions = nextPolicy
      ? getAvailablePolicyVersionsForParticipant(
          nextPolicy,
          !!participantIsAdult,
          !!participantIsChild
        )
      : [];

    setArrangementType(nextType);
    setArrangementPolicyVersion(
      compatibleVersions.length === 1 ? compatibleVersions[0].version : null
    );
  };

  const save = async () => {
    await withBackdrop(async () => {
      if (mode === 'start') {
        dateValue?.setHours(0, 0, 0, 0);
        await v1CasesModel.startArrangement(
          familyId,
          row.v1Case.id!,
          arrangement.id!,
          dateValue!
        );
      }

      if (mode === 'end') {
        dateValue?.setHours(23, 59, 59, 999);
        await v1CasesModel.endArrangement(
          familyId,
          row.v1Case.id!,
          arrangement.id!,
          dateValue!
        );
      }

      if (mode === 'cancel') {
        await v1CasesModel.cancelArrangement(
          familyId,
          row.v1Case.id!,
          arrangement.id!,
          dateValue!
        );
      }

      if (mode === 'reopen') {
        let noteId: string | undefined;
        if (notes !== '') {
          noteId = crypto.randomUUID();
          await directoryModel.createDraftNote(familyId, noteId, notes);
        }
        await v1CasesModel.reopenArrangement(
          familyId,
          row.v1Case.id!,
          arrangement.id!,
          noteId || null
        );
      }

      if (mode === 'delete') {
        await v1CasesModel.deleteArrangement(
          familyId,
          row.v1Case.id!,
          arrangement.id!
        );
      }

      if (mode === 'change-type') {
        await v1CasesModel.changeArrangementType(
          familyId,
          row.v1Case.id!,
          arrangement.id!,
          arrangementType,
          arrangementPolicyVersion
        );
      }

      onClose();
    });
  };

  return (
    <Drawer
      anchor="right"
      aria-labelledby="arrangement-management-title"
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
              Arrangement Management
            </Typography>
            <Typography id="arrangement-management-title" variant="h5">
              {title}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {arrangement.arrangementType} for {personName}
            </Typography>
          </Box>
          <IconButton
            aria-label="close arrangement management"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body2">{prompt}</Typography>

        {mode === 'change-type' && (
          <Stack spacing={2}>
            <FormControl fullWidth required size="small">
              <InputLabel id="arrangement-type-label">
                Arrangement Type
              </InputLabel>
              <Select
                labelId="arrangement-type-label"
                label="Arrangement Type"
                value={arrangementType}
                onChange={(event) => selectArrangementType(event.target.value)}
              >
                {arrangementPolicies.map((arrangementPolicy) => (
                  <MenuItem
                    key={arrangementPolicy.arrangementType}
                    value={arrangementPolicy.arrangementType}
                  >
                    <span className="ph-unmask">
                      {arrangementPolicy.arrangementType}
                    </span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedArrangementPolicy && policyVersionIsRequired && (
              <FormControl fullWidth required size="small">
                <InputLabel id="arrangement-policy-version-label">
                  Policy Version
                </InputLabel>
                <Select
                  labelId="arrangement-policy-version-label"
                  label="Policy Version"
                  value={arrangementPolicyVersion ?? ''}
                  onChange={(event) =>
                    setArrangementPolicyVersion(event.target.value)
                  }
                >
                  <MenuItem value="" disabled>
                    Select a version
                  </MenuItem>
                  {availablePolicyVersions.map((policyVersion) => (
                    <MenuItem
                      key={policyVersion.version}
                      value={policyVersion.version}
                    >
                      <span className="ph-unmask">{policyVersion.version}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        )}

        {mode === 'start' && (
          <ValidateDatePicker
            label="When was this arrangement started?"
            value={dateValue}
            onChange={setDateValue}
            onErrorChange={setDateHasError}
            disableFuture
            textFieldProps={{
              fullWidth: true,
              required: true,
            }}
          />
        )}

        {mode === 'end' && (
          <ValidateDatePicker
            label="When was this arrangement ended?"
            value={dateValue}
            onChange={setDateValue}
            onErrorChange={setDateHasError}
            disableFuture
            minDate={earliestAllowedEndDate}
            textFieldProps={{
              fullWidth: true,
              required: true,
            }}
          />
        )}

        {mode === 'cancel' && (
          <ValidateDatePicker
            label="When was this arrangement cancelled?"
            value={dateValue}
            onChange={setDateValue}
            disableFuture
            onErrorChange={setDateHasError}
            textFieldProps={{
              fullWidth: true,
              required: true,
            }}
          />
        )}

        {mode === 'reopen' && (
          <TextField
            id="arrangement-reopen-notes"
            label="Notes"
            placeholder="Space for any general notes"
            multiline
            fullWidth
            variant="outlined"
            minRows={6}
            size="medium"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        )}

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={save}
            variant="contained"
            color={mode === 'delete' ? 'warning' : 'primary'}
            disabled={!canSave || (mode === 'change-type' && !canChangeType)}
          >
            {saveLabel}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
