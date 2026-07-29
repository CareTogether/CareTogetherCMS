import type { ChipProps } from '@mui/material';
import { ArrangementPhase } from '../../GeneratedClient';

export function arrangementPhaseColor(
  phase?: ArrangementPhase
): ChipProps['color'] {
  if (phase === ArrangementPhase.Ended) return 'success';
  if (phase === ArrangementPhase.Cancelled) return 'default';
  if (phase === ArrangementPhase.Started) return 'info';
  return 'warning';
}
