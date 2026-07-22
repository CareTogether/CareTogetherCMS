import { Box, Chip } from '@mui/material';
import { ArrangementRowV2 } from './Arrangements/arrangementViewModel';
import { arrangementPhaseColor } from './Arrangements/arrangementPresentationV2';

type ClientArrangementSummaryCellV2Props = {
  arrangementRows: ArrangementRowV2[];
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
          color={arrangementPhaseColor(row.source.phase)}
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
