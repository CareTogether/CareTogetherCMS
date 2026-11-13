import { Chip, Tooltip } from '@mui/material';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import {
  approvalLedgerStatusPresentation,
  approvalLedgerStatusTooltip,
  type ApprovalLedgerStatusRow,
} from './approvalLedgerStatusPresentation';

export function ApprovalLedgerStatusChip({
  row,
}: {
  row: ApprovalLedgerStatusRow;
}) {
  const { label, color, variant } = approvalLedgerStatusPresentation(row);
  const tooltip = approvalLedgerStatusTooltip(row, formatUtcDateOnly);
  const chip = (
    <Chip
      className="ph-unmask"
      color={color}
      label={label}
      size="small"
      variant={variant}
    />
  );

  if (!tooltip) {
    return chip;
  }

  return (
    <Tooltip describeChild title={tooltip}>
      {chip}
    </Tooltip>
  );
}
