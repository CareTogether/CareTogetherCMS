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

  const openCases: V1Case[] = partneringFamily.partneringFamilyInfo?.openV1Case
    ? [partneringFamily.partneringFamilyInfo.openV1Case]
    : [];

  const closedCases: V1Case[] =
    partneringFamily?.partneringFamilyInfo?.closedV1Cases === undefined
      ? []
      : [...partneringFamily.partneringFamilyInfo.closedV1Cases!].sort(
          (r1, r2) => r1.closedAtUtc!.getTime() - r2.closedAtUtc!.getTime()
        );

  const allCases = [...openCases, ...closedCases];

  const savedValue =
    allCases.find((item) => item.id === v1CaseId)?.comments ?? '';

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(savedValue);

  async function handleSave() {
    await v1CasesModel.updateV1CaseComments(
      partneringFamily.family!.id!,
      v1CaseId,
      draft
    );
    setOpen(false);
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography className="ph-unmask" variant="h3">
          Comments
        </Typography>

        {permissions(Permission.EditV1Case) && (
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setDraft(savedValue);
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
        {savedValue ? (
          <>
            <ReadMoreText text={savedValue} />
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
            size="medium"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
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
