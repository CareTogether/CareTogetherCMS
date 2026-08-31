import { Alert, Button } from '@mui/material';

type ActiveFiltersAlertProps = {
  onClear: () => void;
};

export function ActiveFiltersAlert({ onClear }: ActiveFiltersAlertProps) {
  return (
    <Alert
      action={
        <Button
          className="ph-unmask"
          color="inherit"
          onClick={onClear}
          size="small"
        >
          Clear filters
        </Button>
      }
      className="ph-unmask"
      severity="warning"
      sx={{ alignItems: 'center' }}
    >
      Filters are active
    </Alert>
  );
}
