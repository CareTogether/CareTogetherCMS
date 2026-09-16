import { Alert } from '@mui/material';
import {
  GridChartsPanel,
  type GridChartsPanelProps,
} from '@mui/x-data-grid-premium';

export function VolunteersChartsPanel({
  pivotActive,
  ...props
}: GridChartsPanelProps & { pivotActive: boolean }) {
  if (!pivotActive)
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Use Pivot to group and summarize volunteer family data, then create a
        chart from the aggregated results.
      </Alert>
    );
  return <GridChartsPanel {...props} />;
}
