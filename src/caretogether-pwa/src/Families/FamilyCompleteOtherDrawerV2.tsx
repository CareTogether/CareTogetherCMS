import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { ApprovalWorkflowLauncherV2 } from './ApprovalWorkflowLauncherV2';

type FamilyCompleteOtherDrawerV2Props = {
  familyId: string;
  open: boolean;
  onClose: () => void;
};

export function FamilyCompleteOtherDrawerV2({
  familyId,
  open,
  onClose,
}: FamilyCompleteOtherDrawerV2Props) {
  return (
    <Drawer
      anchor="right"
      aria-labelledby="family-complete-other-title"
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
      {open && (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography
              className="ph-unmask"
              id="family-complete-other-title"
              variant="h5"
            >
              Complete Other
            </Typography>
            <IconButton aria-label="close complete other" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <ApprovalWorkflowLauncherV2
            key={familyId}
            subject={{ scope: 'family', id: familyId, label: 'Family' }}
            context={{ kind: 'Volunteer Family', volunteerFamilyId: familyId }}
            onSuccess={onClose}
          />
        </Stack>
      )}
    </Drawer>
  );
}
