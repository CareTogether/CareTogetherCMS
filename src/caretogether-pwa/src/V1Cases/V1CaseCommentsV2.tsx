import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { CombinedFamilyInfo, Permission, V1Case } from '../GeneratedClient';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { useFamilyPermissions } from '../Model/SessionModel';

type V1CaseCommentsV2Props = {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
  compact?: boolean;
};

export function V1CaseCommentsV2({
  partneringFamily,
  v1CaseId,
  compact = false,
}: V1CaseCommentsV2Props) {
  const v1CasesModel = useV1CasesModel();
  const permissions = useFamilyPermissions(partneringFamily);

  const openV1Cases: V1Case[] = partneringFamily.partneringFamilyInfo
    ?.openV1Case
    ? [partneringFamily.partneringFamilyInfo.openV1Case]
    : [];

  const closedV1Cases: V1Case[] =
    partneringFamily?.partneringFamilyInfo?.closedV1Cases === undefined
      ? []
      : [...partneringFamily.partneringFamilyInfo.closedV1Cases].sort(
          (r1, r2) =>
            (r1.closedAtUtc?.getTime() ?? 0) - (r2.closedAtUtc?.getTime() ?? 0)
        );

  const allV1Cases = [...openV1Cases, ...closedV1Cases];
  const selectedCaseComment =
    allV1Cases.find((item) => item.id === v1CaseId)?.comments ?? '';

  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(selectedCaseComment);

  useEffect(() => {
    setComment(selectedCaseComment);
  }, [selectedCaseComment]);

  async function handleSave() {
    await v1CasesModel.updateV1CaseComments(
      partneringFamily.family!.id!,
      v1CaseId,
      comment
    );
    setOpen(false);
  }

  return (
    <Box sx={{ width: '100%', mb: compact ? 0 : 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: compact ? 0.5 : 1,
        }}
      >
        <Typography
          className="ph-unmask"
          variant={compact ? 'caption' : 'h3'}
          color={compact ? 'text.secondary' : undefined}
          sx={compact ? { fontWeight: 600 } : undefined}
        >
          Comments
        </Typography>

        {permissions(Permission.EditV1Case) && (
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          lineHeight: compact ? 1.45 : 1.5,
        }}
      >
        {comment ? (
          comment
        ) : (
          <Typography color="textDisabled">No case comments yet.</Typography>
        )}
      </Box>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Case Comment</DialogTitle>

        <DialogContent>
          <TextField
            id="v1case-comments"
            helperText="Case comment is visible to everyone."
            placeholder="Space for any general notes about the Case, upcoming plans, etc."
            multiline
            fullWidth
            variant="outlined"
            minRows={6}
            maxRows="20"
            size="medium"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
