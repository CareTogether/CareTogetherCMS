import { Box, Chip } from '@mui/material';
import { ArrangementPhase } from '../GeneratedClient';
import { arrangementPhaseColor } from './Arrangements/arrangementPresentationV2';
import type { ClientArrangementSummaryItemV2 } from './useClientsBrowserViewModel';

type ClientArrangementSummaryCellV2Props = {
  arrangementRows: ClientArrangementSummaryItemV2[];
};

const arrangementPhaseSummaries = [
  { phase: ArrangementPhase.SettingUp, label: 'Setup' },
  { phase: ArrangementPhase.ReadyToStart, label: 'Ready to start' },
  { phase: ArrangementPhase.Started, label: 'Started' },
  { phase: ArrangementPhase.Cancelled, label: 'Cancelled' },
  { phase: ArrangementPhase.Ended, label: 'Ended' },
];

export function ClientArrangementSummaryCellV2({
  arrangementRows,
}: ClientArrangementSummaryCellV2Props) {
  if (arrangementRows.length === 0) {
    return null;
  }

  const phaseCounts = new Map<ArrangementPhase, number>();
  for (const row of arrangementRows) {
    if (row.phase === undefined) continue;
    phaseCounts.set(row.phase, (phaseCounts.get(row.phase) ?? 0) + 1);
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, minWidth: 0 }}>
      {arrangementPhaseSummaries.flatMap(({ phase, label }) => {
        const count = phaseCounts.get(phase) ?? 0;
        return count > 0
          ? [
              <Chip
                color={arrangementPhaseColor(phase)}
                key={phase}
                label={`${count} ${label}`}
                size="small"
                variant="outlined"
              />,
            ]
          : [];
      })}
    </Box>
  );
}
