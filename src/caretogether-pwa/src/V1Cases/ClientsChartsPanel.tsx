import { Alert } from '@mui/material';
import {
  GridChartsPanel,
  type GridChartsPanelProps,
} from '@mui/x-data-grid-premium';

export function ClientsChartsPanel({
  pivotActive,
  ...props
}: GridChartsPanelProps & { pivotActive: boolean }) {
  if (!pivotActive) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Use Pivot to group by a family, adult, or child field. Count is added as
        a value automatically; then create a chart from the results.
      </Alert>
    );
  }

  return <GridChartsPanel {...props} />;
}
