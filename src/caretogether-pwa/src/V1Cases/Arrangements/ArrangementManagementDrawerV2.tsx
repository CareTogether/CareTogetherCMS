import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ValidateDatePicker } from '../../Generic/Forms/ValidateDatePicker';
import { useBackdrop } from '../../Hooks/useBackdrop';
import {
  useDirectoryModel,
  usePersonLookup,
} from '../../Model/DirectoryModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import type { ArrangementRowV2 } from './arrangementViewModel';

export type ArrangementManagementMode =
  | 'start'
  | 'end'
  | 'cancel'
  | 'reopen'
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
  return 'Delete Arrangement';
}

function primaryActionLabel(mode: ArrangementManagementMode) {
  if (mode === 'delete') return 'Delete Arrangement';
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
  const familyId = familyIdMaybe.familyId ?? row?.partneringFamily.family?.id ?? '';
  const v1CasesModel = useV1CasesModel();
  const directoryModel = useDirectoryModel();
  const personLookup = usePersonLookup();
  const withBackdrop = useBackdrop();
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [dateHasError, setDateHasError] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;

    setDateValue(null);
    setDateHasError(false);
    setNotes('');
  }, [mode, open, row?.id]);

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
  const requiresDate =
    mode === 'start' || mode === 'end' || mode === 'cancel';
  const canSave = !requiresDate || (dateValue !== null && !dateHasError);

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
          <IconButton aria-label="close arrangement management" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="body2">
          {prompt}
        </Typography>

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
            disabled={!canSave}
          >
            {saveLabel}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
