import { Button, Stack, Typography } from '@mui/material';

type ApprovalWorkflowConfirmationSectionV2Props = {
  title: string;
  description: string;
  buttonLabel: string;
  disabled?: boolean;
  loading?: boolean;
  warningText?: string;
  onConfirm: () => Promise<void>;
};

export function ApprovalWorkflowConfirmationSectionV2({
  title,
  description,
  buttonLabel,
  disabled,
  loading,
  warningText,
  onConfirm,
}: ApprovalWorkflowConfirmationSectionV2Props) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography color="text.secondary" variant="body2">
        {description}
      </Typography>
      {warningText && (
        <Typography color="error" variant="body2">
          {warningText}
        </Typography>
      )}
      <Button
        aria-busy={loading}
        color="error"
        disabled={disabled || loading}
        onClick={onConfirm}
        variant="contained"
      >
        {loading ? 'Working...' : buttonLabel}
      </Button>
    </Stack>
  );
}
