import { Chip } from '@mui/material';
import {
  approvalLedgerStatusPresentation,
  type ApprovalLedgerStatusRow,
} from './approvalLedgerStatusPresentation';

export function ApprovalLedgerStatusChip({
  row,
}: {
  row: ApprovalLedgerStatusRow;
}) {
  const { label, color, variant } = approvalLedgerStatusPresentation(row);

  return (
    <Chip
      className="ph-unmask"
      color={color}
      label={label}
      size="small"
      variant={variant}
    />
  );
}
