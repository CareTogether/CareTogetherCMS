import { Box, Chip } from '@mui/material';
import { arrangementPhaseColor } from './Arrangements/arrangementPresentationV2';
import type { ClientArrangementSummaryItemV2 } from './useClientsBrowserViewModel';

type ClientArrangementSummaryCellV2Props = {
  arrangementRows: ClientArrangementSummaryItemV2[];
};

const maxVisibleArrangements = 4;

export function ClientArrangementSummaryCellV2({
  arrangementRows,
}: ClientArrangementSummaryCellV2Props) {
  if (arrangementRows.length === 0) {
    return null;
  }

  const visibleArrangements = arrangementRows.slice(0, maxVisibleArrangements);
  const overflowCount = arrangementRows.length - visibleArrangements.length;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, minWidth: 0 }}>
      {visibleArrangements.map((row) => (
        <Chip
          color={arrangementPhaseColor(row.phase)}
          key={row.id}
          label={`${row.arrangementType} - ${row.statusLabel}`}
          size="small"
          variant="outlined"
        />
      ))}
      {overflowCount > 0 && (
        <Chip label={`+${overflowCount}`} size="small" variant="outlined" />
      )}
    </Box>
  );
}
