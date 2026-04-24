import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';

export interface LinkReferralToExistingCaseOption {
  id: string;
  label: string;
}

interface LinkReferralToExistingCaseDialogProps {
  open: boolean;
  working?: boolean;
  caseOptions: LinkReferralToExistingCaseOption[];
  selectedCaseId: string;
  onSelectedCaseIdChange: (caseId: string) => void;
  onClose: () => void;
  onLink: () => void;
}

export function LinkReferralToExistingCaseDialog({
  open,
  working = false,
  caseOptions,
  selectedCaseId,
  onSelectedCaseIdChange,
  onClose,
  onLink,
}: LinkReferralToExistingCaseDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={working ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Link this referral to an existing case?</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Looks like this family already has cases. Pick one below to link this
          referral. This will also accept the referral.
        </Typography>

        <FormControl fullWidth>
          <RadioGroup
            value={selectedCaseId}
            onChange={(e) => onSelectedCaseIdChange(e.target.value)}
          >
            {caseOptions.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio />}
                label={option.label}
                disabled={working}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button
          color="secondary"
          variant="contained"
          onClick={onClose}
          disabled={working}
        >
          Not now
        </Button>

        <Button
          variant="contained"
          onClick={onLink}
          disabled={!selectedCaseId || working}
        >
          Link
        </Button>
      </DialogActions>
    </Dialog>
  );
}
