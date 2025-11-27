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
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import { CombinedFamilyInfo, Permission, V1Case } from '../GeneratedClient';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { useFamilyPermissions } from '../Model/SessionModel';
import { ReadMoreText } from '../Generic/Forms/ReadMoreText';

type V1CaseCommentsProps = {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
};

export function V1CaseComments({
  partneringFamily,
  v1CaseId,
}: V1CaseCommentsProps) {
  const v1CasesModel = useV1CasesModel();
  const permissions = useFamilyPermissions(partneringFamily);

  const openV1Cases: V1Case[] = partneringFamily.partneringFamilyInfo
    ?.openV1Case
    ? [partneringFamily.partneringFamilyInfo.openV1Case]
    : [];

  const closedV1Cases: V1Case[] =
    partneringFamily?.partneringFamilyInfo?.closedV1Cases === undefined
      ? []
      : [...partneringFamily.partneringFamilyInfo.closedV1Cases!].sort(
          (r1, r2) => r1.closedAtUtc!.getTime() - r2.closedAtUtc!.getTime()
        );

  const allV1Cases = [...openV1Cases, ...closedV1Cases];

  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(
    allV1Cases.find((item) => item.id === v1CaseId)?.comments ?? ''
  );

  async function handleSave() {
    await v1CasesModel.updateV1CaseComments(
      partneringFamily.family!.id!,
      v1CaseId,
      comment
    );
    setOpen(false);
  }

  return (
    <Box sx={{ width: '100%' }} mb={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography className="ph-unmask" variant="h3">
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
          lineHeight: 1.5,
          fontSize: '0.95rem',
          paddingRight: 1,
        }}
      >
        {comment ? (
          <>
            <ReadMoreText text={comment} />
          </>
        ) : (
          <Typography color="text.secondary">No comments yet.</Typography>
        )}
      </Box>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Case Comments</DialogTitle>

        <DialogContent>
          <TextField
            id="v1case-comments"
            helperText="Case comments are visible to everyone."
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
