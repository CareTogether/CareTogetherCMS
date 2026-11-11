import { Chip, Stack, type StackProps } from '@mui/material';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import {
  approvalLedgerStatusPresentation,
  type ApprovalLedgerStatusRow,
} from './approvalLedgerStatusPresentation';

type ApprovalLedgerStatusChipProps = {
  row: ApprovalLedgerStatusRow;
  direction?: StackProps['direction'];
};

export function ApprovalLedgerStatusChip({
  row,
  direction = 'row',
}: ApprovalLedgerStatusChipProps) {
  const { label, color, expiredOn } = approvalLedgerStatusPresentation(row);
  const expiredLabel = expiredOn
    ? `Expired ${formatUtcDateOnly(expiredOn)}`
    : undefined;

  return (
    <Stack
      direction={direction}
      spacing={0.5}
      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
    >
      <Chip className="ph-unmask" color={color} label={label} size="small" />
      {expiredLabel && (
        <Chip
          className="ph-unmask"
          label={expiredLabel}
          size="small"
          variant="outlined"
          sx={{ color: 'text.secondary', borderColor: 'divider' }}
        />
      )}
    </Stack>
  );
}
